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

export const categories = [
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

export const sellers: Seller[] = [
  {
    id: "s1",
    name: "Uju Naturals",
    avatar: ujuorig,
    rating: 4.8,
    completedOrders: 234,
    location: "Lagos, Nigeria",
  },
  {
    id: "s2",
    name: "Ada's Beauty",
    avatar: adaorig,
    rating: 4.9,
    completedOrders: 512,
    location: "Abuja, Nigeria",
  },
];

export const products: Product[] = [];
