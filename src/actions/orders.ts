'use server';

import { createServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { releaseEscrow, processRefund } from '@/lib/stripe/escrow';
import { revalidatePath } from 'next/cache';

export async function confirmShipment(orderId: string, trackingNumber: string) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: order } = await supabase
    .from('orders')
    .select()
    .eq('id', orderId)
    .eq('seller_id', user.id)
    .single();

  if (!order) return { error: 'Order not found' };
  if (order.status !== 'paid') return { error: 'Order must be in paid status' };

  const { error } = await supabaseAdmin
    .from('orders')
    .update({
      status: 'shipped',
      tracking_number: trackingNumber,
      shipped_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) return { error: error.message };

  revalidatePath('/orders');
  return { success: true };
}

export async function confirmDelivery(orderId: string) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: order } = await supabase
    .from('orders')
    .select()
    .eq('id', orderId)
    .eq('buyer_id', user.id)
    .single();

  if (!order) return { error: 'Order not found' };
  if (order.status !== 'shipped' && order.status !== 'delivered') {
    return { error: 'Invalid order status' };
  }

  // Mark as delivered if not already
  if (order.status === 'shipped') {
    await supabaseAdmin
      .from('orders')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString(),
      })
      .eq('id', orderId);
  }

  // Release escrow
  try {
    await releaseEscrow(orderId);
  } catch {
    return { error: 'Failed to release payment' };
  }

  revalidatePath('/orders');
  return { success: true };
}

export async function openDispute(orderId: string, reason: string) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { error } = await supabaseAdmin
    .from('orders')
    .update({
      status: 'disputed',
      dispute_reason: reason,
    })
    .eq('id', orderId)
    .eq('buyer_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/orders');
  return { success: true };
}

export async function cancelOrder(orderId: string) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: order } = await supabase
    .from('orders')
    .select()
    .eq('id', orderId)
    .single();

  if (!order) return { error: 'Order not found' };
  if (order.status !== 'pending' && order.status !== 'paid') {
    return { error: 'Cannot cancel this order' };
  }

  try {
    await processRefund(orderId);
  } catch {
    return { error: 'Failed to process cancellation' };
  }

  revalidatePath('/orders');
  return { success: true };
}
