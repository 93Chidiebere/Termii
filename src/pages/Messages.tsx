import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, ShieldAlert, Loader2, MessageCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { formatDistanceToNow } from "date-fns";
import { useAuthStore } from "@/stores/authStore";
import {
  getConversations,
  getMessageHistory,
  createChatSocket,
  type ApiConversation,
  type ApiMessage,
} from "@/lib/api";

const Messages = () => {
  const { isMinor, user, token } = useAuthStore();
  const currentUserId = user?.id || "";

  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [activeConv, setActiveConv] = useState<ApiConversation | null>(null);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // ── Scroll to bottom whenever messages change ──────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Connect WebSocket on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    const socket = createChatSocket(token);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const incoming: ApiMessage = JSON.parse(event.data);
        // Only add to current chat if it belongs to the active conversation
        setMessages((prev) => {
          const alreadyExists = prev.some((m) => m.id === incoming.id);
          if (alreadyExists) return prev;
          return [...prev, incoming];
        });
        // Update conversation list last message
        setConversations((prev) =>
          prev.map((c) =>
            c.participant_id === incoming.sender_id ||
            c.participant_id === incoming.receiver_id
              ? { ...c, last_message: incoming.text, last_timestamp: incoming.timestamp }
              : c
          )
        );
      } catch {
        // ignore malformed messages
      }
    };

    socket.onerror = () => {
      // WebSocket failed — app still works, just no real-time
    };

    return () => {
      socket.close();
    };
  }, [token]);

  // ── Fetch conversations on mount ───────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setIsLoadingConvs(true);
      try {
        const data = await getConversations();
        setConversations(data);
      } catch {
        // No conversations yet — empty state
      } finally {
        setIsLoadingConvs(false);
      }
    };
    load();
  }, []);

  // ── Open a conversation ────────────────────────────────────────────────────
  const handleOpenConv = async (conv: ApiConversation) => {
    setActiveConv(conv);
    setIsLoadingMsgs(true);
    try {
      const history = await getMessageHistory(conv.participant_id);
      setMessages(history);
    } catch {
      setMessages([]);
    } finally {
      setIsLoadingMsgs(false);
    }
  };

  // ── Send a message ─────────────────────────────────────────────────────────
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

  // ── Age restriction gate ───────────────────────────────────────────────────
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
          {!activeConv && (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full"
            >
              <div className="px-4 py-5 border-b border-border">
                <h1 className="font-display text-2xl font-bold text-foreground">Messages</h1>
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
                  <p className="text-sm text-muted-foreground">
                    When you message someone, it will appear here.
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  {conversations.map((conv) => (
                    <button
                      key={conv.participant_id}
                      onClick={() => handleOpenConv(conv)}
                      className="w-full flex items-center gap-3 px-4 py-4 hover:bg-card transition-colors border-b border-border text-left"
                    >
                      {/* Initials avatar for real users */}
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-base font-bold text-primary">
                          {conv.participant_name[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-foreground">
                            {conv.participant_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conv.last_timestamp), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.last_message}
                        </p>
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

          {/* ── CHAT VIEW ────────────────────────────────────────────── */}
          {activeConv && (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full"
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <button
                  onClick={() => { setActiveConv(null); setMessages([]); }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft size={22} />
                </button>
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">
                    {activeConv.participant_name[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-foreground">
                    {activeConv.participant_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activeConv.participant_email}
                  </p>
                </div>
              </div>

              {/* Messages */}
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
                        <div
                          className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                            isMe
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-card border border-border text-foreground rounded-bl-md"
                          }`}
                        >
                          <p>{msg.text}</p>
                          <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                            {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={handleSend}
                className="px-4 py-3 border-t border-border flex items-center gap-2"
              >
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 rounded-full bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-opacity"
                >
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