import { users } from "./mockData";

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participant: typeof users[0];
  messages: Message[];
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
}

export const conversations: Conversation[] = [
  {
    id: "conv-1",
    participant: users[1],
    lastMessage: "Girl, your twist-out is amazing! What products did you use? 😍",
    lastTimestamp: "2026-02-28T12:30:00Z",
    unreadCount: 2,
    messages: [
      { id: "m1", senderId: "2", text: "Hey queen! I loved your latest post 👑", timestamp: "2026-02-28T11:00:00Z", read: true },
      { id: "m2", senderId: "1", text: "Thank you so much Ada! 💕", timestamp: "2026-02-28T11:15:00Z", read: true },
      { id: "m3", senderId: "2", text: "What products do you use for your twist-outs?", timestamp: "2026-02-28T12:00:00Z", read: true },
      { id: "m4", senderId: "1", text: "Shea butter and black castor oil — that's my holy grail combo 🌿", timestamp: "2026-02-28T12:10:00Z", read: true },
      { id: "m5", senderId: "2", text: "Girl, your twist-out is amazing! What products did you use? 😍", timestamp: "2026-02-28T12:30:00Z", read: false },
    ],
  },
];
