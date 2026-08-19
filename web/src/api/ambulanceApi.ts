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
export interface Ambulance {
  id: number;
  // The vendor account that runs this vehicle; null for platform-owned ones.
  operator_id: number | null;
  vehicle_number: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  availability: 'available' | 'on_trip' | 'off_duty';
  name: string;
  description: string;
  features: string[];
  estimated_time: string;
  base_price: number;
  image: string;
  ambulance_type: string;
  latitude?: number | null;
  longitude?: number | null;
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
  latitude?: number;
  longitude?: number;
}

export interface AmbulanceUpdate extends Partial<AmbulanceCreate> {
  is_active?: boolean;
}

// API Methods
export const ambulanceAPI = {
  // Get all ambulances
  // The customer-facing list hides vehicles that are unlisted or not free to
  // dispatch. Admin views pass both flags to see every vehicle.
  getAmbulances: async (
    type?: string,
    includeInactive?: boolean,
    includeUnavailable?: boolean,
  ): Promise<Ambulance[]> => {
    const params: any = {};
    if (type) params.ambulance_type = type;
    if (includeInactive) params.include_inactive = true;
    if (includeUnavailable) params.include_unavailable = true;
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
