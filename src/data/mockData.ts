import ujuorig from "@/assets/ujuorig.jpeg";
import lowBun from "@/assets/low_bun.jpeg";
import bunWithFringe from "@/assets/bun_with_fringe.jpeg";
import ujucurly from "@/assets/ujucurly.jpeg";
import adaorig from "@/assets/adaorig.jpeg";
import cornrow from "@/assets/cornrow.jpeg";
import uju from "@/assets/uju.jpeg";
import braids1 from "@/assets/braids1.png";
import braids2 from "@/assets/braids2.png";
import braids3 from "@/assets/braids3.png";
import braids4 from "@/assets/braids4.png";
import braids5 from "@/assets/braids5.png";
import braids6 from "@/assets/braids6.png";
import braids7 from "@/assets/braids7.png";

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
  posts: number;
}

export interface Post {
  id: string;
  userId: string;
  user: User;
  image?: string;
  caption: string;
  hairType: string;
  tags: string[];
  likes: number;
  comments: number;
  createdAt: string;
  liked?: boolean;
  saved?: boolean;
}

export const users: User[] = [
  {
    id: "1",
    username: "ujunaturals",
    displayName: "Uju",
    avatar: ujuorig,
    bio: "Natural hair enthusiast 🌿 4C hair journey | Lagos, Nigeria",
    followers: 2340,
    following: 189,
    posts: 47,
  },
  {
    id: "2",
    username: "adabeauty",
    displayName: "Ada",
    avatar: adaorig,
    bio: "Celebrating African beauty ✨ Hair stylist & educator",
    followers: 5120,
    following: 312,
    posts: 89,
  },
];

export const posts: Post[] = [
  {
    id: "1",
    userId: "1",
    user: users[0],
    image: ujucurly,
    caption: "Twist-out on freshly washed hair 💫 Used shea butter and black castor oil for definition. My curls are thriving!",
    hairType: "4C",
    tags: ["twist-out", "wash-day", "4C-curls", "natural-hair"],
    likes: 234,
    comments: 18,
    createdAt: "2026-02-28T10:00:00Z",
  },
  {
    id: "2",
    userId: "2",
    user: users[1],
    image: adaorig,
    caption: "Embracing my afro in all its glory 👑 No product, just pure natural texture. This is what freedom looks like.",
    hairType: "4B",
    tags: ["afro", "natural-texture", "self-love", "african-beauty"],
    likes: 512,
    comments: 42,
    createdAt: "2026-02-27T14:30:00Z",
  },
  {
    id: "3",
    userId: "1",
    user: users[0],
    image: lowBun,
    caption: "Sleek low bun for the office 💼 Protective styling doesn't have to be boring!",
    hairType: "4C",
    tags: ["low-bun", "protective-style", "office-hair", "sleek"],
    likes: 189,
    comments: 12,
    createdAt: "2026-02-26T09:15:00Z",
  },
  {
    id: "4",
    userId: "1",
    user: users[0],
    image: bunWithFringe,
    caption: "Bun with a fringe moment 🌸 Feeling playful today. Who else loves this style?",
    hairType: "4C",
    tags: ["bun", "fringe", "playful", "natural-styling"],
    likes: 321,
    comments: 27,
    createdAt: "2026-02-25T16:00:00Z",
  },
  {
    id: "5",
    userId: "2",
    user: users[1],
    image: cornrow,
    caption: "Feed-in cornrows 🔥 My go-to protective style. Lasts two weeks and looks amazing!",
    hairType: "4B",
    tags: ["cornrows", "protective-style", "braids", "feed-in"],
    likes: 445,
    comments: 35,
    createdAt: "2026-02-24T11:45:00Z",
  },
  {
    id: "6",
    userId: "1",
    user: users[0],
    image: uju,
    caption: "Blowout season 🍂 When your natural hair hits different after a good stretch.",
    hairType: "4C",
    tags: ["blowout", "stretched-hair", "volume", "natural"],
    likes: 278,
    comments: 20,
    createdAt: "2026-02-23T13:20:00Z",
  },
  {
    id: "7",
    userId: "2",
    user: users[1],
    caption: "Just had the best wash day in months! My hair feels so soft and moisturized. Gonna try a new deep conditioner recipe next week — avocado, honey, and olive oil. Anyone tried this combo before? 🧴💚",
    hairType: "4B",
    tags: ["wash-day", "deep-conditioner", "hair-care", "moisture"],
    likes: 167,
    comments: 24,
    createdAt: "2026-02-22T08:30:00Z",
  },
  {
    id: "8",
    userId: "1",
    user: users[0],
    caption: "Reminder: your natural hair is beautiful at every stage of the journey. Whether you're transitioning, big chopping, or years into being natural — you're doing amazing 👑✨",
    hairType: "4C",
    tags: ["motivation", "natural-hair", "self-love"],
    likes: 402,
    comments: 31,
    createdAt: "2026-02-21T19:00:00Z",
  },
  {
    id: "9",
    userId: "2",
    user: users[1],
    image: braids4,
    caption: "Knotless braids with curly ends 💫 Love how versatile this style is!",
    hairType: "4B",
    tags: ["braids", "knotless", "curly-ends", "protective-style"],
    likes: 341,
    comments: 22,
    createdAt: "2026-02-20T10:30:00Z",
  },
  {
    id: "10",
    userId: "1",
    user: users[0],
    image: braids5,
    caption: "Passion twists ponytail 🔥 Perfect summer protective style",
    hairType: "4C",
    tags: ["braids", "passion-twists", "ponytail", "protective-style"],
    likes: 298,
    comments: 19,
    createdAt: "2026-02-19T15:00:00Z",
  },
  {
    id: "11",
    userId: "2",
    user: users[1],
    image: braids6,
    caption: "Bob braids with beads 🧡 Adding accessories elevates everything",
    hairType: "4B",
    tags: ["braids", "bob-braids", "beads", "accessories"],
    likes: 425,
    comments: 30,
    createdAt: "2026-02-18T12:00:00Z",
  },
  {
    id: "12",
    userId: "1",
    user: users[0],
    image: braids7,
    caption: "Sleek cornrow updo ✨ When you want elegance and protection in one",
    hairType: "4C",
    tags: ["braids", "cornrows", "sleek", "updo"],
    likes: 367,
    comments: 25,
    createdAt: "2026-02-17T09:00:00Z",
  },
];

