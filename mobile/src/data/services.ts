// Service types and navigation data
export type ServiceKey = "doctor" | "dental" | "ambulance" | "lab" | "nurse" | "physiotherapist" | "pharmacy";

export type ServiceItem = {
  key: ServiceKey;
  title: string;
  summary: string;
  description: string;
};

export const SERVICES: ServiceItem[] = [
  {
    key: "doctor",
    title: "Doctor Consultation",
    summary: "Consult with experienced doctors for various health concerns",
    description: "Book appointments with qualified doctors for consultations, checkups, and medical advice."
  },
  {
    key: "dental",
    title: "Dental Care",
    summary: "Expert dental care services for your entire family",
    description: "Book appointments with experienced dentists for routine checkups, treatments, and emergencies."
  },

  {
    key: "ambulance",
    title: "Ambulance Service",
    summary: "24/7 emergency ambulance service",
    description: "Quick and reliable ambulance services for medical emergencies."
  },
  {
    key: "lab",
    title: "Lab Tests",
    summary: "Diagnostic services and health checkups",
    description: "Book lab tests with home collection or visit our centers."
  },
  {
    key: "nurse",
    title: "Home Nursing",
    summary: "Professional nursing care at your home",
    description: "Experienced nurses providing quality care in the comfort of your home."
  },
  {
    key: "physiotherapist",
    title: "Physiotherapy",
    summary: "Professional physiotherapy services at home",
    description: "Expert physiotherapists for rehabilitation and recovery at your doorstep."
  },
  {
    key: "pharmacy",
    title: "Pharmacy",
    summary: "Order medicines with doorstep delivery",
    description: "Upload prescription and order medicines for home delivery."
  }
];
