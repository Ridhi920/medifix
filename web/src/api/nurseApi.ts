import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add token to requests automatically
api.interceptors.request.use(
  async (config: any) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors (unauthorized)
api.interceptors.response.use(
  (response: any) => response,
  async (error: any) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// Types
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

export interface NurseCreate {
  name: string;
  qualification: string;
  specialization: string;
  experience: number;
  rating?: number;
  services: string[];
  hourly_rate: number;
  daily_rate: number;
  available_shifts: string[];
  languages: string[];
  image: string;
  gender: string;
  latitude?: number;
  longitude?: number;
}

export interface NurseUpdate extends Partial<NurseCreate> {
  is_active?: boolean;
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

// API Methods
export const nurseAPI = {
  // Get all nurses
  getNurses: async (specialization?: string, includeInactive?: boolean): Promise<Nurse[]> => {
    const params: any = {};
    if (specialization) params.specialization = specialization;
    if (includeInactive) params.include_inactive = true;
    const response = await api.get<Nurse[]>('/nurses', { params });
    return response.data;
  },

  // Get specific nurse
  getNurse: async (nurseId: number): Promise<Nurse> => {
    const response = await api.get<Nurse>(`/nurses/${nurseId}`);
    return response.data;
  },

  // Create nurse (admin only)
  createNurse: async (data: NurseCreate): Promise<Nurse> => {
    const response = await api.post<Nurse>('/nurses', data);
    return response.data;
  },

  // Update nurse (admin only)
  updateNurse: async (nurseId: number, data: NurseUpdate): Promise<Nurse> => {
    const response = await api.patch<Nurse>(`/nurses/${nurseId}`, data);
    return response.data;
  },

  // Delete nurse (admin only)
  deleteNurse: async (nurseId: number): Promise<void> => {
    await api.delete(`/nurses/${nurseId}`);
  },

  // Toggle nurse status (admin only)
  toggleNurseStatus: async (nurseId: number, isActive: boolean): Promise<Nurse> => {
    const response = await api.patch<Nurse>(`/nurses/${nurseId}`, { is_active: isActive });
    return response.data;
  },

  // Get all bookings (admin can see all)
  getAllBookings: async (): Promise<NurseBooking[]> => {
    const response = await api.get<NurseBooking[]>('/nurses/bookings');
    return response.data;
  },

  // Get specific booking
  getBooking: async (bookingId: number): Promise<NurseBooking> => {
    const response = await api.get<NurseBooking>(`/nurses/bookings/${bookingId}`);
    return response.data;
  },

  // Cancel booking
  cancelBooking: async (bookingId: number): Promise<NurseBooking> => {
    const response = await api.patch<NurseBooking>(`/nurses/bookings/${bookingId}/cancel`, {});
    return response.data;
  },

  // Update booking status (admin only)
  updateBookingStatus: async (bookingId: number, status: string): Promise<NurseBooking> => {
    const response = await api.patch<NurseBooking>(`/nurses/bookings/${bookingId}/status`, { status });
    return response.data;
  },
};
