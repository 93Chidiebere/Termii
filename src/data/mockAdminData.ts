import { users } from "@/data/mockData";

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

export const mockAdminUsers: AdminUser[] = [
  {
    id: "1", username: "ujunaturals", displayName: "Uju", avatar: users[0].avatar,
    email: "uju@example.com", status: "active", joinedAt: "2025-08-15", reportCount: 0,
  },
  {
    id: "2", username: "adabeauty", displayName: "Ada", avatar: users[1].avatar,
    email: "ada@example.com", status: "active", joinedAt: "2025-09-20", reportCount: 1,
  },
  {
    id: "3", username: "chioma_styles", displayName: "Chioma", avatar: users[0].avatar,
    email: "chioma@example.com", status: "suspended", joinedAt: "2025-11-02", reportCount: 3,
  },
  {
    id: "4", username: "ngozi_locs", displayName: "Ngozi", avatar: users[1].avatar,
    email: "ngozi@example.com", status: "active", joinedAt: "2026-01-10", reportCount: 0,
  },
  {
    id: "5", username: "amaka_curls", displayName: "Amaka", avatar: users[0].avatar,
    email: "amaka@example.com", status: "banned", joinedAt: "2025-07-05", reportCount: 8,
  },
];

export const mockCreatorRequests: CreatorRequest[] = [
  {
    id: "cr1",
    user: mockAdminUsers[1],
    reason: "Professional hair stylist with 5+ years experience. I want to share tutorials and product reviews.",
    portfolio: "instagram.com/adabeauty",
    requestedAt: "2026-02-25",
    status: "pending",
  },
  {
    id: "cr2",
    user: mockAdminUsers[3],
    reason: "Loc specialist and educator. I run workshops on natural hair care across Lagos.",
    portfolio: "ngozilocs.com",
    requestedAt: "2026-02-27",
    status: "pending",
  },
  {
    id: "cr3",
    user: mockAdminUsers[0],
    reason: "Content creator focused on 4C hair journeys and product reviews.",
    portfolio: "youtube.com/ujunaturals",
    requestedAt: "2026-02-20",
    status: "approved",
  },
];

export const mockFlaggedPosts: FlaggedPost[] = [
  {
    id: "fp1", postId: "2", caption: "Some flagged content here...", image: users[1].avatar,
    author: mockAdminUsers[1],
    reporter: { username: "naturalqueen", displayName: "Natural Queen" },
    reason: "spam", details: "This looks like a promotional post for an unrelated product.",
    reportedAt: "2026-02-28", status: "open",
  },
  {
    id: "fp2", postId: "5", caption: "Inappropriate language in caption...",
    author: mockAdminUsers[2],
    reporter: { username: "hairlove", displayName: "Hair Love" },
    reason: "inappropriate", details: "Contains offensive language and bullying towards other users.",
    reportedAt: "2026-02-27", status: "open",
  },
  {
    id: "fp3", postId: "7", caption: "Misleading hair growth claims...",
    author: mockAdminUsers[4],
    reporter: { username: "adabeauty", displayName: "Ada" },
    reason: "misinformation", details: "Claims a product grows hair 10 inches in a week. Clearly false advertising.",
    reportedAt: "2026-02-26", status: "actioned",
  },
];
