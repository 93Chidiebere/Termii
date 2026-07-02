import axios from "axios";
import type { Post, User } from "@/types";

const BASE_URL = "https://api.isingala.com";

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
  username?: string;
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
    mediaType: apiPost.media_type || undefined,
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
  parent_comment_id?: string | null;
  created_at: string;
}

export const getComments = async (postId: string): Promise<ApiComment[]> => {
  const response = await apiClient.get(`/posts/${postId}/comments`);
  return response.data;
};

export const addComment = async (
  postId: string,
  text: string,
  parentCommentId?: string
): Promise<ApiComment> => {
  const response = await apiClient.post(`/posts/${postId}/comments`, {
    text,
    parent_comment_id: parentCommentId,
  });
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
  verification_status: string;
  seller_type?: string;
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

export const getProductById = async (productId: string): Promise<ApiProduct> => {
  const response = await apiClient.get(`/shop/${productId}`);
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

// ── Profile ───────────────────────────────────────────────────────────────────

export interface HairProfileData {
  full_name?: string;
  hair_type?: string;
  hair_porosity?: string;
  hair_density?: string;
  hair_pattern?: string;
  hair_length?: string;
  hair_goals?: string[];
  hair_treatments?: string[];
  avatar_url?: string;
}

export const updateMyProfile = async (data: HairProfileData) => {
  const response = await apiClient.patch("/auth/me", data);
  return response.data;
};

// ── Seller Onboarding ─────────────────────────────────────────────────────────

export interface Bank {
  name: string;
  code: string;
}

export const getBankList = async (): Promise<Bank[]> => {
  const response = await apiClient.get("/sellers/banks");
  return response.data;
};

export const verifyBankAccount = async (
  bankCode: string,
  accountNumber: string
): Promise<{ account_name: string; account_number: string }> => {
  const response = await apiClient.post(
    `/sellers/verify-account?bank_code=${bankCode}&account_number=${accountNumber}`
  );
  return response.data;
};

export interface OnboardSellerData {
  seller_type: "individual" | "business";
  business_name?: string;
  cac_number?: string;
  bank_code: string;
  bank_account_number: string;
}

export const onboardSeller = async (data: OnboardSellerData) => {
  const response = await apiClient.post("/sellers/onboard", data);
  return response.data;
};

// ── Orders ────────────────────────────────────────────────────────────────────

export interface ApiOrder {
  id: string;
  product_id: string;
  product_title: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  currency: string;
  status: string;
  paystack_reference?: string;
  delivery_address?: string;
  created_at: string;
}

export const createOrder = async (
  productId: string,
  deliveryAddress?: string
): Promise<{ order: ApiOrder; authorization_url: string }> => {
  const response = await apiClient.post("/orders/", {
    product_id: productId,
    delivery_address: deliveryAddress,
  });
  return response.data;
};

export const verifyOrder = async (reference: string): Promise<ApiOrder> => {
  const response = await apiClient.get(`/orders/verify/${reference}`);
  return response.data;
};

export const getMyPurchases = async (): Promise<ApiOrder[]> => {
  const response = await apiClient.get("/orders/my-purchases");
  return response.data;
};

export const getMySales = async (): Promise<ApiOrder[]> => {
  const response = await apiClient.get("/orders/my-sales");
  return response.data;
};

export const markShipped = async (orderId: string): Promise<ApiOrder> => {
  const response = await apiClient.put(`/orders/${orderId}/ship`);
  return response.data;
};

export const confirmDelivery = async (orderId: string): Promise<ApiOrder> => {
  const response = await apiClient.put(`/orders/${orderId}/deliver`);
  return response.data;
};

// ── Admin: Seller Verification ─────────────────────────────────────────────────

export interface PendingSeller {
  id: string;
  full_name: string;
  email: string;
  seller_type: string;
  business_name?: string;
  cac_number?: string;
  bank_account_name?: string;
  verification_status: string;
}

export const getPendingSellers = async (): Promise<PendingSeller[]> => {
  const response = await apiClient.get("/sellers/pending");
  return response.data;
};

export const verifySeller = async (
  userId: string,
  approve: boolean,
  notes?: string
) => {
  const response = await apiClient.put(`/sellers/${userId}/verify`, { approve, notes });
  return response.data;
};

// ── Admin: User Management ───────────────────────────────────────────────────

export interface AdminUserData {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  status: string;
  is_admin: boolean;
  suspension_reason?: string;
  created_at: string;
}

export const getAllUsers = async (): Promise<AdminUserData[]> => {
  const response = await apiClient.get("/admin/users");
  return response.data;
};

export const updateUserStatus = async (
  userId: string,
  status: "active" | "suspended" | "banned",
  reason?: string
) => {
  const response = await apiClient.put(`/admin/users/${userId}/status`, { status, reason });
  return response.data;
};

// ── Blog (Admin) ──────────────────────────────────────────────────────────────

export interface BlogBlock {
  type: "text" | "image";
  content: string;
  is_thumbnail: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  blocks: BlogBlock[];
  author_name: string;
  status: "draft" | "published";
  is_pinned: boolean;
  pinned_order?: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface BlogPostInput {
  title: string;
  summary: string;
  blocks: BlogBlock[];
  status: "draft" | "published";
}

export const getAllBlogPostsAdmin = async (): Promise<BlogPost[]> => {
  const response = await apiClient.get("/blog/admin");
  return response.data;
};

export const getBlogPostForEdit = async (postId: string): Promise<BlogPost> => {
  const response = await apiClient.get(`/blog/admin/${postId}`);
  return response.data;
};

export const createBlogPost = async (data: BlogPostInput): Promise<BlogPost> => {
  const response = await apiClient.post("/blog/", data);
  return response.data;
};

export const updateBlogPost = async (
  postId: string,
  data: Partial<BlogPostInput>
): Promise<BlogPost> => {
  const response = await apiClient.put(`/blog/${postId}`, data);
  return response.data;
};

export const deleteBlogPost = async (postId: string) => {
  const response = await apiClient.delete(`/blog/${postId}`);
  return response.data;
};

export const pinBlogPost = async (postId: string): Promise<BlogPost> => {
  const response = await apiClient.put(`/blog/${postId}/pin`);
  return response.data;
};

export const unpinBlogPost = async (postId: string): Promise<BlogPost> => {
  const response = await apiClient.put(`/blog/${postId}/unpin`);
  return response.data;
};

export const getPublishedBlogPosts = async (): Promise<BlogPost[]> => {
  const response = await apiClient.get("/blog/");
  return response.data;
};

export const getBlogPostBySlug = async (slug: string): Promise<BlogPost> => {
  const response = await apiClient.get(`/blog/${slug}`);
  return response.data;
};

export const markMessagesRead = async (partnerId: string) => {
  const response = await apiClient.post(`/chat/read/${partnerId}`);
  return response.data;
};