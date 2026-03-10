import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Types
export interface Dentist {
  id: number;
  name: string;
  specialty: string;
  qualification: string;
  experience: number;
  rating: number;
  consultation_fee: number;
  available_days: string[];
  available_slots: string[];
  image: string;
  address: string;
  is_active: boolean;
}

export interface DentistAppointmentCreate {
  dentist_id: number;
  patient_name: string;
  patient_age: number;
  symptoms?: string;
  appointment_day: string;
  appointment_slot: string;
  appointment_date?: string;
}

export interface DentistAppointment {
  id: number;
  user_id: number;
  dentist_id: number;
  patient_name: string;
  patient_age: number;
  symptoms?: string;
  appointment_day: string;
  appointment_slot: string;
  appointment_date?: string;
  consultation_fee: number;
  status: string;
  created_at: string;
  dentist_name?: string;
  dentist_specialty?: string;
  dentist_image?: string;
}

// API Methods
export const dentistApi = {
  // Get all dentists
  getDentists: async (specialty?: string): Promise<Dentist[]> => {
    const params = specialty ? { specialty } : {};
    const response = await api.get<Dentist[]>('/dentists', { params });
    return response.data;
  },

  // Get single dentist
  getDentist: async (id: number): Promise<Dentist> => {
    const response = await api.get<Dentist>(`/dentists/${id}`);
    return response.data;
  },

  // Get booked slots for a dentist on a specific day
  getBookedSlots: async (dentistId: number, day: string): Promise<string[]> => {
    const response = await api.get<string[]>(`/dentists/${dentistId}/booked-slots`, {
      params: { day },
    });
    return response.data;
  },

  // Book an appointment
  bookAppointment: async (appointmentData: DentistAppointmentCreate): Promise<DentistAppointment> => {
    const response = await api.post<DentistAppointment>('/dentists/dentist_appointments', appointmentData);
    return response.data;
  },

  // Get my appointments
  getMyAppointments: async (): Promise<DentistAppointment[]> => {
    const response = await api.get<DentistAppointment[]>('/dentists/appointments/my');
    return response.data;
  },

  // Get appointment by ID
  getAppointment: async (appointmentId: number): Promise<DentistAppointment> => {
    const response = await api.get<DentistAppointment>(`/dentists/dentist_appointments/${appointmentId}`);
    return response.data;
  },

  // Cancel appointment
  cancelAppointment: async (appointmentId: number): Promise<{ message: string }> => {
    const response = await api.patch<{ message: string }>(
      `/dentists/dentist_appointments/${appointmentId}/cancel`
    );
    return response.data;
  },
};

export default dentistApi;
