'use server';

import { createServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe/client';
import { revalidatePath } from 'next/cache';
import { MIN_PAYOUT_AMOUNT } from '@/lib/constants';

export async function requestPayout(amount: number) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const amountCents = Math.round(amount * 100);

  const { data: wallet } = await supabaseAdmin
    .from('wallets')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('stripe_account_id')
    .eq('id', user.id)
    .single();

  if (!wallet || wallet.available_balance < amountCents) {
    return { error: 'Insufficient balance' };
  }
  if (!profile?.stripe_account_id) {
    return { error: 'Complete seller onboarding first' };
  }
  if (amountCents < MIN_PAYOUT_AMOUNT) {
    return { error: `Minimum payout is ${(MIN_PAYOUT_AMOUNT / 100).toFixed(2)} RON` };
  }

  const transfer = await stripe.transfers.create({
    amount: amountCents,
    currency: wallet.currency.toLowerCase(),
    destination: profile.stripe_account_id,
    metadata: { user_id: user.id, wallet_id: wallet.id },
  });

  await supabaseAdmin
    .from('wallets')
    .update({ available_balance: wallet.available_balance - amountCents })
    .eq('id', wallet.id);

  await supabaseAdmin.from('transactions').insert({
    wallet_id: wallet.id,
    type: 'payout',
    amount: -amountCents,
    status: 'pending',
    stripe_transfer_id: transfer.id,
    description: `Payout of ${amount.toFixed(2)} ${wallet.currency}`,
  });

  revalidatePath('/wallet');
  return { success: true };
}

export async function updateIBAN(iban: string) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { error } = await supabaseAdmin
    .from('wallets')
    .update({ iban })
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/wallet');
  return { success: true };
}
