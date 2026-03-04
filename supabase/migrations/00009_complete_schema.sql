-- ============================================================
-- ReStyle Marketplace - Complete Database Schema
-- Run this after all previous migrations, or standalone
-- ============================================================

-- ============================================================
-- A) PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  country TEXT DEFAULT 'RO',
  city TEXT,
  phone TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_pro BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  stripe_account_id TEXT,
  stripe_onboarding_complete BOOLEAN DEFAULT false,
  rating_avg DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  last_active_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::text, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- B) LISTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','active','sold','archived','removed')),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  brand TEXT,
  size TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('new_with_tags','like_new','good','fair')),
  price INTEGER NOT NULL,
  currency TEXT DEFAULT 'RON',
  images TEXT[] NOT NULL DEFAULT '{}',
  is_boosted BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  boost_expires_at TIMESTAMPTZ,
  country TEXT DEFAULT 'RO',
  views_count INTEGER DEFAULT 0,
  favorites_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listings_seller ON public.listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_category ON public.listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_price ON public.listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_created ON public.listings(created_at DESC);

-- Full-text search
DO $$ BEGIN
  ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS fts tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
      setweight(to_tsvector('english', COALESCE(brand, '')), 'A') ||
      setweight(to_tsvector('english', COALESCE(description, '')), 'B')
    ) STORED;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_listings_fts ON public.listings USING GIN(fts);

DROP TRIGGER IF EXISTS listings_updated_at ON public.listings;
CREATE TRIGGER listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- C) LISTING_IMAGES (optional separate image table)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.listing_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listing_images_listing ON public.listing_images(listing_id, sort_order);

-- ============================================================
-- D) FAVORITES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.favorites (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_listing ON public.favorites(listing_id);

-- ============================================================
-- E) FOLLOWS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);

-- ============================================================
-- F) CONVERSATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 UUID NOT NULL REFERENCES public.profiles(id),
  participant_2 UUID NOT NULL REFERENCES public.profiles(id),
  listing_id UUID REFERENCES public.listings(id),
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_p1 ON public.conversations(participant_1);
CREATE INDEX IF NOT EXISTS idx_conversations_p2 ON public.conversations(participant_2);
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_unique ON public.conversations(participant_1, participant_2, listing_id) WHERE listing_id IS NOT NULL;

-- ============================================================
-- G) MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  offer_amount INTEGER,
  offer_status TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at DESC);

-- ============================================================
-- H) OFFERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id),
  buyer_id UUID NOT NULL REFERENCES public.profiles(id),
  seller_id UUID NOT NULL REFERENCES public.profiles(id),
  amount_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent','accepted','declined','countered','expired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_offers_listing ON public.offers(listing_id);
CREATE INDEX IF NOT EXISTS idx_offers_buyer ON public.offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_offers_seller ON public.offers(seller_id);

DROP TRIGGER IF EXISTS offers_updated_at ON public.offers;
CREATE TRIGGER offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- I) ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id),
  buyer_id UUID NOT NULL REFERENCES public.profiles(id),
  seller_id UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT DEFAULT 'created' CHECK (status IN (
    'created','paid','label_ready','shipped','delivered','completed','disputed','refunded','cancelled'
  )),
  total_amount INTEGER NOT NULL,
  item_price INTEGER NOT NULL,
  shipping_cost INTEGER NOT NULL DEFAULT 0,
  platform_fee INTEGER NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'RON',
  stripe_payment_intent_id TEXT,
  shipping_label_url TEXT,
  tracking_number TEXT,
  shipping_provider TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  dispute_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_listing ON public.orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- J) ORDER_ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id),
  price INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- ============================================================
-- K) WALLETS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  available_balance INTEGER DEFAULT 0,
  pending_balance INTEGER DEFAULT 0,
  total_earned INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'RON',
  iban TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- L) TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id),
  order_id UUID REFERENCES public.orders(id),
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  stripe_transfer_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON public.transactions(wallet_id, created_at DESC);

