import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

export interface Nurse {
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

export interface NurseBookingCreate {
  nurse_id: number;
  patient_name: string;
  patient_age: number;
  patient_gender: string;
  contact_number: string;
  address: string;
  medical_condition?: string;
  required_services: string[];
  booking_type: 'hourly' | 'daily' | 'weekly';
  duration: number;
  shift_preference: string;
  start_date: string;
  start_time?: string;
  special_instructions?: string;
}

export interface NurseBooking {
  id: number;
  user_id: number;
  nurse_id: number;
  patient_name: string;
  patient_age: number;
  patient_gender: string;
  contact_number: string;
  address: string;
  medical_condition: string | null;
  required_services: string[];
  booking_type: 'hourly' | 'daily' | 'weekly';
  duration: number;
  shift_preference: string;
  start_date: string;
  start_time: string | null;
  total_price: number;
  special_instructions: string | null;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  nurse_name?: string;
  nurse_qualification?: string;
  nurse_specialization?: string;
  nurse_image?: string;
}

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('access_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const nurseAPI = {
  // Get all active nurses
  getNurses: async (specialization?: string): Promise<Nurse[]> => {
    try {
      const params = specialization ? { specialization } : {};
      const response = await axios.get(`${API_BASE_URL}/nurses`, { params });
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch nurses:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get a specific nurse
  getNurse: async (nurseId: number): Promise<Nurse> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/nurses/${nurseId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch nurse:', error.response?.data || error.message);
      throw error;
    }
  },

  // Create a booking (requires authentication)
  createNurseBooking: async (bookingData: NurseBookingCreate): Promise<NurseBooking> => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.post(
        `${API_BASE_URL}/nurses/bookings`,
        bookingData,
        { headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to create nurse booking:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get user's nurse bookings
  getMyNurseBookings: async (): Promise<NurseBooking[]> => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(
        `${API_BASE_URL}/nurses/bookings`,
        { headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch nurse bookings:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get a specific booking
  getNurseBooking: async (bookingId: number): Promise<NurseBooking> => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(
        `${API_BASE_URL}/nurses/bookings/${bookingId}`,
        { headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch nurse booking:', error.response?.data || error.message);
      throw error;
    }
  },

  // Cancel a booking
  cancelNurseBooking: async (bookingId: number): Promise<NurseBooking> => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.patch(
        `${API_BASE_URL}/nurses/bookings/${bookingId}/cancel`,
        {},
        { headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to cancel nurse booking:', error.response?.data || error.message);
      throw error;
    }
  },
};
