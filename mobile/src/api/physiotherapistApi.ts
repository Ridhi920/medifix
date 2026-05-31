import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

export interface Physiotherapist {
  id: number;
  name: string;
  qualification: string;
  specialization: string;
  experience: number;
  rating: number;
  services: string[];
  hourly_rate: number;
  daily_rate: number;
  available_shifts: string[];
  languages: string[];
  image: string;
  gender: string;
  latitude?: number | null;
  longitude?: number | null;
  is_active: boolean;
}

export interface PhysiotherapistBookingCreate {
  physiotherapist_id: number;
  patient_name: string;
  patient_age: number;
  patient_gender: string;
  contact_number: string;
  service_type?: 'home' | 'clinic';
  address?: string;
  medical_condition?: string;
  required_services: string[];
  booking_type: 'session' | 'daily' | 'weekly';
  duration: number;
  shift_preference: string;
  start_date: string;
  start_time?: string;
  special_instructions?: string;
}

export interface PhysiotherapistBooking {
  id: number;
  user_id: number;
  physiotherapist_id: number;
  patient_name: string;
  patient_age: number;
  patient_gender: string;
  contact_number: string;
  address: string;
  medical_condition: string | null;
  required_services: string[];
  booking_type: 'session' | 'daily' | 'weekly';
  duration: number;
  shift_preference: string;
  start_date: string;
  start_time: string | null;
  total_price: number;
  special_instructions: string | null;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  physiotherapist_name?: string;
  physiotherapist_qualification?: string;
  physiotherapist_specialization?: string;
  physiotherapist_image?: string;
}

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('access_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const physiotherapistAPI = {
  // Get all active physiotherapists
  getPhysiotherapists: async (specialization?: string): Promise<Physiotherapist[]> => {
    try {
      const params = specialization ? { specialization } : {};
      const response = await axios.get(`${API_BASE_URL}/physiotherapists`, { params });
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch physiotherapists:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get a specific physiotherapist
  getPhysiotherapist: async (physiotherapistId: number): Promise<Physiotherapist> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/physiotherapists/${physiotherapistId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch physiotherapist:', error.response?.data || error.message);
      throw error;
    }
  },

  // Create a booking (requires authentication)
  createPhysiotherapistBooking: async (bookingData: PhysiotherapistBookingCreate): Promise<PhysiotherapistBooking> => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.post(
        `${API_BASE_URL}/physiotherapists/bookings`,
        bookingData,
        { headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to create physiotherapist booking:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get user's physiotherapist bookings
  getMyPhysiotherapistBookings: async (): Promise<PhysiotherapistBooking[]> => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(
        `${API_BASE_URL}/physiotherapists/bookings/my`,
        { headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch physiotherapist bookings:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get a specific booking
  getPhysiotherapistBooking: async (bookingId: number): Promise<PhysiotherapistBooking> => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(
        `${API_BASE_URL}/physiotherapists/bookings/${bookingId}`,
        { headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch physiotherapist booking:', error.response?.data || error.message);
      throw error;
    }
  },

  // Cancel a booking
  cancelPhysiotherapistBooking: async (bookingId: number): Promise<PhysiotherapistBooking> => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.patch(
        `${API_BASE_URL}/physiotherapists/bookings/${bookingId}/cancel`,
        {},
        { headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to cancel physiotherapist booking:', error.response?.data || error.message);
      throw error;
    }
  },
};
