'use server';

import { createServerClient } from '@/lib/supabase/server';
import {
  profileUpdateSchema,
  onboardingProfileSchema,
  onboardingLocationSchema,
  shippingAddressSchema,
  usernameChangeSchema,
  reportUserSchema,
  RESERVED_USERNAMES,
} from '@/lib/validations/user';
import type { SellerEligibility, BuyerEligibility } from '@/types/database';

// ── Helper: get authenticated user ────────────────────────────────
async function getAuthUser() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return { supabase, user };
}

// ── Check username availability ───────────────────────────────────
export async function checkUsernameAvailability(username: string) {
  const normalized = username.toLowerCase().trim();

  if (normalized.length < 3) return { available: false, reason: 'Username must be at least 3 characters' };
  if (!/^[a-z0-9_]+$/.test(normalized)) return { available: false, reason: 'Only lowercase letters, numbers, and underscores' };
  if (RESERVED_USERNAMES.includes(normalized)) return { available: false, reason: 'This username is not available' };

  const supabase = await createServerClient();
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', normalized)
    .maybeSingle();

  // Also check reserved_usernames table
  const { data: reserved } = await supabase
    .from('reserved_usernames')
    .select('username')
    .eq('username', normalized)
    .maybeSingle();

  if (data || reserved) {
    return { available: false, reason: 'This username is already taken' };
  }

  return { available: true, reason: null };
}

// ── Update profile ────────────────────────────────────────────────
export async function updateProfile(input: Record<string, unknown>) {
  const { supabase, user } = await getAuthUser();
  const parsed = profileUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' };
  }

  const updateData: Record<string, unknown> = {};
  const d = parsed.data;
  if (d.display_name !== undefined) updateData.display_name = d.display_name || null;
  if (d.bio !== undefined) updateData.bio = d.bio || null;
  if (d.city !== undefined) updateData.city = d.city || null;
  if (d.country !== undefined) updateData.country = d.country;
  if (d.phone !== undefined) updateData.phone = d.phone || null;

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id);

  if (error) return { error: 'Failed to save changes. Please try again.' };
  return { success: true };
}

// ── Change username ───────────────────────────────────────────────
export async function changeUsername(input: { username: string }) {
  const { supabase, user } = await getAuthUser();
  const parsed = usernameChangeSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid username' };
  }

  const newUsername = parsed.data.username.toLowerCase();

  // Check if user changed username in the last 30 days
  const { data: profile } = await supabase
    .from('profiles')
    .select('username_changed_at')
    .eq('id', user.id)
    .single();

  if (profile?.username_changed_at) {
    const lastChange = new Date(profile.username_changed_at);
    const daysSince = (Date.now() - lastChange.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 30) {
      const daysLeft = Math.ceil(30 - daysSince);
      return { error: `You can change your username again in ${daysLeft} days` };
    }
  }

  // Check availability
  const availability = await checkUsernameAvailability(newUsername);
  if (!availability.available) {
    return { error: availability.reason };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      username: newUsername,
      username_changed_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    if (error.message.includes('profiles_username_key')) {
      return { error: 'This username is already taken' };
    }
    return { error: 'Failed to change username' };
  }

  return { success: true };
}

// ── Complete onboarding step: Profile ─────────────────────────────
export async function completeOnboardingProfile(input: Record<string, unknown>) {
  const { supabase, user } = await getAuthUser();
  const parsed = onboardingProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' };
  }

  const username = parsed.data.username.toLowerCase();

  // Check availability (excluding own record)
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .neq('id', user.id)
    .maybeSingle();

  if (existing) return { error: 'This username is already taken' };
  if (RESERVED_USERNAMES.includes(username)) return { error: 'This username is not available' };

  const { error } = await supabase
    .from('profiles')
    .update({
      username,
      display_name: parsed.data.display_name || null,
      bio: parsed.data.bio || null,
      onboarding_step: 'location',
    })
    .eq('id', user.id);

  if (error) {
    if (error.message.includes('profiles_username_key')) {
      return { error: 'This username is already taken' };
    }
    return { error: 'Failed to save. Please try again.' };
  }

  return { success: true };
}

// ── Complete onboarding step: Location ────────────────────────────
export async function completeOnboardingLocation(input: Record<string, unknown>) {
  const { supabase, user } = await getAuthUser();
  const parsed = onboardingLocationSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      country: parsed.data.country,
      city: parsed.data.city || null,
      onboarding_step: 'preferences',
    })
    .eq('id', user.id);

  if (error) return { error: 'Failed to save. Please try again.' };
  return { success: true };
}

