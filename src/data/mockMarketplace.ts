import black1 from "@/assets/black1.jfif";
import black2 from "@/assets/black2.jfif";
import black3 from "@/assets/black3.jfif";
import black4 from "@/assets/black4.jfif";
import black5 from "@/assets/black5.jfif";
import black6 from "@/assets/black6.jfif";
import black7 from "@/assets/black7.jfif";
import ujuorig from "@/assets/ujuorig.jpeg";
import adaorig from "@/assets/adaorig.jpeg";

export interface Seller {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  completedOrders: number;
  location: string;
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

export const products: Product[] = [
  {
    id: "p1",
    name: "Deep Moisture Shea Butter Cream",
    price: 3500,
    currency: "₦",
    images: [black1, black2, black3],
    category: "Creams",
    description:
      "Rich, deeply hydrating shea butter cream formulated for type 4 natural hair. Locks in moisture for up to 3 days. Made with organic shea butter, coconut oil, and aloe vera. Perfect for twist-outs, wash-and-gos, and protective styling.",
    seller: sellers[0],
    deliveryOptions: ["Standard (3-5 days)", "Express (1-2 days)", "Pickup"],
    tags: ["moisture", "shea-butter", "4C", "organic"],
    isTrending: true,
  },
  {
    id: "p2",
    name: "Jamaican Black Castor Oil (Cold Pressed)",
    price: 2800,
    currency: "₦",
    images: [black4, black5],
    category: "Oils",
    description:
      "100% pure cold-pressed Jamaican Black Castor Oil. Promotes hair growth, strengthens edges, and adds shine. Unrefined with no additives. Great for scalp massages and hot oil treatments.",
    seller: sellers[1],
    deliveryOptions: ["Standard (3-5 days)", "Express (1-2 days)"],
    tags: ["castor-oil", "hair-growth", "edges", "organic"],
    isTrending: true,
    fromHairTwin: true,
  },
  {
    id: "p3",
    name: "Wide Tooth Detangling Comb Set",
    price: 1500,
    currency: "₦",
    images: [black6, black7],
    category: "Combs",
    description:
      "Seamless wide-tooth comb set designed for natural hair. Glides through curls without snagging or breakage. Set includes 3 sizes for different styling needs.",
    seller: sellers[0],
    deliveryOptions: ["Standard (3-5 days)", "Pickup"],
    tags: ["detangling", "comb", "gentle", "natural-hair"],
    isNew: true,
  },
  {
    id: "p4",
    name: "Silk Bonnet – Jumbo Size",
    price: 2200,
    currency: "₦",
    images: [black3, black1],
    category: "Accessories",
    description:
      "Extra-large silk bonnet that fits all hair volumes. Protects curls, braids, and locs while you sleep. Adjustable elastic band for a comfortable fit. Available in 6 colors.",
    seller: sellers[1],
    deliveryOptions: ["Standard (3-5 days)", "Express (1-2 days)", "Pickup"],
    tags: ["silk", "bonnet", "protective", "sleep"],
    isNew: true,
    fromHairTwin: true,
  },
  {
    id: "p6",
    name: "Ionic Hair Dryer with Diffuser",
    price: 12000,
    currency: "₦",
    images: [black5, black2],
    category: "Dryers",
    description:
      "Professional ionic hair dryer with universal diffuser attachment. 3 heat settings, 2 speed settings. Reduces frizz and enhances curl definition. Lightweight and ergonomic design.",
    seller: sellers[1],
    deliveryOptions: ["Standard (3-5 days)"],
    tags: ["dryer", "diffuser", "ionic", "professional"],
  },
  {
    id: "p8",
    name: "Edge Control Gel – Strong Hold",
    price: 1800,
    currency: "₦",
    images: [black7, black4],
    category: "Creams",
    description:
      "Maximum hold edge control gel without flaking. Infused with argan oil and biotin for healthy edges. Humidity resistant, lasts all day. Non-greasy formula.",
    seller: sellers[1],
    deliveryOptions: ["Standard (3-5 days)", "Pickup"],
    tags: ["edge-control", "gel", "strong-hold", "edges"],
    isNew: true,
  },
];
