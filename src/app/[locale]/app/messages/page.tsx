import { getTranslations } from 'next-intl/server';
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { MessageCircle, User } from 'lucide-react';

interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  listing_id: string | null;
  last_message_at: string;
  created_at: string;
}

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Message {
  id: string;
  conversation_id: string;
  content: string;
  sender_id: string;
  is_read: boolean;
  created_at: string;
}

export default async function MessagesPage() {
  const t = await getTranslations('messages');
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
    return null;
  }

  let conversations: Conversation[] = [];
  let profiles: Record<string, Profile> = {};
  const lastMessages: Record<string, Message> = {};
  const unreadCounts: Record<string, number> = {};

  try {
    const { data: convos } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order('last_message_at', { ascending: false });

    conversations = convos || [];

    // Get other user profiles
    const otherUserIds = conversations.map((c) =>
      c.participant_1 === user.id ? c.participant_2 : c.participant_1
    );

    if (otherUserIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', otherUserIds);

      if (profilesData) {
        profiles = Object.fromEntries(
          profilesData.map((p) => [p.id, p])
        );
      }
    }

    // Get last message and unread count for each conversation
    for (const convo of conversations) {
      try {
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', convo.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (lastMsg) {
          lastMessages[convo.id] = lastMsg;
        }

        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', convo.id)
          .neq('sender_id', user.id)
          .eq('is_read', false);

        unreadCounts[convo.id] = count || 0;
      } catch {
        // silently fail per conversation
      }
    }
  } catch {
    // silently fail
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffDays === 1) {
      return t('yesterday');
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('subtitle')}</p>
      </div>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <MessageCircle className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            {t('emptyTitle')}
          </h3>
          <p className="mt-1 max-w-sm text-sm text-gray-500">
            {t('emptyDescription')}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {conversations.map((convo, index) => {
            const otherUserId =
              convo.participant_1 === user.id
                ? convo.participant_2
                : convo.participant_1;
            const profile = profiles[otherUserId];
            const lastMsg = lastMessages[convo.id];
            const unread = unreadCounts[convo.id] || 0;

            return (
              <Link
                key={convo.id}
                href={`/app/messages/${convo.id}`}
                className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-gray-50 ${
                  index < conversations.length - 1
                    ? 'border-b border-gray-100'
                    : ''
                } ${unread > 0 ? 'bg-violet-50/30' : ''}`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.display_name || profile.username}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                  )}
                  {unread > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-violet-500 text-[10px] font-bold text-white">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`truncate text-sm ${
                        unread > 0
                          ? 'font-bold text-gray-900'
                          : 'font-medium text-gray-900'
                      }`}
                    >
                      {profile?.display_name ||
                        profile?.username ||
                        t('unknownUser')}
                    </h3>
                    <span className="shrink-0 text-xs text-gray-400">
                      {lastMsg
                        ? formatTime(lastMsg.created_at)
                        : formatTime(convo.created_at)}
                    </span>
                  </div>
                  <p
                    className={`mt-0.5 truncate text-sm ${
                      unread > 0
                        ? 'font-medium text-gray-700'
                        : 'text-gray-500'
                    }`}
                  >
                    {lastMsg
                      ? lastMsg.sender_id === user.id
                        ? `${t('you')}: ${lastMsg.content}`
                        : lastMsg.content
                      : t('noMessages')}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