// ── Complete onboarding (final) ───────────────────────────────────
export async function completeOnboarding() {
  const { supabase, user } = await getAuthUser();

  const { error } = await supabase
    .from('profiles')
    .update({
      onboarding_step: 'complete',
      onboarding_completed_at: new Date().toISOString(),
      status: 'active',
    })
    .eq('id', user.id);

  if (error) return { error: 'Failed to complete onboarding' };

  // Ensure supporting tables exist
  await supabase.from('notification_preferences').upsert({ user_id: user.id }, { onConflict: 'user_id' });
  await supabase.from('privacy_settings').upsert({ user_id: user.id }, { onConflict: 'user_id' });
  await supabase.from('user_private_details').upsert({ user_id: user.id }, { onConflict: 'user_id' });

  return { success: true };
}

// ── Upload avatar ─────────────────────────────────────────────────
export async function uploadAvatar(formData: FormData) {
  const { supabase, user } = await getAuthUser();
  const file = formData.get('avatar') as File;
  if (!file) return { error: 'No file provided' };

  // Validate file
  if (file.size > 5 * 1024 * 1024) return { error: 'Image must be under 5MB' };
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) return { error: 'Only JPG, PNG or WebP images are allowed' };

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true });

  if (uploadError) return { error: 'Failed to upload image. Please try again.' };

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);

  await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);

  return { success: true, url: publicUrl };
}

// ── Notification preferences ──────────────────────────────────────
export async function updateNotificationPrefs(prefs: Record<string, boolean>) {
  const { supabase, user } = await getAuthUser();

  const { error } = await supabase
    .from('notification_preferences')
    .upsert({ user_id: user.id, ...prefs }, { onConflict: 'user_id' });

  if (error) return { error: 'Failed to save notification preferences' };
  return { success: true };
}

// ── Privacy settings ──────────────────────────────────────────────
export async function updatePrivacySettings(settings: Record<string, unknown>) {
  const { supabase, user } = await getAuthUser();

  const { error } = await supabase
    .from('privacy_settings')
    .upsert({ user_id: user.id, ...settings }, { onConflict: 'user_id' });

  if (error) return { error: 'Failed to save privacy settings' };
  return { success: true };
}

// ── Seller preferences ────────────────────────────────────────────
export async function updateSellerPreferences(prefs: Record<string, unknown>) {
  const { supabase, user } = await getAuthUser();

  const { error } = await supabase
    .from('seller_preferences')
    .upsert({ user_id: user.id, ...prefs }, { onConflict: 'user_id' });

  if (error) return { error: 'Failed to save seller preferences' };
  return { success: true };
}

// ── Shipping addresses ────────────────────────────────────────────
export async function addShippingAddress(input: Record<string, unknown>) {
  const { supabase, user } = await getAuthUser();
  const parsed = shippingAddressSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || 'Invalid address' };

  // If this is the default, un-default others
  if (parsed.data.is_default) {
    await supabase.from('shipping_addresses').update({ is_default: false }).eq('user_id', user.id);
  }

  const { data, error } = await supabase
    .from('shipping_addresses')
    .insert({ user_id: user.id, ...parsed.data })
    .select('*')
    .single();

  if (error) return { error: 'Failed to save address' };
  return { success: true, address: data };
}

export async function deleteShippingAddress(addressId: string) {
  const { supabase, user } = await getAuthUser();

  const { error } = await supabase
    .from('shipping_addresses')
    .delete()
    .eq('id', addressId)
    .eq('user_id', user.id);

  if (error) return { error: 'Failed to delete address' };
  return { success: true };
}

// ── Private details ───────────────────────────────────────────────
export async function updatePrivateDetails(input: Record<string, unknown>) {
  const { supabase, user } = await getAuthUser();

  const { error } = await supabase
    .from('user_private_details')
    .upsert({ user_id: user.id, ...input }, { onConflict: 'user_id' });

  if (error) return { error: 'Failed to save details' };
  return { success: true };
}

// ── Check seller eligibility ──────────────────────────────────────
export async function checkSellerEligibility(): Promise<SellerEligibility> {
  const { supabase, user } = await getAuthUser();
  const missing: string[] = [];

  // 1. Must have completed onboarding
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, country, status, onboarding_step, accepted_seller_terms_at')
    .eq('id', user.id)
    .single();

  if (!profile) return { canSell: false, missing: ['Profile not found'] };
  if (profile.status === 'suspended' || profile.status === 'banned') {
    return { canSell: false, missing: ['Your account is restricted'] };
  }

  // 2. Must have a real username
  if (!profile.username || profile.username.startsWith('user_')) {
    missing.push('username');
  }

  // 3. Must have verified email
  if (!user.email_confirmed_at) {
    missing.push('email_verification');
  }

  // 4. Must have country set
  if (!profile.country) {
    missing.push('country');
  }

  // 5. Must have accepted seller terms
  if (!profile.accepted_seller_terms_at) {
    missing.push('seller_terms');
  }

  // 6. Onboarding must be at least past profile step
  if (profile.onboarding_step === 'profile') {
    missing.push('onboarding');
  }

  return { canSell: missing.length === 0, missing };
}

