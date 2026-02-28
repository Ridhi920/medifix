export type Medicine = {
  id: string;
  name: string;
  genericName: string;
  manufacturer: string;
  category: string;
  type: string; // Tablet, Capsule, Syrup, Injection, etc.
  strength: string;
  packSize: string;
  price: number;
  discountPrice?: number;
  prescriptionRequired: boolean;
  inStock: boolean;
  description: string;
};

export const MEDICINES: Medicine[] = [
  {
    id: "1",
    name: "Paracetamol 500mg",
    genericName: "Paracetamol",
    manufacturer: "Cipla Ltd",
    category: "Pain Relief",
    type: "Tablet",
    strength: "500mg",
    packSize: "15 tablets",
    price: 25,
    discountPrice: 20,
    prescriptionRequired: false,
    inStock: true,
    description: "Reduces fever and relieves mild to moderate pain"
  },
  {
    id: "2",
    name: "Azithromycin 500mg",
    genericName: "Azithromycin",
    manufacturer: "Sun Pharma",
    category: "Antibiotic",
    type: "Tablet",
    strength: "500mg",
    packSize: "6 tablets",
    price: 180,
    discountPrice: 160,
    prescriptionRequired: true,
    inStock: true,
    description: "Treats bacterial infections of respiratory tract, ear, skin"
  },
  {
    id: "3",
    name: "Cetirizine 10mg",
    genericName: "Cetirizine",
    manufacturer: "Dr. Reddy's",
    category: "Allergy",
    type: "Tablet",
    strength: "10mg",
    packSize: "10 tablets",
    price: 45,
    discountPrice: 38,
    prescriptionRequired: false,
    inStock: true,
    description: "Relieves allergy symptoms like sneezing, runny nose, itching"
  },
  {
    id: "4",
    name: "Omeprazole 20mg",
    genericName: "Omeprazole",
    manufacturer: "Lupin Ltd",
    category: "Gastric",
    type: "Capsule",
    strength: "20mg",
    packSize: "14 capsules",
    price: 85,
    discountPrice: 72,
    prescriptionRequired: true,
    inStock: true,
    description: "Treats acid reflux, stomach ulcers, and heartburn"
  },
  {
    id: "5",
    name: "Metformin 500mg",
    genericName: "Metformin",
    manufacturer: "Torrent Pharma",
    category: "Diabetes",
    type: "Tablet",
    strength: "500mg",
    packSize: "30 tablets",
    price: 65,
    discountPrice: 55,
    prescriptionRequired: true,
    inStock: true,
    description: "Controls blood sugar levels in type 2 diabetes"
  },
  {
    id: "6",
    name: "Cough Syrup 100ml",
    genericName: "Dextromethorphan",
    manufacturer: "Himalaya",
    category: "Cold & Cough",
    type: "Syrup",
    strength: "10mg/5ml",
    packSize: "100ml bottle",
    price: 95,
    discountPrice: 85,
    prescriptionRequired: false,
    inStock: true,
    description: "Relieves dry cough and throat irritation"
  },
  {
    id: "7",
    name: "Vitamin D3 60K IU",
    genericName: "Cholecalciferol",
    manufacturer: "Mankind Pharma",
    category: "Vitamins",
    type: "Capsule",
    strength: "60000 IU",
    packSize: "4 capsules",
    price: 120,
    discountPrice: 100,
    prescriptionRequired: false,
    inStock: true,
    description: "Treats vitamin D deficiency and supports bone health"
  },
  {
    id: "8",
    name: "Insulin Glargine 100IU/ml",
    genericName: "Insulin Glargine",
    manufacturer: "Sanofi",
    category: "Diabetes",
    type: "Injection",
    strength: "100IU/ml",
    packSize: "10ml vial",
    price: 950,
    discountPrice: 850,
    prescriptionRequired: true,
    inStock: true,
    description: "Long-acting insulin for diabetes management"
  },
  {
    id: "9",
    name: "Aspirin 75mg",
    genericName: "Acetylsalicylic Acid",
    manufacturer: "Bayer",
    category: "Cardiac",
    type: "Tablet",
    strength: "75mg",
    packSize: "30 tablets",
    price: 55,
    discountPrice: 45,
    prescriptionRequired: true,
    inStock: true,
    description: "Prevents blood clots and reduces heart attack risk"
  },
  {
    id: "10",
    name: "Ibuprofen 400mg",
    genericName: "Ibuprofen",
    manufacturer: "Abbott",
    category: "Pain Relief",
    type: "Tablet",
    strength: "400mg",
    packSize: "20 tablets",
    price: 75,
    discountPrice: 65,
    prescriptionRequired: false,
    inStock: true,
    description: "Relieves pain, fever, and inflammation"
  }
];

export const MEDICINE_CATEGORIES = [
  "All",
  "Pain Relief",
  "Antibiotic",
  "Allergy",
  "Gastric",
  "Diabetes",
  "Cold & Cough",
  "Vitamins",
  "Cardiac"
];
