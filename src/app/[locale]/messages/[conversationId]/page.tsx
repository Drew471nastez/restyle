import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { ChatView } from './ChatView';

export default async function ConversationPage({
  params: { conversationId },
}: {
  params: { conversationId: string };
}) {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
    return null;
  }

  // Fetch conversation
  const { data: conversation } = await supabase
    .from('conversations')
    .select(
      `
      *,
      participant_1_profile:profiles!participant_1(id, username, display_name, avatar_url),
      participant_2_profile:profiles!participant_2(id, username, display_name, avatar_url),
      listing:listings(id, title, images, price, currency)
    `
    )
    .eq('id', conversationId)
    .single();

  if (!conversation) {
    notFound();
  }

  // Verify user is a participant
  if (
    conversation.participant_1 !== user.id &&
    conversation.participant_2 !== user.id
  ) {
    notFound();
  }

  // Fetch initial messages
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  // Mark unread messages as read
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', user.id)
    .eq('is_read', false);

  interface ProfileInfo {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  }
  const conv = conversation as typeof conversation & {
    participant_1_profile: ProfileInfo;
    participant_2_profile: ProfileInfo;
    listing: { id: string; title: string; images: string[]; price: number; currency: string } | null;
  };
  const otherParticipant =
    conversation.participant_1 === user.id
      ? conv.participant_2_profile
      : conv.participant_1_profile;

  const listing = conv.listing;

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="border-b bg-white px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
          {otherParticipant?.avatar_url ? (
            <img
              src={otherParticipant.avatar_url}
              alt={otherParticipant.display_name || otherParticipant.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium">
              {(
                otherParticipant?.display_name?.[0] ||
                otherParticipant?.username?.[0] ||
                '?'
              ).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">
            {otherParticipant?.display_name ||
              otherParticipant?.username ||
              'Unknown user'}
          </p>
          {listing && (
            <p className="text-xs text-gray-500 truncate">
              {listing.title} &middot; {(listing.price / 100).toFixed(2)}{' '}
              {listing.currency}
            </p>
          )}
        </div>
      </div>

      {/* Chat */}
      <ChatView
        conversationId={conversationId}
        initialMessages={messages || []}
        currentUserId={user.id}
      />
    </div>
  );
}
