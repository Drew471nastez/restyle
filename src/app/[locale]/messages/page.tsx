import { getTranslations } from 'next-intl/server';
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle } from 'lucide-react';

interface ProfileInfo {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface MessageInfo {
  id: string;
  content: string;
  sender_id: string;
  is_read: boolean;
  created_at: string;
}

interface ListingInfo {
  id: string;
  title: string;
  images: string[];
}

export default async function MessagesPage() {
  const t = await getTranslations();
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
    return null;
  }

  // Fetch conversations where the user is a participant
  const { data: conversations } = await supabase
    .from('conversations')
    .select(
      `
      *,
      participant_1_profile:profiles!participant_1(id, username, display_name, avatar_url),
      participant_2_profile:profiles!participant_2(id, username, display_name, avatar_url),
      listing:listings(id, title, images),
      messages(id, content, sender_id, is_read, created_at)
    `
    )
    .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
    .order('last_message_at', { ascending: false });

  const conversationList = conversations || [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t('nav.messages')}
      </h1>

      {conversationList.length === 0 ? (
        <div className="text-center py-16">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No messages yet</p>
          <p className="text-gray-400 text-sm">
            Start a conversation by messaging a seller on their listing.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversationList.map((conversation) => {
            const conv = conversation as typeof conversation & {
              participant_1_profile: ProfileInfo;
              participant_2_profile: ProfileInfo;
              messages: MessageInfo[];
              listing: ListingInfo | null;
            };
            const otherParticipant =
              conversation.participant_1 === user.id
                ? conv.participant_2_profile
                : conv.participant_1_profile;

            const lastMessage = conv.messages
              ?.sort(
                (a: MessageInfo, b: MessageInfo) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime()
              )
              ?.[0];

            const unreadCount = conv.messages?.filter(
              (m: MessageInfo) => !m.is_read && m.sender_id !== user.id
            ).length;

            const listing = conv.listing;

            return (
              <Link
                key={conversation.id}
                href={`/messages/${conversation.id}`}
              >
                <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                        {otherParticipant?.avatar_url ? (
                          <img
                            src={otherParticipant.avatar_url}
                            alt={otherParticipant.display_name || otherParticipant.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium text-lg">
                            {(
                              otherParticipant?.display_name?.[0] ||
                              otherParticipant?.username?.[0] ||
                              '?'
                            ).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-900 truncate">
                            {otherParticipant?.display_name ||
                              otherParticipant?.username ||
                              'Unknown user'}
                          </span>
                          {lastMessage && (
                            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                              {new Date(
                                lastMessage.created_at
                              ).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {listing && (
                          <p className="text-xs text-green-600 truncate mb-1">
                            {listing.title}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-500 truncate">
                            {lastMessage?.content || 'No messages yet'}
                          </p>
                          {unreadCount > 0 && (
                            <Badge className="ml-2 flex-shrink-0">
                              {unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
