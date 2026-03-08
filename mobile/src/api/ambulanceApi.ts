import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

export interface Ambulance {
  id: number;
  name: string;
  description: string;
  features: string[];
  estimated_time: string;
  base_price: number;
  image: string;
  ambulance_type: string;
  is_active: boolean;
}

export interface AmbulanceBookingCreate {
  ambulance_id: number;
  patient_name: string;
  contact_number: string;
  pickup_address: string;
  dropoff_address: string;
  medical_condition?: string;
  booking_type: 'immediate' | 'scheduled';
  scheduled_date?: string;
  scheduled_time?: string;
}

export interface AmbulanceBooking {
  id: number;
  user_id: number;
  ambulance_id: number;
  patient_name: string;
  contact_number: string;
  pickup_address: string;
  dropoff_address: string;
  medical_condition: string | null;
  booking_type: 'immediate' | 'scheduled';
  scheduled_date: string | null;
  scheduled_time: string | null;
  ambulance_price: number;
  status: 'pending' | 'confirmed' | 'dispatched' | 'completed' | 'cancelled';
  created_at: string;
  ambulance?: Ambulance;
}

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('access_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const ambulanceAPI = {
  // Get all active ambulances
  getAmbulances: async (): Promise<Ambulance[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/ambulances`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch ambulances:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get a specific ambulance
  getAmbulance: async (ambulanceId: number): Promise<Ambulance> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/ambulances/${ambulanceId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch ambulance:', error.response?.data || error.message);
      throw error;
    }
  },

  // Create a booking (requires authentication)
  createAmbulanceBooking: async (bookingData: AmbulanceBookingCreate): Promise<AmbulanceBooking> => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.post(
        `${API_BASE_URL}/ambulances/bookings`,
        bookingData,
        { headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to create ambulance booking:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get user's ambulance bookings
  getMyAmbulanceBookings: async (): Promise<AmbulanceBooking[]> => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(
        `${API_BASE_URL}/ambulances/bookings/my`,
        { headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch my ambulance bookings:', error.response?.data || error.message);
      throw error;
    }
  },

  // Cancel a booking
  cancelAmbulanceBooking: async (bookingId: number): Promise<AmbulanceBooking> => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.patch(
        `${API_BASE_URL}/ambulances/bookings/${bookingId}/cancel`,
        {},
        { headers }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to cancel ambulance booking:', error.response?.data || error.message);
      throw error;
    }
  }
};
