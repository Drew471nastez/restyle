'use client';

import { useState, useRef, useEffect } from 'react';
import { useRealtimeMessages } from '@/hooks/useRealtime';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import type { Message } from '@/types/database';

interface ChatViewProps {
  conversationId: string;
  initialMessages: Message[];
  currentUserId: string;
}

export function ChatView({
  conversationId,
  initialMessages,
  currentUserId,
}: ChatViewProps) {
  const { messages, sendMessage } = useRealtimeMessages(
    conversationId,
    initialMessages
  );
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    setInput('');
    try {
      await sendMessage(content);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            No messages yet. Say hello!
          </div>
        )}

        {messages.map((message) => {
          const isOwn = message.sender_id === currentUserId;
          return (
            <div
              key={message.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  isOwn
                    ? 'bg-green-600 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-900 rounded-bl-md'
                }`}
              >
                {message.message_type === 'offer' && message.offer_amount && (
                  <div
                    className={`text-xs font-semibold mb-1 ${
                      isOwn ? 'text-green-100' : 'text-green-600'
                    }`}
                  >
                    Offer: {(message.offer_amount / 100).toFixed(2)} EUR
                    {message.offer_status && (
                      <span className="ml-1 uppercase">
                        ({message.offer_status})
                      </span>
                    )}
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
                <p
                  className={`text-[10px] mt-1 ${
                    isOwn ? 'text-green-100' : 'text-gray-400'
                  }`}
                >
                  {new Date(message.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-white p-4">
        <div className="flex items-center gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none rounded-full border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            size="icon"
            className="rounded-full"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
