import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add token to requests automatically
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors (unauthorized)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear it
      await AsyncStorage.removeItem('access_token');
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

export interface SignupData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export const authAPI = {
  // Sign up a new user
  signup: async (data: SignupData): Promise<User> => {
    const response = await api.post<User>('/auth/signup', data);
    return response.data;
  },

  // Login user
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    // Store token
    await AsyncStorage.setItem('access_token', response.data.access_token);
    return response.data;
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed, clearing local token anyway');
    }
    await AsyncStorage.removeItem('access_token');
  },
};

// Doctor Types
export interface Doctor {
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

export interface AppointmentCreate {
  doctor_id: number;
  patient_name: string;
  patient_age: number;
  symptoms?: string;
  appointment_day: string;
  appointment_slot: string;
  appointment_date?: string;
}

export interface Appointment {
  id: number;
  user_id: number;
  doctor_id: number;
  patient_name: string;
  patient_age: number;
  symptoms?: string;
  appointment_day: string;
  appointment_slot: string;
  appointment_date?: string;
  consultation_fee: number;
  status: string;
  created_at: string;
  doctor_name?: string;
  doctor_specialty?: string;
  doctor_image?: string;
}

// Doctor & Appointment API
export const doctorAPI = {
  // Get all doctors
  getDoctors: async (specialty?: string): Promise<Doctor[]> => {
    const params = specialty ? { specialty } : {};
    const response = await api.get<Doctor[]>('/doctors', { params });
    return response.data;
  },

  // Get specific doctor
  getDoctor: async (doctorId: number): Promise<Doctor> => {
    const response = await api.get<Doctor>(`/doctors/${doctorId}`);
    return response.data;
  },

  // Get booked slots for a doctor on a specific day
  getBookedSlots: async (doctorId: number, day: string): Promise<string[]> => {
    const response = await api.get<string[]>(`/doctors/${doctorId}/booked-slots`, {
      params: { day }
    });
    return response.data;
  },

  // Book appointment
  bookAppointment: async (data: AppointmentCreate): Promise<Appointment> => {
    const response = await api.post<Appointment>('/doctors/doctor_appointments', data);
    return response.data;
  },

  // Get my appointments
  getMyAppointments: async (): Promise<Appointment[]> => {
    const response = await api.get<Appointment[]>('/doctors/doctor_appointments');
    return response.data;
  },

  // Get specific appointment
  getAppointment: async (appointmentId: number): Promise<Appointment> => {
    const response = await api.get<Appointment>(`/doctors/doctor_appointments/${appointmentId}`);
    return response.data;
  },

  // Cancel appointment
  cancelAppointment: async (appointmentId: number): Promise<{ message: string }> => {
    const response = await api.patch<{ message: string }>(`/doctors/doctor_appointments/${appointmentId}/cancel`);
    return response.data;
  },
};

// Dentist Types
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

// Dentist & Appointment API
export const dentistAPI = {
  // Get all dentists
  getDentists: async (specialty?: string): Promise<Dentist[]> => {
    const params = specialty ? { specialty } : {};
    const response = await api.get<Dentist[]>('/dentists', { params });
    return response.data;
  },

  // Get specific dentist
  getDentist: async (dentistId: number): Promise<Dentist> => {
    const response = await api.get<Dentist>(`/dentists/${dentistId}`);
    return response.data;
  },

  // Get booked slots for a dentist on a specific day
  getBookedSlots: async (dentistId: number, day: string): Promise<string[]> => {
    const response = await api.get<string[]>(`/dentists/${dentistId}/booked-slots`, {
      params: { day }
    });
    return response.data;
  },

  // Book appointment
  bookAppointment: async (data: DentistAppointmentCreate): Promise<DentistAppointment> => {
    const response = await api.post<DentistAppointment>('/dentists/appointments', data);
    return response.data;
  },

  // Get my appointments
  getMyAppointments: async (): Promise<DentistAppointment[]> => {
    const response = await api.get<DentistAppointment[]>('/dentists/appointments/my');
    return response.data;
  },

  // Get specific appointment
  getAppointment: async (appointmentId: number): Promise<DentistAppointment> => {
    const response = await api.get<DentistAppointment>(`/dentists/appointments/${appointmentId}`);
    return response.data;
  },

  // Cancel appointment
  cancelAppointment: async (appointmentId: number): Promise<{ message: string }> => {
    const response = await api.patch<{ message: string }>(`/dentists/appointments/${appointmentId}/cancel`);
    return response.data;
  },
};

export default api;
