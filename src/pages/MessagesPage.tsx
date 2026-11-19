import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MessageSquare, Send } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { Avatar } from '../components/Avatar';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import type { ChatMessage, Conversation } from '../types';

export function MessagesPage() {
  const { user, socket, showToast } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const loadConversations = async () => {
    try {
      const res = await apiRequest<{ conversations: Conversation[] }>('/conversations');
      setConversations(res.conversations);
      const paramId = Number(searchParams.get('conv'));
      if (paramId && res.conversations.some((c) => c.id === paramId)) {
        setActiveConvId(paramId);
      } else if (!activeConvId && res.conversations.length > 0) {
        setActiveConvId(res.conversations[0].id);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not load conversations.', 'error');
    } finally {
      setLoadingConvs(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (!activeConvId) return;
    const loadMessages = async () => {
      setLoadingMsgs(true);
      try {
        const res = await apiRequest<{ messages: ChatMessage[] }>(
          `/conversations/${activeConvId}/messages`
        );
        setMessages(res.messages);
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConvId ? { ...c, unread_count: 0 } : c))
        );
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Could not load messages.', 'error');
      } finally {
        setLoadingMsgs(false);
      }
    };
    loadMessages();

    if (socket) {
      socket.emit('conversation:join', activeConvId);
    }
  }, [activeConvId, socket, showToast]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (incoming: ChatMessage) => {
      if (incoming.conversation_id === activeConvId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === incoming.id)) return prev;
          return [...prev, incoming];
        });
      }
      setConversations((prev) =>
        prev.map((c) =>
          c.id === incoming.conversation_id
            ? {
                ...c,
                last_message: incoming.content,
                last_message_time: incoming.created_at,
                unread_count:
                  incoming.conversation_id === activeConvId || incoming.sender_id === user?.id
                    ? 0
                    : c.unread_count + 1,
              }
            : c
        )
      );
    };

    socket.on('message:new', handleNewMessage);
    return () => {
      socket.off('message:new', handleNewMessage);
    };
  }, [socket, activeConvId, user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConvId || !text.trim() || sending) return;
    setSending(true);
    try {
      const res = await apiRequest<{ message: ChatMessage }>(
        `/conversations/${activeConvId}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({ content: text.trim() }),
        }
      );
      setMessages((prev) => {
        if (prev.some((m) => m.id === res.message.id)) return prev;
        return [...prev, res.message];
      });
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId
            ? { ...c, last_message: res.message.content, last_message_time: res.message.created_at }
            : c
        )
      );
      setText('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send message.', 'error');
    } finally {
      setSending(false);
    }
  };

  const activeConv = conversations.find((c) => c.id === activeConvId) || null;

  return (
    <AppShell>
      <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[540px] max-h-[75vh]">
        {/* Left Conversation List */}
        <aside className="md:col-span-4 border-b md:border-b-0 md:border-r border-[#e2e8f0] flex flex-col overflow-hidden">
          <div className="px-4 py-3.5 border-b border-[#e2e8f0] flex items-center justify-between">
            <h1 className="font-display font-bold text-base text-[#0b1c30]">Messages</h1>
            <span className="text-xs font-semibold text-[#64748b] tabular-nums">
              {conversations.length} chats
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#f1f5f9]">
            {loadingConvs ? (
              <div className="p-4 space-y-3 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 rounded-xl bg-[#f8f9ff]" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <MessageSquare className="w-8 h-8 text-[#4338ca] mx-auto" />
                <p className="text-xs font-semibold text-[#0b1c30]">No conversations yet</p>
                <p className="text-xs text-[#64748b]">
                  Connect with a peer in Discover or visit their profile to start chatting.
                </p>
                <Link
                  to="/discover"
                  className="inline-block mt-2 px-3 py-1.5 rounded-lg bg-[#4338ca] text-white text-xs font-semibold"
                >
                  Discover Peers
                </Link>
              </div>
            ) : (
              conversations.map((conv) => {
                const selected = conv.id === activeConvId;
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => {
                      setActiveConvId(conv.id);
                      setSearchParams({ conv: String(conv.id) });
                    }}
                    className={`w-full text-left px-4 py-3.5 flex items-center gap-3 transition-colors ${
                      selected ? 'bg-[#eff4ff]' : 'hover:bg-[#f8f9ff]'
                    }`}
                  >
                    <Avatar name={conv.peer_name} src={conv.peer_avatar} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-[#0b1c30] truncate">
                          {conv.peer_name}
                        </span>
                        {conv.unread_count > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-[#4338ca] text-white text-[10px] font-bold tabular-nums">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#64748b] truncate mt-0.5">
                        {conv.last_message || `${conv.peer_major} · Start chatting`}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Active Chat Window */}
        <section className="md:col-span-8 flex flex-col overflow-hidden bg-[#f8f9ff]">
          {!activeConv ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <MessageSquare className="w-10 h-10 text-[#4338ca] mb-3" />
              <p className="font-display font-bold text-base text-[#0b1c30]">
                Select a conversation
              </p>
              <p className="text-xs text-[#64748b] mt-1">
                Coordinate session topics, library rooms, and prep notes in real time.
              </p>
            </div>
          ) : (
            <>
              <div className="px-5 py-3.5 bg-white border-b border-[#e2e8f0] flex items-center justify-between gap-3">
                <Link
                  to={`/peers/${activeConv.peer_id}`}
                  className="flex items-center gap-3 min-w-0 hover:opacity-80"
                >
                  <Avatar name={activeConv.peer_name} src={activeConv.peer_avatar} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#0b1c30] truncate">
                      {activeConv.peer_name}
                    </p>
                    <p className="text-[11px] text-[#64748b] truncate">
                      {activeConv.peer_major} · {activeConv.peer_year}
                    </p>
                  </div>
                </Link>
                <Link
                  to={`/peers/${activeConv.peer_id}`}
                  className="text-xs font-semibold text-[#4338ca] hover:underline shrink-0"
                >
                  View Profile
                </Link>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
                {loadingMsgs ? (
                  <p className="text-xs text-[#64748b] text-center py-6">Loading chat history...</p>
                ) : messages.length === 0 ? (
                  <p className="text-xs text-[#64748b] text-center py-8">
                    No messages yet. Say hello to {activeConv.peer_name}!
                  </p>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[80%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                            isMe
                              ? 'bg-[#4338ca] text-white rounded-br-xs'
                              : 'bg-white text-[#0b1c30] border border-[#e2e8f0] rounded-bl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        </div>
                        <span className="text-[10px] text-[#64748b] mt-1 px-1">
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              <form
                onSubmit={handleSend}
                className="p-3 sm:p-4 bg-white border-t border-[#e2e8f0] flex items-center gap-2.5"
              >
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={`Message ${activeConv.peer_name}...`}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#e2e8f0] bg-[#f8f9ff] text-sm focus:bg-white focus:outline-none focus:border-[#4338ca]"
                />
                <button
                  type="submit"
                  disabled={!text.trim() || sending}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#4338ca] hover:bg-[#2a14b4] text-white text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}
