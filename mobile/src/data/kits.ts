export type Kit = {
  id: string;
  emoji: string;
  name: string;
  essentials: string[];
  cardBg: string;
};

export const KITS: Kit[] = [
  {
    id: "kit-first-aid",
    emoji: "🩹",
    name: "First Aid Kit",
    cardBg: "#FFF1F0",
    essentials: ["Bandages", "Cotton", "Gauze pads", "Antiseptic solution", "Adhesive tape", "Pain relief spray", "Gloves", "Thermometer"],
  },
  {
    id: "kit-fever",
    emoji: "🌡",
    name: "Fever Care Kit",
    cardBg: "#EFF6FF",
    essentials: ["Paracetamol tablets", "Digital thermometer", "ORS sachets", "Vitamin C tablets", "Wet wipes"],
  },
  {
    id: "kit-cold",
    emoji: "🤧",
    name: "Cold & Cough Kit",
    cardBg: "#F5F3FF",
    essentials: ["Cough syrup", "Cold relief tablets", "Throat lozenges", "Steam capsules", "Face masks"],
  },
  {
    id: "kit-emergency",
    emoji: "🚨",
    name: "Emergency Care Kit",
    cardBg: "#FFF1F0",
    essentials: ["First aid supplies", "Pain relief tablets", "Antiseptic cream", "ORS sachets", "Gloves", "Flashlight"],
  },
  {
    id: "kit-diabetes",
    emoji: "🩸",
    name: "Diabetes Care Kit",
    cardBg: "#F0FDF4",
    essentials: ["Glucometer", "Test strips", "Lancets", "Alcohol swabs", "Sugar tablets"],
  },
  {
    id: "kit-travel",
    emoji: "✈️",
    name: "Travel Health Kit",
    cardBg: "#ECFDF5",
    essentials: ["Motion sickness tablets", "Bandages", "Hand sanitizer", "ORS sachets", "Mosquito repellent"],
  },
  {
    id: "kit-baby",
    emoji: "👶",
    name: "Baby Care Kit",
    cardBg: "#FFF0F6",
    essentials: ["Baby wipes", "Baby lotion", "Digital thermometer", "Diaper rash cream", "Baby diapers"],
  },
  {
    id: "kit-women",
    emoji: "👩",
    name: "Women Wellness Kit",
    cardBg: "#FDF4FF",
    essentials: ["Sanitary pads", "Heating patch", "Pain relief tablets", "Intimate wash", "Iron tablets"],
  },
  {
    id: "kit-senior",
    emoji: "👴",
    name: "Senior Care Kit",
    cardBg: "#FFFBEB",
    essentials: ["BP monitor", "Pill organizer", "Thermometer", "Pain relief spray", "Hand sanitizer"],
  },
  {
    id: "kit-nursing",
    emoji: "🏥",
    name: "Home Nursing Kit",
    cardBg: "#EFF6FF",
    essentials: ["Gloves", "Face masks", "Gauze pads", "Syringes", "Antiseptic solution"],
  },
  {
    id: "kit-dental",
    emoji: "😁",
    name: "Dental Care Kit",
    cardBg: "#F0F9FF",
    essentials: ["Toothpaste", "Mouthwash", "Dental floss", "Toothbrush", "Pain relief gel"],
  },
  {
    id: "kit-pain",
    emoji: "💪",
    name: "Pain Relief Kit",
    cardBg: "#FFF7ED",
    essentials: ["Pain relief spray", "Heating patch", "Pain relief tablets", "Muscle gel", "Crepe bandage"],
  },
];
