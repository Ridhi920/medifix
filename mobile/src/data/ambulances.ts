export type AmbulanceType = {
  id: string;
  name: string;
  description: string;
  features: string[];
  estimatedTime: string;
  basePrice: number;
  image: string;
  available: boolean;
};

export const AMBULANCE_TYPES: AmbulanceType[] = [
  {
    id: "1",
    name: "Basic Life Support (BLS)",
    description: "For non-emergency patient transport with basic medical equipment",
    features: [
      "Oxygen supply",
      "First aid kit",
      "Stretcher",
      "Trained paramedic",
      "Basic monitoring"
    ],
    estimatedTime: "15-20 mins",
    basePrice: 1500,
    image: "🚑",
    available: true
  },
  {
    id: "2",
    name: "Advanced Life Support (ALS)",
    description: "For critical emergencies with advanced medical equipment",
    features: [
      "Cardiac monitor",
      "Defibrillator",
      "Ventilator",
      "IV fluids",
      "Advanced medications",
      "Trained medical team"
    ],
    estimatedTime: "10-15 mins",
    basePrice: 3500,
    image: "🚨",
    available: true
  },
  {
    id: "3",
    name: "Neonatal Ambulance",
    description: "Specialized transport for newborns and infants",
    features: [
      "Incubator",
      "Infant ventilator",
      "Temperature control",
      "Neonatal specialist",
      "Specialized monitoring"
    ],
    estimatedTime: "20-25 mins",
    basePrice: 5000,
    image: "👶",
    available: true
  },
  {
    id: "4",
    name: "Air Ambulance",
    description: "Helicopter service for remote or time-critical situations",
    features: [
      "Rapid transport",
      "ICU equipment",
      "Medical team",
      "Climate controlled",
      "Long distance capable"
    ],
    estimatedTime: "5-10 mins",
    basePrice: 50000,
    image: "🚁",
    available: false
  }
];

export type EmergencyContact = {
  name: string;
  number: string;
};

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  { name: "Ambulance", number: "102" },
  { name: "Police", number: "100" },
  { name: "Fire", number: "101" },
  { name: "Hospital Helpline", number: "108" }
];
