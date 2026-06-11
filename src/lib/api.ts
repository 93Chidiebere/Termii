import axios from "axios";
import type { Post, User } from "@/data/mockData";

const BASE_URL = "https://termii-production.up.railway.app";

export const apiClient = axios.create({
  baseURL: BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("termii-token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ──────────────────────────────────────────────────────────────────────

export const loginUser = async (email: string, password: string) => {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);
  const response = await apiClient.post("/auth/login", formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return response.data;
};

export const registerUser = async (data: {
  full_name: string;
  email: string;
  password: string;
  hair_type?: string;
}) => {
  const response = await apiClient.post("/auth/register", data);
  return response.data;
};

export const getMe = async () => {
  const response = await apiClient.get("/auth/me");
  return response.data;
};

// ── Posts ─────────────────────────────────────────────────────────────────────

export const createPost = async (data: {
  caption: string;
  hair_type?: string;
  tags?: string[];
  media_url?: string;
  media_type?: string;
}) => {
  const response = await apiClient.post("/posts/", data);
  return response.data;
};

interface ApiPost {
  id: string;
  caption: string;
  hair_type?: string;
  tags?: string[];
  media_url?: string;
  media_type?: string;
  user_id: string;
  user_name: string;
  created_at: string;
}

export const transformPost = (apiPost: ApiPost): Post => {
  const user: User = {
    id: apiPost.user_id,
    username: apiPost.user_name.toLowerCase().replace(/\s+/g, ""),
    displayName: apiPost.user_name,
    avatar: "",
    bio: "",
    followers: 0,
    following: 0,
    posts: 0,
  };
  return {
    id: apiPost.id,
    userId: apiPost.user_id,
    user,
    image: apiPost.media_url || undefined,
    caption: apiPost.caption,
    hairType: apiPost.hair_type || "",
    tags: apiPost.tags || [],
    likes: 0,
    comments: 0,
    createdAt: apiPost.created_at,
    liked: false,
    saved: false,
  };
};

export const getPosts = async (): Promise<Post[]> => {
  const response = await apiClient.get("/posts/");
  return (response.data as ApiPost[]).map(transformPost);
};

// ── Messages ──────────────────────────────────────────────────────────────────

export interface ApiConversation {
  participant_id: string;
  participant_name: string;
  participant_email: string;
  last_message: string;
  last_timestamp: string;
  unread_count: number;
}

export interface ApiMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  receiver_id: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export const getConversations = async (): Promise<ApiConversation[]> => {
  const response = await apiClient.get("/chat/conversations");
  return response.data;
};

export const getMessageHistory = async (partnerId: string): Promise<ApiMessage[]> => {
  const response = await apiClient.get(`/chat/history/${partnerId}`);
  return response.data;
};

// Creates an authenticated WebSocket connection
export const createChatSocket = (token: string): WebSocket => {
  const wsUrl = `wss://termii-production.up.railway.app/chat/ws?token=${token}`;
  return new WebSocket(wsUrl);
};