'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Mail, MailOpen } from 'lucide-react';

interface Message {
  id: string;
  created_at: string;
  content: string;
  is_read: boolean;
  activity_id: string | null;
  sender_id: string;
  senderUsername: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

export default function MessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    if (!email) { router.push('/login'); return; }
    fetchMessages(email);
  }, []);

  const fetchMessages = async (email: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/messages?email=${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error('Failed to load messages');
      const data = await res.json();
      setMessages(data.messages ?? []);

      // Mark all as read
      await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch {
      setError('Could not load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => prev === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header />

      {/* Page header */}
      <div className="sticky top-16 z-30 bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-black dark:text-white">Messages</h1>
          {messages.length > 0 && (
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {messages.length} message{messages.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {loading && (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-700 border-t-black dark:border-t-white rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-20 text-red-500">{error}</div>
        )}

        {!loading && !error && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-3">
            <div className="text-5xl">📬</div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">No messages yet</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              When a host approves your join request, you'll get a message here.
            </p>
          </div>
        )}

        {!loading && !error && messages.length > 0 && (
          <div className="space-y-3">
            {messages.map(msg => (
              <div
                key={msg.id}
                onClick={() => toggleExpand(msg.id)}
                className={`bg-white dark:bg-zinc-900 rounded-xl border cursor-pointer transition-all ${
                  !msg.is_read
                    ? 'border-black dark:border-white'
                    : 'border-zinc-200 dark:border-zinc-800'
                } hover:shadow-md`}
              >
                {/* Message header */}
                <div className="flex items-center gap-3 px-5 py-4">
                  <div className="flex-shrink-0">
                    {msg.is_read
                      ? <MailOpen className="w-5 h-5 text-zinc-400" />
                      : <Mail className="w-5 h-5 text-black dark:text-white" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm font-semibold truncate ${!msg.is_read ? 'text-black dark:text-white' : 'text-zinc-600 dark:text-zinc-300'}`}>
                        From {msg.senderUsername}
                      </span>
                      <span className="text-xs text-zinc-400 flex-shrink-0">{formatDate(msg.created_at)}</span>
                    </div>
                    {expanded !== msg.id && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                        {msg.content.split('\n')[0]}
                      </p>
                    )}
                  </div>
                  {!msg.is_read && (
                    <div className="w-2 h-2 rounded-full bg-black dark:bg-white flex-shrink-0" />
                  )}
                </div>

                {/* Expanded content */}
                {expanded === msg.id && (
                  <div className="px-5 pb-5 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                    <pre className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed">
                      {msg.content}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}