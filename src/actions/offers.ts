'use server';

import { createServerClient } from '@/lib/supabase/server';

export async function makeOffer(conversationId: string, amount: number) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const amountCents = Math.round(amount * 100);

  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: `Offer: ${amount.toFixed(2)}`,
    message_type: 'offer',
    offer_amount: amountCents,
    offer_status: 'pending',
  });

  if (error) return { error: error.message };

  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId);

  return { success: true };
}

export async function respondToOffer(messageId: string, action: 'accepted' | 'declined') {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { error } = await supabase
    .from('messages')
    .update({ offer_status: action })
    .eq('id', messageId);

  if (error) return { error: error.message };
  return { success: true };
}
