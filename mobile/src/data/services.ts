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
    title: "Consult Doctor",
    summary: "Book Instant Appointment",
    description: "Book appointments with qualified doctors for consultations, checkups, and medical advice."
  },
  {
    key: "dental",
    title: "Book Dental",
    summary: "Dental Care Made Easy",
    description: "Book appointments with experienced dentists for routine checkups, treatments, and emergencies."
  },
  {
    key: "ambulance",
    title: "Ambulance",
    summary: "Book Ambulance – Emergency and Scheduled",
    description: "Quick and reliable ambulance services for medical emergencies."
  },
  {
    key: "lab",
    title: "Book Lab Test",
    summary: "Sample Collection at Home",
    description: "Book lab tests with home collection or visit our centers."
  },
  {
    key: "nurse",
    title: "Book Nurse",
    summary: "Care at Home",
    description: "Experienced nurses providing quality care in the comfort of your home."
  },
  {
    key: "physiotherapist",
    title: "Book Physiotherapy",
    summary: "Recovery at Home",
    description: "Expert physiotherapists for rehabilitation and recovery at your doorstep."
  },
  {
    key: "pharmacy",
    title: "Order Medicines",
    summary: "Delivered in 27 Mins",
    description: "Upload prescription and order medicines for home delivery."
  }
];