-- ============================================================
-- M) REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id),
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id),
  reviewed_id UUID NOT NULL REFERENCES public.profiles(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  review_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(order_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewed ON public.reviews(reviewed_id);

-- Trigger to update profile rating on new review
CREATE OR REPLACE FUNCTION public.update_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles SET
    rating_avg = (SELECT COALESCE(AVG(rating), 0) FROM public.reviews WHERE reviewed_id = NEW.reviewed_id),
    rating_count = (SELECT COUNT(*) FROM public.reviews WHERE reviewed_id = NEW.reviewed_id)
  WHERE id = NEW.reviewed_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_created ON public.reviews;
CREATE TRIGGER on_review_created
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_rating();

-- ============================================================
-- N) DISPUTES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id),
  opened_by UUID NOT NULL REFERENCES public.profiles(id),
  reason TEXT NOT NULL,
  details TEXT,
  evidence_urls TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'open' CHECK (status IN ('open','resolved_refund','resolved_release','rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_disputes_order ON public.disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes(status);

-- ============================================================
-- O) SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  plan TEXT DEFAULT 'pro' CHECK (plan IN ('pro')),
  status TEXT NOT NULL CHECK (status IN ('active','cancelled','past_due','trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Increment favorites count
CREATE OR REPLACE FUNCTION public.increment_favorites(p_listing_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.listings SET favorites_count = favorites_count + 1 WHERE id = p_listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement favorites count
CREATE OR REPLACE FUNCTION public.decrement_favorites(p_listing_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.listings SET favorites_count = GREATEST(0, favorites_count - 1) WHERE id = p_listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment views count
CREATE OR REPLACE FUNCTION public.increment_views(p_listing_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.listings SET views_count = views_count + 1 WHERE id = p_listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- PROFILES: public read, self update
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- LISTINGS: public read active, seller CRUD own
DROP POLICY IF EXISTS "listings_select_public" ON public.listings;
CREATE POLICY "listings_select_public" ON public.listings FOR SELECT
  USING (status IN ('active','sold') OR auth.uid() = seller_id);
DROP POLICY IF EXISTS "listings_insert" ON public.listings;
CREATE POLICY "listings_insert" ON public.listings FOR INSERT
  WITH CHECK (auth.uid() = seller_id);
DROP POLICY IF EXISTS "listings_update" ON public.listings;
CREATE POLICY "listings_update" ON public.listings FOR UPDATE
  USING (auth.uid() = seller_id);
DROP POLICY IF EXISTS "listings_delete" ON public.listings;
CREATE POLICY "listings_delete" ON public.listings FOR DELETE
  USING (auth.uid() = seller_id);

-- LISTING_IMAGES: same as listings via join
DROP POLICY IF EXISTS "listing_images_select" ON public.listing_images;
CREATE POLICY "listing_images_select" ON public.listing_images FOR SELECT USING (true);
DROP POLICY IF EXISTS "listing_images_insert" ON public.listing_images;
CREATE POLICY "listing_images_insert" ON public.listing_images FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND seller_id = auth.uid()));
DROP POLICY IF EXISTS "listing_images_delete" ON public.listing_images;
CREATE POLICY "listing_images_delete" ON public.listing_images FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.listings WHERE id = listing_id AND seller_id = auth.uid()));

-- FAVORITES: owner CRUD
DROP POLICY IF EXISTS "favorites_select" ON public.favorites;
CREATE POLICY "favorites_select" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "favorites_insert" ON public.favorites;
CREATE POLICY "favorites_insert" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "favorites_delete" ON public.favorites;
CREATE POLICY "favorites_delete" ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- FOLLOWS: public read, owner insert/delete
DROP POLICY IF EXISTS "follows_select" ON public.follows;
CREATE POLICY "follows_select" ON public.follows FOR SELECT USING (true);
DROP POLICY IF EXISTS "follows_insert" ON public.follows;
CREATE POLICY "follows_insert" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
DROP POLICY IF EXISTS "follows_delete" ON public.follows;
CREATE POLICY "follows_delete" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- CONVERSATIONS: participants only
DROP POLICY IF EXISTS "conversations_select" ON public.conversations;
CREATE POLICY "conversations_select" ON public.conversations FOR SELECT
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);
DROP POLICY IF EXISTS "conversations_insert" ON public.conversations;
CREATE POLICY "conversations_insert" ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- MESSAGES: conversation participants only
DROP POLICY IF EXISTS "messages_select" ON public.messages;
CREATE POLICY "messages_select" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid()))
);
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid()))
);
DROP POLICY IF EXISTS "messages_update" ON public.messages;
CREATE POLICY "messages_update" ON public.messages FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid()))
);

