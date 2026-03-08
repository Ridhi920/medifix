import axios from 'axios';

// API URL Configuration
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

export interface DoctorCreate {
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
}

export interface DoctorUpdate extends Partial<DoctorCreate> {
  is_active?: boolean;
}

// API Methods
export const doctorAPI = {
  // Get all doctors
  getDoctors: async (specialty?: string, includeInactive?: boolean): Promise<Doctor[]> => {
    const params: any = {};
    if (specialty) params.specialty = specialty;
    if (includeInactive) params.include_inactive = true;
    const response = await api.get<Doctor[]>('/doctors', { params });
    return response.data;
  },

  // Get specific doctor
  getDoctor: async (doctorId: number): Promise<Doctor> => {
    const response = await api.get<Doctor>(`/doctors/${doctorId}`);
    return response.data;
  },

  // Create doctor (admin only)
  createDoctor: async (data: DoctorCreate): Promise<Doctor> => {
    const response = await api.post<Doctor>('/doctors', data);
    return response.data;
  },

  // Update doctor (admin only)
  updateDoctor: async (doctorId: number, data: DoctorUpdate): Promise<Doctor> => {
    const response = await api.patch<Doctor>(`/doctors/${doctorId}`, data);
    return response.data;
  },

  // Delete doctor (admin only)
  deleteDoctor: async (doctorId: number): Promise<void> => {
    await api.delete(`/doctors/${doctorId}`);
  },

  // Toggle doctor active status
  toggleDoctorStatus: async (doctorId: number, isActive: boolean): Promise<Doctor> => {
    const response = await api.patch<Doctor>(`/doctors/${doctorId}`, {
      is_active: isActive,
    });
    return response.data;
  },
};

export default api;
