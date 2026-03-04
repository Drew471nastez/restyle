'use server';

import { createServerClient } from '@/lib/supabase/server';


export async function getOrCreateConversation(otherUserId: string, listingId?: string) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  // Check for existing conversation
  const { data: existing } = await supabase
    .from('conversations')
    .select()
    .or(`and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`)
    .eq('listing_id', listingId || '')
    .single();

  if (existing) return { conversation: existing };

  // Create new conversation
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      participant_1: user.id,
      participant_2: otherUserId,
      listing_id: listingId || null,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { conversation: data };
}

export async function sendMessage(conversationId: string, content: string) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content,
    message_type: 'text',
  });

  if (error) return { error: error.message };

  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId);

  return { success: true };
}

export async function markAsRead(conversationId: string) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', user.id)
    .eq('is_read', false);
}
