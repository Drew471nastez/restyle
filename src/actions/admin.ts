'use server';

import { createServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { releaseEscrow, processRefund } from '@/lib/stripe/escrow';
import { revalidatePath } from 'next/cache';
import type { Profile } from '@/types/database';

async function verifyAdmin() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const profile = data as Profile | null;
  return profile?.is_admin ? user : null;
}

export async function banUser(userId: string) {
  const admin = await verifyAdmin();
  if (!admin) return { error: 'Unauthorized' };

  // Soft-ban: remove all active listings
  await supabaseAdmin
    .from('listings')
    .update({ status: 'removed' })
    .eq('seller_id', userId)
    .eq('status', 'active');

  revalidatePath('/admin/users');
  return { success: true };
}

export async function verifyUser(userId: string) {
  const admin = await verifyAdmin();
  if (!admin) return { error: 'Unauthorized' };

  await supabaseAdmin
    .from('profiles')
    .update({ is_verified: true })
    .eq('id', userId);

  revalidatePath('/admin/users');
  return { success: true };
}

export async function featureListing(listingId: string, featured: boolean) {
  const admin = await verifyAdmin();
  if (!admin) return { error: 'Unauthorized' };

  await supabaseAdmin
    .from('listings')
    .update({ is_featured: featured })
    .eq('id', listingId);

  revalidatePath('/admin/listings');
  revalidatePath('/browse');
  return { success: true };
}

export async function resolveDispute(orderId: string, resolution: 'refund_buyer' | 'release_to_seller') {
  const admin = await verifyAdmin();
  if (!admin) return { error: 'Unauthorized' };

  try {
    if (resolution === 'refund_buyer') {
      await processRefund(orderId);
    } else {
      // Mark as delivered first, then release
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString(),
        })
        .eq('id', orderId);
      await releaseEscrow(orderId);
    }
  } catch {
    return { error: 'Failed to resolve dispute' };
  }

  revalidatePath('/admin/disputes');
  return { success: true };
}

export async function removeListing(listingId: string) {
  const admin = await verifyAdmin();
  if (!admin) return { error: 'Unauthorized' };

  await supabaseAdmin
    .from('listings')
    .update({ status: 'removed' })
    .eq('id', listingId);

  revalidatePath('/admin/listings');
  return { success: true };
}
