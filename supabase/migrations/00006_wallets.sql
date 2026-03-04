CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  available_balance INTEGER DEFAULT 0,
  pending_balance INTEGER DEFAULT 0,
  total_earned INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'RON',
  iban TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id),
  order_id UUID REFERENCES public.orders(id),
  type TEXT NOT NULL CHECK (type IN ('sale','payout','refund','fee','subscription','adjustment')),
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','failed')),
  stripe_transfer_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_transactions_wallet ON public.transactions(wallet_id, created_at DESC);
