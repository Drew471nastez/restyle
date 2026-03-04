import { stripe } from './client';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function releaseEscrow(orderId: string) {
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (!order || !order.stripe_payment_intent_id) {
    throw new Error('Order not found or no payment intent');
  }

  if (order.status !== 'delivered') {
    throw new Error('Order must be in delivered status to release escrow');
  }

  // Capture the payment (funds were authorized but not captured)
  await stripe.paymentIntents.capture(order.stripe_payment_intent_id);

  // Update order status
  await supabaseAdmin
    .from('orders')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  // Move funds from pending to available in seller's wallet
  const { data: wallet } = await supabaseAdmin
    .from('wallets')
    .select()
    .eq('user_id', order.seller_id)
    .single();

  if (wallet) {
    const sellerAmount = order.item_price - order.platform_fee;
    await supabaseAdmin
      .from('wallets')
      .update({
        pending_balance: Math.max(0, wallet.pending_balance - sellerAmount),
        available_balance: wallet.available_balance + sellerAmount,
        total_earned: wallet.total_earned + sellerAmount,
      })
      .eq('id', wallet.id);

    // Log transaction
    await supabaseAdmin.from('transactions').insert({
      wallet_id: wallet.id,
      order_id: orderId,
      type: 'sale',
      amount: sellerAmount,
      status: 'completed',
      description: `Sale completed - Order ${orderId.slice(0, 8)}`,
    });
  }

  // Mark listing as sold
  await supabaseAdmin
    .from('listings')
    .update({ status: 'sold' })
    .eq('id', order.listing_id);
}

export async function processRefund(orderId: string, amount?: number) {
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (!order || !order.stripe_payment_intent_id) {
    throw new Error('Order not found');
  }

  // Check if payment was captured or still authorized
  const pi = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id);

  if (pi.status === 'requires_capture') {
    // Not yet captured - just cancel
    await stripe.paymentIntents.cancel(order.stripe_payment_intent_id);
  } else if (pi.status === 'succeeded') {
    // Already captured - create refund
    await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent_id,
      amount: amount || undefined,
    });
  }

  // Update order
  await supabaseAdmin
    .from('orders')
    .update({ status: 'refunded' })
    .eq('id', orderId);

  // Restore listing
  await supabaseAdmin
    .from('listings')
    .update({ status: 'active' })
    .eq('id', order.listing_id);

  // Adjust wallet if needed
  const { data: wallet } = await supabaseAdmin
    .from('wallets')
    .select()
    .eq('user_id', order.seller_id)
    .single();

  if (wallet) {
    const sellerAmount = order.item_price - order.platform_fee;
    if (order.status === 'completed') {
      // Was already released - debit from available
      await supabaseAdmin
        .from('wallets')
        .update({
          available_balance: Math.max(0, wallet.available_balance - sellerAmount),
        })
        .eq('id', wallet.id);
    } else {
      // Still in escrow - debit from pending
      await supabaseAdmin
        .from('wallets')
        .update({
          pending_balance: Math.max(0, wallet.pending_balance - sellerAmount),
        })
        .eq('id', wallet.id);
    }

    await supabaseAdmin.from('transactions').insert({
      wallet_id: wallet.id,
      order_id: orderId,
      type: 'refund',
      amount: -sellerAmount,
      status: 'completed',
      description: `Refund - Order ${orderId.slice(0, 8)}`,
    });
  }
}
