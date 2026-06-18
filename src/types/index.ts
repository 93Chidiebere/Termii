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