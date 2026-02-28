export type ServiceKey = "dental" | "cardiology" | "pediatrics" | "ambulance" | "lab" | "pharmacy";

export type ServiceItem = {
  key: ServiceKey;
  title: string;
  summary: string;
  description: string;
};

export const SERVICES: ServiceItem[] = [
  {
    key: "dental",
    title: "Doctor appointment booking",
    summary: "Cleanings, fillings, and urgent dental care scheduling.",
    description:
      "Book dentist visits, hygiene checkups, and follow-ups with verified clinics."
  },
  {
    key: "cardiology",
    title: "Cardiology specialist care",
    summary: "Consultations, diagnostics, and ongoing heart health plans.",
    description:
      "Access ECG, echo, and specialist consultations with tailored treatment plans."
  },
  {
    key: "pediatrics",
    title: "Pediatrics wellness",
    summary: "Vaccinations, growth tracking, and family care reminders.",
    description:
      "Schedule pediatric visits, immunizations, and routine checkups for kids."
  },
  {
    key: "ambulance",
    title: "Ambulance booking",
    summary: "Emergency ambulance services and scheduled medical transport.",
    description:
      "Book ambulances for emergencies or scheduled appointments with multiple vehicle types."
  },
  {
    key: "lab",
    title: "Lab test booking",
    summary: "Blood tests, diagnostics, and health screening packages.",
    description:
      "Schedule lab appointments for tests, diagnostics, and comprehensive health checkups."
  },
  {
    key: "pharmacy",
    title: "Pharmacy",
    summary: "Upload prescription and get medicines delivered to your home.",
    description:
      "Order medicines online with prescription upload and convenient home delivery."
  }
];
