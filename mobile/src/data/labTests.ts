export type LabTest = {
  id: string;
  name: string;
  description: string;
  parameters: string[];
  price: number;
  reportTime: string;
  fastingRequired: boolean;
  category: string;
  popular: boolean;
};

export const LAB_TESTS: LabTest[] = [
  {
    id: "1",
    name: "Complete Blood Count (CBC)",
    description: "Comprehensive blood analysis to check overall health status",
    parameters: [
      "Hemoglobin",
      "RBC Count",
      "WBC Count",
      "Platelet Count",
      "MCV, MCH, MCHC"
    ],
    price: 350,
    reportTime: "6 hours",
    fastingRequired: false,
    category: "Blood Test",
    popular: true
  },
  {
    id: "2",
    name: "Lipid Profile",
    description: "Measures cholesterol levels and heart health markers",
    parameters: [
      "Total Cholesterol",
      "HDL Cholesterol",
      "LDL Cholesterol",
      "Triglycerides",
      "VLDL"
    ],
    price: 600,
    reportTime: "12 hours",
    fastingRequired: true,
    category: "Blood Test",
    popular: true
  },
  {
    id: "3",
    name: "Thyroid Profile (T3, T4, TSH)",
    description: "Checks thyroid gland function and hormone levels",
    parameters: [
      "T3 (Triiodothyronine)",
      "T4 (Thyroxine)",
      "TSH (Thyroid Stimulating Hormone)"
    ],
    price: 450,
    reportTime: "24 hours",
    fastingRequired: false,
    category: "Blood Test",
    popular: true
  },
  {
    id: "4",
    name: "Diabetes Screening (HbA1c + Fasting)",
    description: "Comprehensive diabetes check including long-term sugar control",
    parameters: [
      "HbA1c",
      "Fasting Blood Sugar",
      "Average Glucose"
    ],
    price: 550,
    reportTime: "24 hours",
    fastingRequired: true,
    category: "Blood Test",
    popular: true
  },
  {
    id: "5",
    name: "Liver Function Test (LFT)",
    description: "Evaluates liver health and detects liver diseases",
    parameters: [
      "Bilirubin",
      "SGOT/SGPT",
      "Alkaline Phosphatase",
      "Total Protein",
      "Albumin & Globulin"
    ],
    price: 500,
    reportTime: "12 hours",
    fastingRequired: false,
    category: "Blood Test",
    popular: false
  },
  {
    id: "6",
    name: "Kidney Function Test (KFT)",
    description: "Assesses kidney health and function",
    parameters: [
      "Blood Urea",
      "Serum Creatinine",
      "Uric Acid",
      "Sodium, Potassium"
    ],
    price: 450,
    reportTime: "12 hours",
    fastingRequired: false,
    category: "Blood Test",
    popular: false
  },
  {
    id: "7",
    name: "Vitamin D Test",
    description: "Measures Vitamin D levels in blood",
    parameters: [
      "25-Hydroxyvitamin D"
    ],
    price: 800,
    reportTime: "24 hours",
    fastingRequired: false,
    category: "Blood Test",
    popular: true
  },
  {
    id: "8",
    name: "Full Body Checkup Package",
    description: "Comprehensive health screening with 60+ parameters",
    parameters: [
      "CBC, Lipid Profile",
      "Diabetes Screening",
      "Thyroid Profile",
      "Liver & Kidney Function",
      "Vitamin D & B12",
      "Urine Analysis"
    ],
    price: 2500,
    reportTime: "48 hours",
    fastingRequired: true,
    category: "Health Package",
    popular: true
  }
];

export const LAB_CENTERS = [
  {
    id: "1",
    name: "PathLab Diagnostics",
    address: "Sector 18, Noida",
    rating: 4.7,
    distance: "2.5 km"
  },
  {
    id: "2",
    name: "Dr. Lal PathLabs",
    address: "Connaught Place, Delhi",
    rating: 4.8,
    distance: "5.2 km"
  },
  {
    id: "3",
    name: "Thyrocare Technologies",
    address: "Rohini, Delhi",
    rating: 4.6,
    distance: "8.0 km"
  }
];
