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

export const products: Product[] = [];
