export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  qualification: string;
  experience: number;
  rating: number;
  consultationFee: number;
  availableDays: string[];
  availableSlots: string[];
  image: string;
  address: string;
};

export const DOCTORS: Doctor[] = [
  {
    id: "1",
    name: "Dr. Sarah Johnson",
    specialty: "Cardiologist",
    qualification: "MD, DM (Cardiology)",
    experience: 15,
    rating: 4.8,
    consultationFee: 1500,
    availableDays: ["Monday", "Wednesday", "Friday"],
    availableSlots: ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM"],
    image: "👩‍⚕️",
    address: "Apollo Hospital, Sector 26, Delhi"
  },
  {
    id: "2",
    name: "Dr. Rahul Sharma",
    specialty: "Dentist",
    qualification: "BDS, MDS (Orthodontics)",
    experience: 10,
    rating: 4.6,
    consultationFee: 800,
    availableDays: ["Tuesday", "Thursday", "Saturday"],
    availableSlots: ["10:00 AM", "11:00 AM", "12:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"],
    image: "👨‍⚕️",
    address: "Smile Dental Clinic, Connaught Place, Delhi"
  },
  {
    id: "3",
    name: "Dr. Priya Patel",
    specialty: "Pediatrician",
    qualification: "MBBS, MD (Pediatrics)",
    experience: 12,
    rating: 4.9,
    consultationFee: 1000,
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    availableSlots: ["09:00 AM", "10:30 AM", "12:00 PM", "02:00 PM", "03:30 PM", "05:00 PM"],
    image: "👩‍⚕️",
    address: "MaxHealthcare, Saket, Delhi"
  },
  {
    id: "4",
    name: "Dr. Amit Kumar",
    specialty: "General Physician",
    qualification: "MBBS, MD (Medicine)",
    experience: 20,
    rating: 4.7,
    consultationFee: 700,
    availableDays: ["Monday", "Wednesday", "Thursday", "Saturday"],
    availableSlots: ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "04:00 PM", "05:00 PM"],
    image: "👨‍⚕️",
    address: "Fortis Hospital, Vasant Kunj, Delhi"
  },
  {
    id: "5",
    name: "Dr. Neha Gupta",
    specialty: "Dermatologist",
    qualification: "MBBS, MD (Dermatology)",
    experience: 8,
    rating: 4.5,
    consultationFee: 1200,
    availableDays: ["Tuesday", "Thursday", "Friday", "Saturday"],
    availableSlots: ["10:00 AM", "11:30 AM", "01:00 PM", "03:00 PM", "04:30 PM"],
    image: "👩‍⚕️",
    address: "SkinCare Clinic, Lajpat Nagar, Delhi"
  }
];