// ── Check buyer eligibility ───────────────────────────────────────
export async function checkBuyerEligibility(): Promise<BuyerEligibility> {
  const { supabase, user } = await getAuthUser();
  const missing: string[] = [];

  const { data: profile } = await supabase
    .from('profiles')
    .select('status')
    .eq('id', user.id)
    .single();

  if (!profile) return { canBuy: false, missing: ['Profile not found'] };
  if (profile.status === 'suspended' || profile.status === 'banned') {
    return { canBuy: false, missing: ['Your account is restricted'] };
  }

  // Must have verified email
  if (!user.email_confirmed_at) {
    missing.push('email_verification');
  }

  // Must have at least one shipping address
  const { count } = await supabase
    .from('shipping_addresses')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (!count || count === 0) {
    missing.push('shipping_address');
  }

  return { canBuy: missing.length === 0, missing };
}

// ── Report user ───────────────────────────────────────────────────
export async function reportUser(reportedId: string, input: Record<string, unknown>) {
  const { supabase, user } = await getAuthUser();
  if (user.id === reportedId) return { error: 'You cannot report yourself' };

  const parsed = reportUserSchema.safeParse(input);
  if (!parsed.success) return { error: 'Invalid report' };

  const { error } = await supabase.from('user_reports').insert({
    reporter_id: user.id,
    reported_id: reportedId,
    reason: parsed.data.reason,
    description: parsed.data.description || null,
  });

  if (error) return { error: 'Failed to submit report' };
  return { success: true };
}

// ── Block user ────────────────────────────────────────────────────
export async function blockUser(blockedId: string) {
  const { supabase, user } = await getAuthUser();
  if (user.id === blockedId) return { error: 'You cannot block yourself' };

  const { error } = await supabase.from('blocked_users').upsert(
    { blocker_id: user.id, blocked_id: blockedId },
    { onConflict: 'blocker_id,blocked_id' }
  );

  if (error) return { error: 'Failed to block user' };
  return { success: true };
}

export async function unblockUser(blockedId: string) {
  const { supabase, user } = await getAuthUser();

  const { error } = await supabase
    .from('blocked_users')
    .delete()
    .eq('blocker_id', user.id)
    .eq('blocked_id', blockedId);

  if (error) return { error: 'Failed to unblock user' };
  return { success: true };
}

// ── Deactivate account ────────────────────────────────────────────
export async function deactivateAccount() {
  const { supabase, user } = await getAuthUser();

  // Set status to deactivated, hide listings
  await supabase
    .from('profiles')
    .update({ status: 'deactivated' })
    .eq('id', user.id);

  // Deactivate all active listings
  await supabase
    .from('listings')
    .update({ status: 'hidden' })
    .eq('seller_id', user.id)
    .eq('status', 'active');

  return { success: true };
}

// ── Reactivate account ────────────────────────────────────────────
export async function reactivateAccount() {
  const { supabase, user } = await getAuthUser();

  await supabase
    .from('profiles')
    .update({ status: 'active' })
    .eq('id', user.id);

  return { success: true };
}

// ── Delete account (soft) ─────────────────────────────────────────
export async function requestAccountDeletion() {
  const { supabase, user } = await getAuthUser();

  // Check for pending orders
  const { count: pendingOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .in('status', ['pending', 'paid', 'shipped']);

  if (pendingOrders && pendingOrders > 0) {
    return { error: 'You cannot delete your account while you have pending orders. Please complete or cancel them first.' };
  }

  // Soft delete: scramble data, set status
  const scrambled = `deleted_${user.id.slice(0, 8)}`;
  await supabase
    .from('profiles')
    .update({
      status: 'deleted',
      username: scrambled,
      display_name: null,
      bio: null,
      avatar_url: null,
      phone: null,
      city: null,
    })
    .eq('id', user.id);

  // Hide all listings
  await supabase
    .from('listings')
    .update({ status: 'hidden' })
    .eq('seller_id', user.id);

  // Sign out
  await supabase.auth.signOut();

  return { success: true };
}

// ── Accept seller terms ───────────────────────────────────────────
export async function acceptSellerTerms() {
  const { supabase, user } = await getAuthUser();

  const { error } = await supabase
    .from('profiles')
    .update({ accepted_seller_terms_at: new Date().toISOString() })
    .eq('id', user.id);

  if (error) return { error: 'Failed to accept terms' };
  return { success: true };
}

// ── Toggle holiday mode ───────────────────────────────────────────
export async function toggleHolidayMode(enabled: boolean) {
  const { supabase, user } = await getAuthUser();

  const { error } = await supabase
    .from('profiles')
    .update({ holiday_mode: enabled })
    .eq('id', user.id);

  if (error) return { error: 'Failed to update holiday mode' };
  return { success: true };
}