export const trendingTags = [
  "wash-day", "4C-curls", "protective-style", "twist-out",
  "cornrows", "afro", "natural-hair", "hair-growth",
  "shea-butter", "loc-journey", "braids", "silk-press",
];

export const braidsPosts = [
  { id: "b1", image: braids1, caption: "Blonde knotless braids ✨", likes: 389, tags: ["braids", "knotless", "blonde"] },
  { id: "b2", image: braids2, caption: "Ghana weaving updo 👑", likes: 512, tags: ["braids", "ghana-weaving", "updo"] },
  { id: "b3", image: braids3, caption: "Short box braids bob 🔥", likes: 274, tags: ["braids", "box-braids", "bob"] },
  { id: "b4", image: braids4, caption: "Knotless braids with curly ends", likes: 341, tags: ["braids", "knotless", "curly-ends"] },
  { id: "b5", image: braids5, caption: "Passion twists ponytail 💫", likes: 298, tags: ["braids", "passion-twists", "ponytail"] },
  { id: "b6", image: braids6, caption: "Bob braids with beads 🧡", likes: 425, tags: ["braids", "bob-braids", "beads"] },
  { id: "b7", image: braids7, caption: "Sleek cornrow updo ✨", likes: 367, tags: ["braids", "cornrows", "sleek"] },
];

export const hairCategories = [
  { name: "Twist Outs", count: 1240 },
  { name: "Protective Styles", count: 3450 },
  { name: "Wash Day", count: 890 },
  { name: "Cornrows & Braids", count: 2100 },
  { name: "Afros", count: 1670 },
  { name: "Locs", count: 980 },
  { name: "Silk Press", count: 760 },
  { name: "Bantu Knots", count: 540 },
];
