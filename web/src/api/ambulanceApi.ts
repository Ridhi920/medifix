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

export interface AmbulanceCreate {
  name: string;
  description: string;
  features: string[];
  estimated_time: string;
  base_price: number;
  image: string;
  ambulance_type: string;
}

export interface AmbulanceUpdate extends Partial<AmbulanceCreate> {
  is_active?: boolean;
}

// API Methods
export const ambulanceAPI = {
  // Get all ambulances
  getAmbulances: async (type?: string, includeInactive?: boolean): Promise<Ambulance[]> => {
    const params: any = {};
    if (type) params.ambulance_type = type;
    if (includeInactive) params.include_inactive = true;
    const response = await api.get<Ambulance[]>('/ambulances', { params });
    return response.data;
  },

  // Get specific ambulance
  getAmbulance: async (ambulanceId: number): Promise<Ambulance> => {
    const response = await api.get<Ambulance>(`/ambulances/${ambulanceId}`);
    return response.data;
  },

  // Create ambulance (admin only)
  createAmbulance: async (data: AmbulanceCreate): Promise<Ambulance> => {
    const response = await api.post<Ambulance>('/ambulances', data);
    return response.data;
  },

  // Update ambulance (admin only)
  updateAmbulance: async (ambulanceId: number, data: AmbulanceUpdate): Promise<Ambulance> => {
    const response = await api.patch<Ambulance>(`/ambulances/${ambulanceId}`, data);
    return response.data;
  },

  // Delete ambulance (admin only)
  deleteAmbulance: async (ambulanceId: number): Promise<void> => {
    await api.delete(`/ambulances/${ambulanceId}`);
  },

  // Toggle ambulance status
  toggleAmbulanceStatus: async (ambulanceId: number, isActive: boolean): Promise<Ambulance> => {
    const response = await api.patch<Ambulance>(`/ambulances/${ambulanceId}`, { is_active: isActive });
    return response.data;
  },
};
