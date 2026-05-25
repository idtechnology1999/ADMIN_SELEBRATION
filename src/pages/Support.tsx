import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Loader, Search, ArrowLeft } from 'lucide-react';
import { adminApi } from '../services/api';
import { adminSocket } from '../lib/adminSocket';

interface ChatMsg {
  _id: string;
  conversationId: string;
  senderType: 'user' | 'admin';
  senderName: string;
  message: string;
  createdAt: string;
}

interface Conversation {
  _id: string;
  user: { name: string; email: string } | null;
  lastMessage: ChatMsg;
  userUnread: number;
}

export default function Support() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [search, setSearch] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedConv = conversations.find(c => c._id === selected);

  useEffect(() => {
    loadConversations();

    const socket = adminSocket.get();
    if (socket) {
      const handler = (data: { conversationId: string; message: ChatMsg }) => {
        // Update conversations list
        setConversations(prev => {
          const exists = prev.find(c => c._id === data.conversationId);
          if (!exists) {
            // New conversation — reload the list
            loadConversations();
            return prev;
          }
          return prev
            .map(c =>
              c._id === data.conversationId
                ? {
                    ...c,
                    lastMessage: data.message,
                    userUnread:
                      data.message.senderType === 'user' && selected !== data.conversationId
                        ? c.userUnread + 1
                        : c.userUnread,
                  }
                : c
            )
            .sort(
              (a, b) =>
                new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
            );
        });

        // Add message to the open thread if it matches
        setSelected(curr => {
          if (curr === data.conversationId) {
            setMessages(prev => {
              if (prev.some(m => m._id === data.message._id)) return prev;
              return [...prev, data.message];
            });
          }
          return curr;
        });
      };

      socket.on('chat:message', handler);
      return () => { socket.off('chat:message', handler); };
    }
  }, []);

  useEffect(() => {
    if (selected) {
      loadMessages(selected);
      inputRef.current?.focus();
    }
  }, [selected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    const res = await adminApi.adminChat.conversations();
    if (res.success && res.data) setConversations(res.data as Conversation[]);
  };

  const loadMessages = async (userId: string) => {
    setLoadingMsgs(true);
    setMessages([]);
    const res = await adminApi.adminChat.messages(userId);
    if (res.success && res.data) {
      setMessages(res.data as ChatMsg[]);
      setConversations(prev => prev.map(c => c._id === userId ? { ...c, userUnread: 0 } : c));
    }
    setLoadingMsgs(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || !selected || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    const res = await adminApi.adminChat.send(selected, text);
    if (res.success && res.data) {
      const msg = res.data as ChatMsg;
      setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg]);
      setConversations(prev =>
        prev.map(c => c._id === selected ? { ...c, lastMessage: msg } : c)
      );
    }
    setSending(false);
    inputRef.current?.focus();
  };

  const filtered = conversations.filter(
    c =>
      !search ||
      c.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return formatTime(iso);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Support Chat
        </h1>
        <p className="text-sm text-gray-500 mt-1">Reply to user messages in real time</p>
      </div>

      <div
        className="bg-white rounded-2xl shadow-sm overflow-hidden flex"
        style={{ height: 'calc(100vh - 200px)', minHeight: '520px', border: '1px solid rgba(0,0,0,0.06)' }}
      >
        {/* ── Conversations sidebar ── */}
        <div
          className={`flex flex-col border-r border-gray-100 ${selected ? 'hidden md:flex' : 'flex'}`}
          style={{ width: '300px', minWidth: '300px' }}
        >
          {/* Search */}
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 rounded-xl outline-none"
                style={{ border: '1px solid rgba(0,0,0,0.08)' }}
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <MessageCircle size={36} className="mb-3 text-gray-200" />
                <p className="text-sm text-gray-500 font-medium">No conversations yet</p>
                <p className="text-xs text-gray-400 mt-1">User messages will appear here</p>
              </div>
            ) : (
              filtered.map(conv => (
                <button
                  key={conv._id}
                  onClick={() => setSelected(conv._id)}
                  className="w-full text-left px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  style={
                    selected === conv._id
                      ? { background: 'rgba(245,130,10,0.06)', borderLeft: '3px solid #F5820A' }
                      : {}
                  }
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ background: '#0D2847' }}
                    >
                      {conv.user?.name?.charAt(0).toUpperCase() ?? 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {conv.user?.name ?? 'Unknown User'}
                        </p>
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {formatDate(conv.lastMessage.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {conv.lastMessage.senderType === 'admin' ? '↩ ' : ''}
                        {conv.lastMessage.message}
                      </p>
                    </div>
                    {conv.userUnread > 0 && (
                      <span className="shrink-0 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {conv.userUnread > 9 ? '9+' : conv.userUnread}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Chat panel ── */}
        <div className={`flex-1 flex flex-col min-w-0 ${!selected ? 'hidden md:flex' : 'flex'}`}>
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: 'rgba(13,40,71,0.06)' }}
              >
                <MessageCircle size={28} style={{ color: '#0D2847', opacity: 0.4 }} />
              </div>
              <p className="text-gray-600 font-medium">Select a conversation</p>
              <p className="text-sm text-gray-400 mt-1">Choose a user from the list to start replying</p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-white">
                <button
                  onClick={() => setSelected(null)}
                  className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft size={18} />
                </button>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: '#0D2847' }}
                >
                  {selectedConv?.user?.name?.charAt(0).toUpperCase() ?? 'U'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{selectedConv?.user?.name ?? 'Unknown User'}</p>
                  <p className="text-xs text-gray-400">{selectedConv?.user?.email ?? ''}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3" style={{ background: '#F7F8FA' }}>
                {loadingMsgs ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader size={22} className="animate-spin text-gray-400" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-gray-400">No messages yet in this conversation</p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div key={msg._id} className={`flex ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[68%] rounded-2xl px-4 py-2.5 text-sm ${
                          msg.senderType === 'admin'
                            ? 'rounded-br-sm text-white'
                            : 'rounded-bl-sm text-gray-800 bg-white shadow-sm'
                        }`}
                        style={
                          msg.senderType === 'admin'
                            ? { background: '#0D2847' }
                            : { border: '1px solid rgba(0,0,0,0.06)' }
                        }
                      >
                        {msg.senderType === 'user' && (
                          <p className="text-[10px] font-bold mb-1" style={{ color: '#F5820A' }}>
                            {msg.senderName}
                          </p>
                        )}
                        {msg.senderType === 'admin' && (
                          <p className="text-[10px] font-medium mb-1 text-white/60">{msg.senderName}</p>
                        )}
                        <p className="leading-relaxed">{msg.message}</p>
                        <p
                          className={`text-[10px] mt-1.5 ${
                            msg.senderType === 'admin' ? 'text-white/50' : 'text-gray-400'
                          }`}
                        >
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* Reply input */}
              <div className="px-4 py-3.5 bg-white border-t border-gray-100 flex items-center gap-3">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={`Reply to ${selectedConv?.user?.name ?? 'user'}...`}
                  className="flex-1 text-sm bg-gray-50 rounded-xl px-4 py-2.5 outline-none transition-colors"
                  style={{ border: '1px solid rgba(0,0,0,0.1)' }}
                  maxLength={2000}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white disabled:opacity-40 transition-opacity shrink-0"
                  style={{ background: '#F5820A' }}
                >
                  {sending ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
