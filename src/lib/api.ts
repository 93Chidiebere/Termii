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

export interface ApiUser {
  id: string;
  email: string;
  full_name: string;
  hair_type?: string;
  avatar_url?: string;
}

export const searchUsers = async (query: string): Promise<ApiUser[]> => {
  const response = await apiClient.get(`/auth/users/search?q=${encodeURIComponent(query)}`);
  return response.data;
};

// ── Hair Twins ────────────────────────────────────────────────────────────────

export interface ApiTwin {
  user_id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  hair_type?: string;
  match_score: number;
  shared_traits: string[];
}

export const getTwins = async (): Promise<ApiTwin[]> => {
  const response = await apiClient.get("/twins/");
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
    likes: (apiPost as any).likes_count ?? 0,
    comments: (apiPost as any).comments_count ?? 0,
    createdAt: apiPost.created_at,
    liked: (apiPost as any).is_liked ?? false,
    saved: (apiPost as any).is_saved ?? false,
  };
};


export const getPosts = async (): Promise<Post[]> => {
  const response = await apiClient.get("/posts/");
  return (response.data as ApiPost[]).map(transformPost);
};

export const getMyPosts = async (): Promise<Post[]> => {
  const response = await apiClient.get("/posts/my");
  return (response.data as ApiPost[]).map(transformPost);
};

export const getSavedPosts = async (): Promise<Post[]> => {
  const response = await apiClient.get("/posts/saved");
  return (response.data as ApiPost[]).map(transformPost);
};

export const getPostById = async (postId: string): Promise<Post> => {
  const response = await apiClient.get(`/posts/${postId}`);
  return transformPost(response.data);
};

export const toggleLike = async (postId: string): Promise<{ liked: boolean; likes_count: number }> => {
  const response = await apiClient.post(`/posts/${postId}/like`);
  return response.data;
};

export const toggleSave = async (postId: string): Promise<{ saved: boolean; saves_count: number }> => {
  const response = await apiClient.post(`/posts/${postId}/save`);
  return response.data;
};

export interface ApiComment {
  id: string;
  post_id: string;
  user_id: string;
  user_name: string;
  text: string;
  created_at: string;
}

export const getComments = async (postId: string): Promise<ApiComment[]> => {
  const response = await apiClient.get(`/posts/${postId}/comments`);
  return response.data;
};

export const addComment = async (postId: string, text: string): Promise<ApiComment> => {
  const response = await apiClient.post(`/posts/${postId}/comments`, { text });
  return response.data;
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

export const createChatSocket = (token: string): WebSocket => {
  const wsUrl = `wss://termii-production.up.railway.app/chat/ws?token=${token}`;
  return new WebSocket(wsUrl);
};

// ── Marketplace ───────────────────────────────────────────────────────────────

export interface ApiSeller {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  completed_orders: number;
  location: string;
}

export interface ApiProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  quantity: number;
  category: string;
  delivery_location: string;
  media_urls: string[];
  tags: string[];
  is_trending: boolean;
  is_new: boolean;
  status: string;
  seller: ApiSeller;
  created_at: string;
}

export const getProducts = async (): Promise<ApiProduct[]> => {
  const response = await apiClient.get("/shop/");
  return response.data;
};

export const createProduct = async (data: {
  title: string;
  description: string;
  price: number;
  currency?: string;
  quantity?: number;
  category?: string;
  delivery_location?: string;
  media_urls?: string[];
  tags?: string[];
}): Promise<ApiProduct> => {
  const response = await apiClient.post("/shop/", data);
  return response.data;
};