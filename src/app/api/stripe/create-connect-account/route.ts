import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createConnectedAccount, createOnboardingLink } from '@/lib/stripe/connect';

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { locale = 'en' } = await request.json();

  // Check if user already has a Stripe account
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_account_id, country')
    .eq('id', user.id)
    .single();

  let accountId = profile?.stripe_account_id;

  if (!accountId) {
    // Create new Connect account
    accountId = await createConnectedAccount(
      user.id,
      user.email!,
      profile?.country || 'RO'
    );

    // Save to profile
    await supabaseAdmin
      .from('profiles')
      .update({ stripe_account_id: accountId })
      .eq('id', user.id);
  }

  // Create onboarding link
  const url = await createOnboardingLink(accountId, locale);

  return NextResponse.json({ url });
}
