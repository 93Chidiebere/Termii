import ujuorig from "@/assets/ujuorig.jpeg";
import adaorig from "@/assets/adaorig.jpeg";
import uju from "@/assets/uju.jpeg";
import ujucurly from "@/assets/ujucurly.jpeg";

export interface HairTwin {
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  location: string;
  matchScore: number;
  sharedTraits: string[];
  goalSimilarity: number;
  hairProfile: {
    type: string;
    porosity: string;
    density: string;
    pattern: string;
    length: string;
  };
  goals: string[];
}

export const currentUserHairProfile = {
  type: "4C",
  porosity: "High Porosity",
  density: "Medium Density",
  pattern: "Coily",
  length: "Shoulder Length",
  goals: ["Length Retention", "Moisture", "Protective Styling"],
};

export const hairTwins: HairTwin[] = [
  {
    userId: "twin-1",
    username: "naturalnneoma",
    displayName: "Nneoma",
    avatar: adaorig,
    location: "Lagos, Nigeria",
    matchScore: 0.92,
    sharedTraits: ["Type 4C", "High Porosity", "Medium Density"],
    goalSimilarity: 0.95,
    hairProfile: {
      type: "4C",
      porosity: "High Porosity",
      density: "Medium Density",
      pattern: "Coily",
      length: "Armpit Length",
    },
    goals: ["Length Retention", "Moisture", "Defined Curls"],
  },
  {
    userId: "twin-2",
    username: "curlychioma",
    displayName: "Chioma",
    avatar: ujucurly,
    location: "Abuja, Nigeria",
    matchScore: 0.87,
    sharedTraits: ["Type 4C", "High Porosity"],
    goalSimilarity: 0.88,
    hairProfile: {
      type: "4C",
      porosity: "High Porosity",
      density: "High Density",
      pattern: "Coily",
      length: "Shoulder Length",
    },
    goals: ["Moisture", "Protective Styling", "Scalp Health"],
  },
  {
    userId: "twin-3",
    username: "afroqueen_amara",
    displayName: "Amara",
    avatar: uju,
    location: "Accra, Ghana",
    matchScore: 0.82,
    sharedTraits: ["High Porosity", "Medium Density"],
    goalSimilarity: 0.78,
    hairProfile: {
      type: "4B",
      porosity: "High Porosity",
      density: "Medium Density",
      pattern: "Coily",
      length: "Bra Strap Length",
    },
    goals: ["Length Retention", "Shrinkage Solutions", "Styling Versatility"],
  },
  {
    userId: "twin-4",
    username: "kinks_and_coils",
    displayName: "Zainab",
    avatar: ujuorig,
    location: "Nairobi, Kenya",
    matchScore: 0.79,
    sharedTraits: ["Type 4C", "Medium Density"],
    goalSimilarity: 0.72,
    hairProfile: {
      type: "4C",
      porosity: "Low Porosity",
      density: "Medium Density",
      pattern: "Coily",
      length: "Chin Length",
    },
    goals: ["Hair Growth", "Moisture", "Product Penetration"],
  },
  {
    userId: "twin-5",
    username: "textured_temi",
    displayName: "Temi",
    avatar: adaorig,
    location: "London, UK",
    matchScore: 0.75,
    sharedTraits: ["High Porosity"],
    goalSimilarity: 0.68,
    hairProfile: {
      type: "4A",
      porosity: "High Porosity",
      density: "Low Density",
      pattern: "Coily",
      length: "Shoulder Length",
    },
    goals: ["Volume", "Moisture", "Protective Styling"],
  },
  {
    userId: "twin-6",
    username: "crown_glory",
    displayName: "Folake",
    avatar: ujucurly,
    location: "Ibadan, Nigeria",
    matchScore: 0.71,
    sharedTraits: ["Medium Density", "Type 4C"],
    goalSimilarity: 0.65,
    hairProfile: {
      type: "4C",
      porosity: "Normal Porosity",
      density: "Medium Density",
      pattern: "Coily",
      length: "Waist Length",
    },
    goals: ["Length Retention", "Low Manipulation", "Natural Styling"],
  },
  {
    userId: "twin-7",
    username: "melanin_mane",
    displayName: "Adaeze",
    avatar: uju,
    location: "Port Harcourt, Nigeria",
    matchScore: 0.68,
    sharedTraits: ["High Porosity"],
    goalSimilarity: 0.6,
    hairProfile: {
      type: "4B",
      porosity: "High Porosity",
      density: "High Density",
      pattern: "Coily",
      length: "Armpit Length",
    },
    goals: ["Defined Curls", "Frizz Control", "Moisture"],
  },
];
