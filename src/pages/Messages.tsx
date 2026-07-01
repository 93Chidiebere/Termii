import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, ShieldAlert, Loader2, MessageCircle, Search, X, PenSquare } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { formatDistanceToNow } from "date-fns";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useMessageStore } from "@/stores/messageStore";
import {
  getConversations,
  getMessageHistory,
  markMessagesRead,
  createChatSocket,
  searchUsers,
  type ApiConversation,
  type ApiMessage,
  type ApiUser,
} from "@/lib/api";

const Messages = () => {
  const { isMinor, user, token } = useAuthStore();
  const currentUserId = user?.id || "";
  const { clearUnread, incrementUnread } = useMessageStore();

  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [activeConv, setActiveConv] = useState<ApiConversation | null>(null);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ApiUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeConvRef = useRef<ApiConversation | null>(null);
  const location = useLocation();

  // Keep ref in sync with state so WebSocket handler can read it
  useEffect(() => {
    activeConvRef.current = activeConv;
  }, [activeConv]);

  // Clear message unread count when user opens Messages
  useEffect(() => {
    clearUnread();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch conversations on mount
  useEffect(() => {
    const load = async () => {
      setIsLoadingConvs(true);
      try {
        const data = await getConversations();
        setConversations(data);
      } catch {
        // empty
      } finally {
        setIsLoadingConvs(false);
      }
    };
    load();
  }, []);


  // Connect WebSocket with auto-reconnect
  useEffect(() => {
    if (!token) return;

    let isUnmounted = false;
    let reconnectAttempts = 0;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (isUnmounted) return;

      const socket = createChatSocket(token);
      socketRef.current = socket;

      socket.onopen = () => {
        reconnectAttempts = 0;
      };

      socket.onmessage = (event) => {
        try {
          const incoming = JSON.parse(event.data);

          // Skip notification payloads — handled by useGlobalSocket
          if (incoming.type === "notification") return;

          const msg = incoming as ApiMessage;
          if (!msg.id || !msg.sender_id) return;

          setMessages((prev) => {
            const alreadyExists = prev.some((m) => m.id === msg.id);
            if (alreadyExists) return prev;
            return [...prev, msg];
          });

          setConversations((prev) => {
            // Determine who the "other person" is from the current user's perspective
            const isSentByMe = msg.sender_id === currentUserId;
            const partnerId = isSentByMe
              ? (msg as any).receiver_id || msg.sender_id
              : msg.sender_id;
            const partnerName = isSentByMe
              ? (msg as any).receiver_name || msg.sender_name
              : msg.sender_name;

            const exists = prev.some((c) => c.participant_id === partnerId);
            if (exists) {
              return prev.map((c) =>
                c.participant_id === partnerId
                  ? {
                      ...c,
                      last_message: msg.text,
                      last_timestamp: msg.timestamp,
                      unread_count: isSentByMe ? c.unread_count : c.unread_count + 1,
                    }
                  : c
              );
            }
            return [{
              participant_id: partnerId,
              participant_name: partnerName,
              participant_email: "",
              last_message: msg.text,
              last_timestamp: msg.timestamp,
              unread_count: isSentByMe ? 0 : 1,
            }, ...prev];
          });

          if (msg.sender_id !== currentUserId) {
            incrementUnread();
          }
        } catch {
          // ignore malformed messages
        }
      };

      socket.onerror = () => {};

      socket.onclose = () => {
        if (isUnmounted) return;
        const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000);
        reconnectAttempts += 1;
        reconnectTimeout = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      isUnmounted = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      socketRef.current?.close();
    };
  }, [token]);

  // Search users with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchUsers(searchQuery);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  }, [searchQuery]);

  // Auto-open conversation if navigated from a notification
  const handleOpenConv = async (conv: ApiConversation) => {
    // Optimistically clear the unread badge immediately
    setConversations((prev) =>
      prev.map((c) =>
        c.participant_id === conv.participant_id ? { ...c, unread_count: 0 } : c
      )
    );
    setActiveConv(conv);
    setIsLoadingMsgs(true);
    try {
      const [history] = await Promise.all([
        getMessageHistory(conv.participant_id),
        markMessagesRead(conv.participant_id).catch(() => {}), // mark read, silently ignore errors
      ]);
      setMessages(history);
    } catch {
      setMessages([]);
    } finally {
      setIsLoadingMsgs(false);
    }
  };

  useEffect(() => {
    const state = location.state as { openConversation?: ApiConversation } | null;
    if (state?.openConversation) {
      handleOpenConv(state.openConversation);
      window.history.replaceState({}, "");
    }
  }, [location.state]);

  const handleStartConversation = (selectedUser: ApiUser) => {
    const conv: ApiConversation = {
      participant_id: selectedUser.id || "",
      participant_name: selectedUser.full_name,
      participant_email: selectedUser.email,
      last_message: "",
      last_timestamp: new Date().toISOString(),
      unread_count: 0,
    };
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
    setMessages([]);
    setActiveConv(conv);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv || !socketRef.current) return;
    const socket = socketRef.current;
    if (socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({
      receiver_id: activeConv.participant_id,
      text: newMessage.trim(),
    }));
    setNewMessage("");
  };

  if (isMinor) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={32} className="text-muted-foreground" />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground mb-2">Access Restricted</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Messages are only available to members aged 16 and above.
          </p>
          <Link to="/feed" className="text-sm text-primary font-semibold hover:underline">
            ← Back to Feed
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto h-[calc(100vh-5rem)] md:h-screen flex flex-col">
        <AnimatePresence mode="wait">

          {/* ── CONVERSATION LIST ─────────────────────────────────────── */}
          {!activeConv && !showSearch && (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col h-full">
              <div className="px-4 py-5 border-b border-border flex items-center justify-between">
                <h1 className="font-display text-2xl font-bold text-foreground">Messages</h1>
                <button onClick={() => setShowSearch(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
                  <PenSquare size={16} /> New Message
                </button>
              </div>

              {isLoadingConvs ? (
                <div className="flex items-center justify-center flex-1">
                  <Loader2 size={28} className="animate-spin text-primary" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center px-8">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <MessageCircle size={28} className="text-muted-foreground" />
                  </div>
                  <p className="font-semibold text-foreground">No conversations yet</p>
                  <p className="text-sm text-muted-foreground">Click "New Message" to start a conversation.</p>
                  <button onClick={() => setShowSearch(true)}
                    className="mt-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
                    Start a conversation
                  </button>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  {conversations.map((conv) => (
                    <button key={conv.participant_id} onClick={() => handleOpenConv(conv)}
                      className="w-full flex items-center gap-3 px-4 py-4 hover:bg-card transition-colors border-b border-border text-left">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-base font-bold text-primary">
                          {conv.participant_name[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-foreground">{conv.participant_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conv.last_timestamp + "Z"), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{conv.last_message}</p>
                      </div>
                      {conv.unread_count > 0 && (
                        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                          {conv.unread_count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── NEW MESSAGE SEARCH ────────────────────────────────────── */}
          {showSearch && (
            <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col h-full">
              <div className="px-4 py-4 border-b border-border flex items-center gap-3">
                <button onClick={() => { setShowSearch(false); setSearchQuery(""); setSearchResults([]); }}
                  className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft size={22} />
                </button>
                <div className="flex-1 relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  {searchQuery && (
                    <button onClick={() => { setSearchQuery(""); setSearchResults([]); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {isSearching ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 size={24} className="animate-spin text-primary" />
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((u) => (
                    <button key={u.id} onClick={() => handleStartConversation(u)}
                      className="w-full flex items-center gap-3 px-4 py-4 hover:bg-card transition-colors border-b border-border text-left">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-base font-bold text-primary">{u.full_name[0].toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{u.full_name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                        {u.hair_type && (
                          <span className="text-xs text-primary font-medium">{u.hair_type} hair</span>
                        )}
                      </div>
                    </button>
                  ))
                ) : searchQuery.trim() && !isSearching ? (
                  <div className="text-center py-12 text-sm text-muted-foreground">
                    No users found for "{searchQuery}"
                  </div>
                ) : (
                  <div className="text-center py-12 text-sm text-muted-foreground">
                    Type a name or email to search
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── CHAT VIEW ────────────────────────────────────────────── */}
          {activeConv && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col h-full">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <button onClick={() => { setActiveConv(null); setMessages([]); }}
                  className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft size={22} />
                </button>
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">
                    {activeConv.participant_name[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-foreground">{activeConv.participant_name}</p>
                  <p className="text-xs text-muted-foreground">{activeConv.participant_email}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {isLoadingMsgs ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 size={24} className="animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    No messages yet. Say hello! 👋
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === currentUserId;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                          isMe
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-card border border-border text-foreground rounded-bl-md"
                        }`}>
                          <p>{msg.text}</p>
                          <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                            {formatDistanceToNow(new Date(msg.timestamp + "Z"), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} className="px-4 py-3 border-t border-border flex items-center gap-2">
                <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 rounded-full bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <button type="submit" disabled={!newMessage.trim()}
                  className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-opacity">
                  <Send size={18} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
};

export default Messages;