-- OFFERS: participants only
DROP POLICY IF EXISTS "offers_select" ON public.offers;
CREATE POLICY "offers_select" ON public.offers FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
DROP POLICY IF EXISTS "offers_insert" ON public.offers;
CREATE POLICY "offers_insert" ON public.offers FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);
DROP POLICY IF EXISTS "offers_update" ON public.offers;
CREATE POLICY "offers_update" ON public.offers FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- ORDERS: buyer/seller see own
DROP POLICY IF EXISTS "orders_select" ON public.orders;
CREATE POLICY "orders_select" ON public.orders FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
DROP POLICY IF EXISTS "orders_insert" ON public.orders;
CREATE POLICY "orders_insert" ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);
DROP POLICY IF EXISTS "orders_update" ON public.orders;
CREATE POLICY "orders_update" ON public.orders FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- ORDER_ITEMS: same as orders via join
DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
CREATE POLICY "order_items_select" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid()))
);
DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;
CREATE POLICY "order_items_insert" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.buyer_id = auth.uid())
);

-- WALLETS: owner only
DROP POLICY IF EXISTS "wallets_select" ON public.wallets;
CREATE POLICY "wallets_select" ON public.wallets FOR SELECT USING (auth.uid() = user_id);

-- TRANSACTIONS: wallet owner only
DROP POLICY IF EXISTS "transactions_select" ON public.transactions;
CREATE POLICY "transactions_select" ON public.transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.wallets w WHERE w.id = wallet_id AND w.user_id = auth.uid())
);

-- REVIEWS: public read, order participant create
DROP POLICY IF EXISTS "reviews_select" ON public.reviews;
CREATE POLICY "reviews_select" ON public.reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "reviews_insert" ON public.reviews;
CREATE POLICY "reviews_insert" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- DISPUTES: participants + admin
DROP POLICY IF EXISTS "disputes_select" ON public.disputes;
CREATE POLICY "disputes_select" ON public.disputes FOR SELECT USING (
  auth.uid() = opened_by OR
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid()))
);
DROP POLICY IF EXISTS "disputes_insert" ON public.disputes;
CREATE POLICY "disputes_insert" ON public.disputes FOR INSERT WITH CHECK (auth.uid() = opened_by);

-- SUBSCRIPTIONS: owner only
DROP POLICY IF EXISTS "subscriptions_select" ON public.subscriptions;
CREATE POLICY "subscriptions_select" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('listings', 'listings', true) ON CONFLICT DO NOTHING;

-- Storage policies for avatars
DROP POLICY IF EXISTS "avatar_select" ON storage.objects;
CREATE POLICY "avatar_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
DROP POLICY IF EXISTS "avatar_insert" ON storage.objects;
CREATE POLICY "avatar_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "avatar_update" ON storage.objects;
CREATE POLICY "avatar_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "avatar_delete" ON storage.objects;
CREATE POLICY "avatar_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

-- Storage policies for listing images
DROP POLICY IF EXISTS "listing_img_select" ON storage.objects;
CREATE POLICY "listing_img_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'listings');
DROP POLICY IF EXISTS "listing_img_insert" ON storage.objects;
CREATE POLICY "listing_img_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'listings' AND auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "listing_img_update" ON storage.objects;
CREATE POLICY "listing_img_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'listings' AND auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "listing_img_delete" ON storage.objects;
CREATE POLICY "listing_img_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'listings' AND auth.uid() IS NOT NULL);
