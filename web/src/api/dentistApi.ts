import axios from 'axios';

// API URL Configuration
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
  latitude?: number | null;
  longitude?: number | null;
  is_active: boolean;
}

export interface DentistCreate {
  name: string;
  specialty: string;
  qualification: string;
  experience: number;
  rating?: number;
  consultation_fee: number;
  available_days: string[];
  available_slots: string[];
  image: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

export interface DentistUpdate extends Partial<DentistCreate> {
  is_active?: boolean;
}

// API Methods
export const dentistAPI = {
  // Get all dentists
  getDentists: async (specialty?: string, includeInactive?: boolean): Promise<Dentist[]> => {
    const params: any = {};
    if (specialty) params.specialty = specialty;
    if (includeInactive) params.include_inactive = true;
    const response = await api.get<Dentist[]>('/dentists', { params });
    return response.data;
  },

  // Get specific dentist
  getDentist: async (dentistId: number): Promise<Dentist> => {
    const response = await api.get<Dentist>(`/dentists/${dentistId}`);
    return response.data;
  },

  // Create dentist (admin only)
  createDentist: async (data: DentistCreate): Promise<Dentist> => {
    const response = await api.post<Dentist>('/dentists', data);
    return response.data;
  },

  // Update dentist (admin only)
  updateDentist: async (dentistId: number, data: DentistUpdate): Promise<Dentist> => {
    const response = await api.patch<Dentist>(`/dentists/${dentistId}`, data);
    return response.data;
  },

  // Delete dentist (admin only)
  deleteDentist: async (dentistId: number): Promise<void> => {
    await api.delete(`/dentists/${dentistId}`);
  },

  // Toggle dentist active status
  toggleDentistStatus: async (dentistId: number, isActive: boolean): Promise<Dentist> => {
    const response = await api.patch<Dentist>(`/dentists/${dentistId}`, {
      is_active: isActive,
    });
    return response.data;
  },
};

export default api;
