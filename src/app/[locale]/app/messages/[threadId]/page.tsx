'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { sendMessage, markAsRead } from '@/actions/messages';
import { ArrowLeft, Send, User, Package } from 'lucide-react';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
}

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Listing {
  id: string;
  title: string;
  price: number;
  images: string[];
}

export default function ChatThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const t = useTranslations('chat');
  const supabase = createClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [threadId, setThreadId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    params.then((p) => setThreadId(p.threadId));
  }, [params]);

  useEffect(() => {
    if (!threadId) return;

    async function loadThread() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        setCurrentUserId(user.id);

        // Load conversation
        const { data: convo } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', threadId)
          .single();

        if (!convo) return;

        // Load other user profile
        const otherUserId =
          convo.participant_1 === user.id
            ? convo.participant_2
            : convo.participant_1;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .eq('id', otherUserId)
          .single();

        if (profile) setOtherUser(profile);

        // Load listing if applicable
        if (convo.listing_id) {
          const { data: listingData } = await supabase
            .from('listings')
            .select('id, title, price, images')
            .eq('id', convo.listing_id)
            .single();

          if (listingData) setListing(listingData);
        }

        // Load messages
        const { data: msgs } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', threadId)
          .order('created_at', { ascending: true });

        setMessages(msgs || []);
        setIsLoading(false);

        // Mark as read
        await markAsRead(threadId);
      } catch {
        setIsLoading(false);
      }
    }

    loadThread();
  }, [threadId, supabase]);

  // Real-time subscription
  useEffect(() => {
    if (!threadId) return;

    const channel = supabase
      .channel(`messages:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${threadId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          if (newMsg.sender_id !== currentUserId) {
            markAsRead(threadId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId, currentUserId, supabase]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    try {
      const result = await sendMessage(threadId, content);
      if (result.error) {
        setNewMessage(content);
      }
    } catch {
      setNewMessage(content);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatDateSeparator(dateStr: string) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return t('today');
    if (date.toDateString() === yesterday.toDateString())
      return t('yesterday');
    return date.toLocaleDateString([], {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }

  function shouldShowDateSeparator(index: number) {
    if (index === 0) return true;
    const current = new Date(messages[index].created_at).toDateString();
    const prev = new Date(messages[index - 1].created_at).toDateString();
    return current !== prev;
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
        <Link
          href="/app/messages"
          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        {otherUser?.avatar_url ? (
          <img
            src={otherUser.avatar_url}
            alt={otherUser.display_name || otherUser.username}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200">
            <User className="h-4 w-4 text-gray-500" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-gray-900">
            {otherUser?.display_name || otherUser?.username || t('unknownUser')}
          </h2>
          <p className="text-xs text-gray-500">
            @{otherUser?.username || '...'}
          </p>
        </div>
      </div>

      {/* Listing card (if applicable) */}
      {listing && (
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-2.5">
          <Link
            href={`/item/${listing.id}`}
            className="flex items-center gap-3 rounded-lg bg-white p-2.5 shadow-sm transition-all hover:shadow-md"
          >
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
              {listing.images?.[0] ? (
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Package className="h-5 w-5 text-gray-300" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                {listing.title}
              </p>
              <p className="text-sm font-bold text-teal-600">
                {(listing.price / 100).toFixed(2)} RON
              </p>
            </div>
          </Link>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <MessageCircleEmpty className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">{t('startConversation')}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((msg, index) => {
              const isSent = msg.sender_id === currentUserId;

              return (
                <div key={msg.id}>
                  {shouldShowDateSeparator(index) && (
                    <div className="my-4 flex items-center justify-center">
                      <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-500">
                        {formatDateSeparator(msg.created_at)}
                      </span>
                    </div>
                  )}
                  <div
                    className={`flex ${
                      isSent ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                        isSent
                          ? 'rounded-br-md bg-teal-500 text-white'
                          : 'rounded-bl-md bg-white text-gray-900 shadow-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words text-sm">
                        {msg.content}
                      </p>
                      <p
                        className={`mt-1 text-right text-[10px] ${
                          isSent ? 'text-teal-100' : 'text-gray-400'
                        }`}
                      >
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-t border-gray-200 bg-white px-4 py-3"
      >
        <input
          ref={inputRef}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={t('typePlaceholder')}
          className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || isSending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-500 text-white transition-colors hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

function MessageCircleEmpty({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}
