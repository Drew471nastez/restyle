import { z } from 'zod';

// ── Reserved usernames ─────────────────────────────────────────────
export const RESERVED_USERNAMES = [
  'admin', 'administrator', 'mod', 'moderator', 'restyle', 'support',
  'help', 'info', 'contact', 'system', 'root', 'null', 'undefined',
  'api', 'www', 'mail', 'ftp', 'blog', 'shop', 'store', 'app',
  'official', 'security', 'abuse', 'postmaster', 'webmaster',
  'settings', 'profile', 'login', 'signup', 'register', 'onboarding',
  'checkout', 'sell', 'buy', 'browse', 'search', 'messages', 'orders',
  'wallet', 'favorites', 'notifications', 'terms', 'privacy', 'about',
  'test', 'demo', 'example', 'marketplace', 'team', 'staff',
];

// ── Username ───────────────────────────────────────────────────────
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be 30 characters or less')
  .regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores')
  .refine(
    (val) => !val.startsWith('_') && !val.endsWith('_'),
    'Cannot start or end with underscore'
  )
  .refine(
    (val) => !val.includes('__'),
    'Cannot contain consecutive underscores'
  )
  .refine(
    (val) => !RESERVED_USERNAMES.includes(val),
    'This username is not available'
  );

// ── Signup ─────────────────────────────────────────────────────────
export const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be 72 characters or less')
    .regex(/[a-zA-Z]/, 'Must contain at least one letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  username: usernameSchema,
});

// ── Login ──────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

// ── Profile update ─────────────────────────────────────────────────
export const profileUpdateSchema = z.object({
  display_name: z.string().max(60, 'Display name too long').nullable().optional(),
  bio: z.string().max(500, 'Bio must be 500 characters or less').nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  country: z.string().min(2).max(2).optional(),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number format')
    .max(20)
    .nullable()
    .optional()
    .or(z.literal('')),
});

// ── Onboarding step 1: Profile ─────────────────────────────────────
export const onboardingProfileSchema = z.object({
  username: usernameSchema,
  display_name: z.string().max(60).optional(),
  bio: z.string().max(500).optional(),
});

// ── Onboarding step 2: Location ────────────────────────────────────
export const onboardingLocationSchema = z.object({
  country: z.string().min(2).max(2),
  city: z.string().max(100).optional(),
});

// ── Shipping address ───────────────────────────────────────────────
export const shippingAddressSchema = z.object({
  label: z.string().max(50).default('Home'),
  full_name: z.string().min(1, 'Full name is required').max(100),
  street_line_1: z.string().min(1, 'Street address is required').max(200),
  street_line_2: z.string().max(200).nullable().optional(),
  city: z.string().min(1, 'City is required').max(100),
  state_province: z.string().max(100).nullable().optional(),
  postal_code: z.string().min(1, 'Postal code is required').max(20),
  country: z.string().min(2).max(2),
  phone: z.string().max(20).nullable().optional(),
  is_default: z.boolean().default(false),
  is_return_address: z.boolean().default(false),
});

// ── Private details ────────────────────────────────────────────────
export const privateDetailsSchema = z.object({
  legal_first_name: z.string().max(100).nullable().optional(),
  legal_last_name: z.string().max(100).nullable().optional(),
  date_of_birth: z.string().nullable().optional(),
  tax_id: z.string().max(50).nullable().optional(),
});

// ── Notification preferences ───────────────────────────────────────
export const notificationPrefsSchema = z.object({
  email_messages: z.boolean(),
  email_orders: z.boolean(),
  email_offers: z.boolean(),
  email_price_drops: z.boolean(),
  email_marketing: z.boolean(),
  email_security: z.boolean(),
  push_messages: z.boolean(),
  push_orders: z.boolean(),
  push_offers: z.boolean(),
  push_marketing: z.boolean(),
});

// ── Privacy settings ───────────────────────────────────────────────
export const privacySettingsSchema = z.object({
  show_city: z.boolean(),
  show_online_status: z.boolean(),
  show_last_active: z.boolean(),
  allow_search_engines: z.boolean(),
  allow_messages_from: z.enum(['everyone', 'verified', 'nobody']),
});

// ── Seller preferences ─────────────────────────────────────────────
export const sellerPreferencesSchema = z.object({
  bundle_discount_enabled: z.boolean(),
  bundle_discount_percent: z.number().min(0).max(50),
  bundle_min_items: z.number().min(2).max(10),
  auto_accept_full_price: z.boolean(),
  shipping_turnaround_days: z.number().min(1).max(14),
});

// ── Change password ────────────────────────────────────────────────
export const changePasswordSchema = z
  .object({
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72)
      .regex(/[a-zA-Z]/, 'Must contain at least one letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

// ── Report user ────────────────────────────────────────────────────
export const reportUserSchema = z.object({
  reason: z.enum([
    'spam',
    'fake_account',
    'harassment',
    'scam',
    'inappropriate_content',
    'counterfeit_items',
    'other',
  ]),
  description: z.string().max(1000).optional(),
});

// ── Username change (limited) ──────────────────────────────────────
export const usernameChangeSchema = z.object({
  username: usernameSchema,
});
