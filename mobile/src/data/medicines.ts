// Medicine catalog for pharmacy screen
export type Medicine = {
  id: string;
  name: string;
  genericName: string;
  manufacturer: string;
  category: string;
  price: number;
  stock: number;
  requiresPrescription: boolean;
};

export const MEDICINE_CATEGORIES = [
  "All",
  "Pain Relief",
  "Antibiotics",
  "Vitamins",
  "First Aid"
];

export const MEDICINES: Medicine[] = [
  {
    id: "med-1",
    name: "Paracetamol 500mg",
    genericName: "Acetaminophen",
    manufacturer: "Generic Pharma",
    category: "Pain Relief",
    price: 50,
    stock: 100,
    requiresPrescription: false
  },
  {
    id: "med-2",
    name: "Ibuprofen 400mg",
    genericName: "Ibuprofen",
    manufacturer: "Generic Pharma",
    category: "Pain Relief",
    price: 80,
    stock: 75,
    requiresPrescription: false
  },
  {
    id: "med-3",
    name: "Vitamin C 1000mg",
    genericName: "Ascorbic Acid",
    manufacturer: "Health Vitamins",
    category: "Vitamins",
    price: 120,
    stock: 50,
    requiresPrescription: false
  },
  {
    id: "med-4",
    name: "Amoxicillin 500mg",
    genericName: "Amoxicillin",
    manufacturer: "Generic Pharma",
    category: "Antibiotics",
    price: 200,
    stock: 40,
    requiresPrescription: true
  },
  {
    id: "med-5",
    name: "Bandage Roll",
    genericName: "Sterile Gauze",
    manufacturer: "First Aid Co",
    category: "First Aid",
    price: 30,
    stock: 200,
    requiresPrescription: false
  }
];
