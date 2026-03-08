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

// User & Profile Types
export interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface UserUpdate {
  full_name?: string;
  phone?: string;
  email?: string;
}

export interface PasswordUpdate {
  current_password: string;
  new_password: string;
}

// Booking Types
export interface DoctorAppointment {
  id: number;
  user_id: number;
  doctor_id: number;
  patient_name: string;
  patient_age: number;
  symptoms?: string;
  appointment_day: string;
  appointment_slot: string;
  consultation_fee: number;
  status: string;
  created_at: string;
  doctor_name: string;
  doctor_specialty: string;
  doctor_image: string;
}

export interface LabBooking {
  id: number;
  user_id: number;
  lab_test_id: number;
  patient_name: string;
  patient_age: number;
  patient_phone: string;
  collection_date: string;
  collection_time: string;
  home_collection: boolean;
  address?: string;
  center_name?: string;
  test_price: number;
  status: string;
  created_at: string;
  test_name: string;
  test_category: string;
  test_parameters: string[];
}

export interface AmbulanceBooking {
  id: number;
  user_id: number;
  ambulance_id: number;
  patient_name: string;
  contact_number: string;
  pickup_address: string;
  dropoff_address?: string;
  medical_condition?: string;
  booking_type: string;
  scheduled_date?: string;
  scheduled_time?: string;
  ambulance_price: number;
  status: string;
  created_at: string;
  ambulance_name: string;
  ambulance_type: string;
  ambulance_image: string;
}

export interface AllBookings {
  appointments: DoctorAppointment[];
  labBookings: LabBooking[];
  ambulanceBookings: AmbulanceBooking[];
}

// Profile API
export const userAPI = {
  // Get current user profile
  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  // Update profile
  updateProfile: async (data: UserUpdate): Promise<User> => {
    const response = await api.put<User>('/auth/me', data);
    return response.data;
  },

  // Update password
  updatePassword: async (data: PasswordUpdate): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }>('/auth/me/password', data);
    return response.data;
  },

  // Get all user bookings
  getAllBookings: async (): Promise<AllBookings> => {
    try {
      console.log('Fetching all bookings...');
      
      const [appointmentsRes, labBookingsRes, ambulanceBookingsRes] = await Promise.allSettled([
        api.get<DoctorAppointment[]>('/doctors/appointments/my'),
        api.get<LabBooking[]>('/lab-tests/bookings/my'),
        api.get<AmbulanceBooking[]>('/ambulances/bookings/my'),
      ]);

      const appointments = appointmentsRes.status === 'fulfilled' ? appointmentsRes.value.data : [];
      const labBookings = labBookingsRes.status === 'fulfilled' ? labBookingsRes.value.data : [];
      const ambulanceBookings = ambulanceBookingsRes.status === 'fulfilled' ? ambulanceBookingsRes.value.data : [];

      if (appointmentsRes.status === 'rejected') {
        console.error('Error fetching appointments:', appointmentsRes.reason);
        console.error('Appointments error details:', appointmentsRes.reason.response?.data);
      }
      if (labBookingsRes.status === 'rejected') {
        console.error('Error fetching lab bookings:', labBookingsRes.reason);
        console.error('Lab bookings error details:', labBookingsRes.reason.response?.data);
      }
      if (ambulanceBookingsRes.status === 'rejected') {
        console.error('Error fetching ambulance bookings:', ambulanceBookingsRes.reason);
      }

      console.log('Appointments fetched:', appointments.length);
      console.log('Lab bookings fetched:', labBookings.length);
      console.log('Ambulance bookings fetched:', ambulanceBookings.length);

      return {
        appointments,
        labBookings,
        ambulanceBookings,
      };
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return {
        appointments: [],
        labBookings: [],
        ambulanceBookings: [],
      };
    }
  },
};
