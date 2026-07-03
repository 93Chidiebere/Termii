export interface User {
  id: string;
  username: string;
  displayName: string;
  name?: string;
  email?: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
  posts: number;
  hairType?: string;
}

export interface Post {
  id: string;
  userId: string;
  user: User;
  image?: string;
  mediaType?: string;
  caption: string;
  hairType: string;
  tags: string[];
  likes: number;
  comments: number;
  createdAt: string;
  liked?: boolean;
  saved?: boolean;
}

export interface Seller {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  completedOrders: number;
  location: string;
  verificationStatus?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
  images: string[];
  category: string;
  description: string;
  seller: Seller;
  deliveryOptions: string[];
  tags: string[];
  isNew?: boolean;
  isTrending?: boolean;
  fromHairTwin?: boolean;
}

export const marketplaceCategories = [
  "All",
  "Combs",
  "Dryers",
  "Creams",
  "Oils",
  "Tools",
  "Accessories",
  "Beard & Grooming",
  "Locs & Maintenance",
];

export type UserStatus = "active" | "suspended" | "banned";
export type CreatorStatus = "pending" | "approved" | "rejected";
export type ReportReason = "spam" | "harassment" | "inappropriate" | "misinformation" | "other";

export interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  email: string;
  status: UserStatus;
  joinedAt: string;
  reportCount: number;
}

export interface CreatorRequest {
  id: string;
  user: AdminUser;
  reason: string;
  portfolio: string;
  requestedAt: string;
  status: CreatorStatus;
}

export interface FlaggedPost {
  id: string;
  postId: string;
  caption: string;
  image?: string;
  author: AdminUser;
  reporter: { username: string; displayName: string };
  reason: ReportReason;
  details: string;
  reportedAt: string;
  status: "open" | "dismissed" | "actioned";
}