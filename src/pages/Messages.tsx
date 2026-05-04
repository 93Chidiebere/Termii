import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, MoreVertical, ShieldAlert } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { conversations, Conversation, Message } from "@/data/mockMessages";
import { formatDistanceToNow } from "date-fns";
import { useAuthStore } from "@/stores/authStore";

const Messages = () => {
  const { isMinor } = useAuthStore();
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [localConversations, setLocalConversations] = useState(conversations);

  const currentUserId = "1";

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

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv) return;

    const msg: Message = {
      id: `m-${Date.now()}`,
      senderId: currentUserId,
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
      read: true,
    };

    setLocalConversations((prev) =>
      prev.map((c) =>
        c.id === activeConv.id
          ? { ...c, messages: [...c.messages, msg], lastMessage: msg.text, lastTimestamp: msg.timestamp }
          : c
      )
    );
    setActiveConv((prev) =>
      prev ? { ...prev, messages: [...prev.messages, msg], lastMessage: msg.text, lastTimestamp: msg.timestamp } : prev
    );
    setNewMessage("");
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto h-[calc(100vh-5rem)] md:h-screen flex flex-col">
        <AnimatePresence mode="wait">
          {!activeConv ? (
            /* CONVERSATION LIST */
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full">
              <div className="px-4 py-5 border-b border-border">
                <h1 className="font-display text-2xl font-bold text-foreground">Messages</h1>
              </div>
              <div className="flex-1 overflow-y-auto">
                {localConversations.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    No conversations yet
                  </div>
                ) : (
                  localConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConv(conv)}
                      className="w-full flex items-center gap-3 px-4 py-4 hover:bg-card transition-colors border-b border-border text-left"
                    >
                      <img src={conv.participant.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-foreground">{conv.participant.displayName}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conv.lastTimestamp), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                          {conv.unreadCount}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          ) : (
            /* CHAT VIEW */
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full">
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <button onClick={() => setActiveConv(null)} className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft size={22} />
                </button>
                <img src={activeConv.participant.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                <div className="flex-1">
                  <p className="font-semibold text-sm text-foreground">{activeConv.participant.displayName}</p>
                  <p className="text-xs text-muted-foreground">@{activeConv.participant.username}</p>
                </div>
                <button className="text-muted-foreground hover:text-foreground">
                  <MoreVertical size={20} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {activeConv.messages.map((msg) => {
                  const isMe = msg.senderId === currentUserId;
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
                })}
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="px-4 py-3 border-t border-border flex items-center gap-2">
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
