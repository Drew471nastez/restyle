import Stripe from 'stripe';
import { stripe } from './client';
import { supabaseAdmin } from '@/lib/supabase/admin';

export function constructEvent(
  body: string,
  signature: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}

export async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata!;
  const listingId = metadata.listing_id;
  const buyerId = metadata.buyer_id;
  const sellerId = metadata.seller_id;
  const itemPrice = parseInt(metadata.item_price);
  const shippingCost = parseInt(metadata.shipping_cost);
  const platformFee = parseInt(metadata.platform_fee);

  // Create order
  const { data: order } = await supabaseAdmin
    .from('orders')
    .insert({
      buyer_id: buyerId,
      seller_id: sellerId,
      listing_id: listingId,
      status: 'paid',
      total_amount: itemPrice + shippingCost,
      item_price: itemPrice,
      shipping_cost: shippingCost,
      platform_fee: platformFee,
      currency: session.currency?.toUpperCase() || 'RON',
      stripe_payment_intent_id: session.payment_intent as string,
    })
    .select()
    .single();

  if (!order) return;

  // Create order item
  const { data: listing } = await supabaseAdmin
    .from('listings')
    .select('title, images, size')
    .eq('id', listingId)
    .single();

  if (listing) {
    await supabaseAdmin.from('order_items').insert({
      order_id: order.id,
      listing_id: listingId,
      price: itemPrice,
      title: listing.title,
      image_url: listing.images[0] || null,
      size: listing.size,
    });
  }

  // Mark listing as reserved
  await supabaseAdmin
    .from('listings')
    .update({ status: 'reserved' })
    .eq('id', listingId);

  // Update seller wallet pending balance
  const { data: wallet } = await supabaseAdmin
    .from('wallets')
    .select()
    .eq('user_id', sellerId)
    .single();

  if (wallet) {
    await supabaseAdmin
      .from('wallets')
      .update({ pending_balance: wallet.pending_balance + (itemPrice - platformFee) })
      .eq('id', wallet.id);
  } else {
    await supabaseAdmin.from('wallets').insert({
      user_id: sellerId,
      pending_balance: itemPrice - platformFee,
    });
  }
}

export async function handleAccountUpdated(account: Stripe.Account) {
  if (account.charges_enabled && account.metadata?.platform_user_id) {
    await supabaseAdmin
      .from('profiles')
      .update({ stripe_onboarding_complete: true })
      .eq('id', account.metadata.platform_user_id);
  }
}

export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id;
  if (!userId) return;

  const status = subscription.status === 'active' ? 'active'
    : subscription.status === 'past_due' ? 'past_due'
    : subscription.status === 'canceled' ? 'cancelled'
    : subscription.status === 'trialing' ? 'trialing'
    : 'cancelled';

  // Access period dates from subscription (varies by Stripe API version)
  const sub = subscription as unknown as Record<string, unknown>;
  const periodStart = typeof sub.current_period_start === 'number'
    ? new Date(sub.current_period_start * 1000).toISOString()
    : null;
  const periodEnd = typeof sub.current_period_end === 'number'
    ? new Date(sub.current_period_end * 1000).toISOString()
    : null;

  await supabaseAdmin
    .from('subscriptions')
    .update({
      status,
      ...(periodStart && { current_period_start: periodStart }),
      ...(periodEnd && { current_period_end: periodEnd }),
    })
    .eq('stripe_subscription_id', subscription.id);

  // Update is_pro on profile
  await supabaseAdmin
    .from('profiles')
    .update({ is_pro: status === 'active' || status === 'trialing' })
    .eq('id', userId);
}
