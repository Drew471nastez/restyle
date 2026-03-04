import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createCheckoutSession } from '@/lib/stripe/checkout';
import { calculatePlatformFee } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { listingId, locale = 'en' } = await request.json();

  // Get listing details
  const { data: listing } = await supabase
    .from('listings')
    .select('*, profiles!seller_id(*)')
    .eq('id', listingId)
    .eq('status', 'active')
    .single();

  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }

  if (listing.seller_id === user.id) {
    return NextResponse.json({ error: 'Cannot buy your own listing' }, { status: 400 });
  }

  const sellerProfile = listing.profiles as unknown as { stripe_account_id: string; stripe_onboarding_complete: boolean; is_pro: boolean };

  if (!sellerProfile.stripe_account_id || !sellerProfile.stripe_onboarding_complete) {
    return NextResponse.json({ error: 'Seller not set up for payments' }, { status: 400 });
  }

  const shippingCost = 1500; // 15 RON default
  const platformFee = calculatePlatformFee(listing.price, sellerProfile.is_pro);

  const session = await createCheckoutSession({
    listingId: listing.id,
    title: listing.title,
    imageUrl: listing.images[0] || '',
    itemPrice: listing.price,
    shippingCost,
    platformFee,
    currency: listing.currency,
    sellerStripeAccountId: sellerProfile.stripe_account_id,
    buyerId: user.id,
    sellerId: listing.seller_id,
    locale,
  });

  return NextResponse.json({ url: session.url });
}
