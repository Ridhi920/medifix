import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

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
  is_active: boolean;
}

export interface PhysiotherapistCreate {
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
}

export interface PhysiotherapistUpdate extends Partial<PhysiotherapistCreate> {
  is_active?: boolean;
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

// API Methods
export const physiotherapistAPI = {
  // Get all physiotherapists
  getPhysiotherapists: async (specialization?: string, includeInactive?: boolean): Promise<Physiotherapist[]> => {
    const params: any = {};
    if (specialization) params.specialization = specialization;
    if (includeInactive) params.include_inactive = true;
    const response = await api.get<Physiotherapist[]>('/physiotherapists', { params });
    return response.data;
  },

  // Get specific physiotherapist
  getPhysiotherapist: async (physiotherapistId: number): Promise<Physiotherapist> => {
    const response = await api.get<Physiotherapist>(`/physiotherapists/${physiotherapistId}`);
    return response.data;
  },

  // Create physiotherapist (admin only)
  createPhysiotherapist: async (data: PhysiotherapistCreate): Promise<Physiotherapist> => {
    const response = await api.post<Physiotherapist>('/physiotherapists', data);
    return response.data;
  },

  // Update physiotherapist (admin only)
  updatePhysiotherapist: async (physiotherapistId: number, data: PhysiotherapistUpdate): Promise<Physiotherapist> => {
    const response = await api.patch<Physiotherapist>(`/physiotherapists/${physiotherapistId}`, data);
    return response.data;
  },

  // Delete physiotherapist (admin only)
  deletePhysiotherapist: async (physiotherapistId: number): Promise<void> => {
    await api.delete(`/physiotherapists/${physiotherapistId}`);
  },

  // Toggle physiotherapist status (admin only)
  togglePhysiotherapistStatus: async (physiotherapistId: number, isActive: boolean): Promise<Physiotherapist> => {
    const response = await api.patch<Physiotherapist>(`/physiotherapists/${physiotherapistId}`, { is_active: isActive });
    return response.data;
  },

  // Get all bookings (admin can see all)
  getAllBookings: async (): Promise<PhysiotherapistBooking[]> => {
    const response = await api.get<PhysiotherapistBooking[]>('/physiotherapists/bookings');
    return response.data;
  },

  // Get specific booking
  getBooking: async (bookingId: number): Promise<PhysiotherapistBooking> => {
    const response = await api.get<PhysiotherapistBooking>(`/physiotherapists/bookings/${bookingId}`);
    return response.data;
  },

  // Update booking status (admin only)
  updateBookingStatus: async (bookingId: number, status: string): Promise<PhysiotherapistBooking> => {
    const response = await api.patch<PhysiotherapistBooking>(`/physiotherapists/bookings/${bookingId}/status`, { status });
    return response.data;
  },
};
