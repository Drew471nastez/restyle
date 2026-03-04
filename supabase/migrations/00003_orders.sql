CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES public.profiles(id),
  seller_id UUID NOT NULL REFERENCES public.profiles(id),
  listing_id UUID NOT NULL REFERENCES public.listings(id),
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending','paid','shipped','delivered','completed','disputed','refunded','cancelled'
  )),
  total_amount INTEGER NOT NULL,
  item_price INTEGER NOT NULL,
  shipping_cost INTEGER NOT NULL,
  platform_fee INTEGER NOT NULL,
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

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id),
  price INTEGER NOT NULL,
  title TEXT NOT NULL,
  image_url TEXT,
  size TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_orders_buyer ON public.orders(buyer_id);
CREATE INDEX idx_orders_seller ON public.orders(seller_id);
CREATE INDEX idx_orders_status ON public.orders(status);

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
