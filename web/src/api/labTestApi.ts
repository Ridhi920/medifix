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
export interface LabTest {
  id: number;
  name: string;
  description: string;
  parameters: string[];
  price: number;
  report_time: string;
  fasting_required: boolean;
  category: string;
  popular: boolean;
  is_active: boolean;
}

export interface LabTestCreate {
  name: string;
  description: string;
  parameters: string[];
  price: number;
  report_time: string;
  fasting_required: boolean;
  category: string;
  popular: boolean;
}

export interface LabTestUpdate extends Partial<LabTestCreate> {
  is_active?: boolean;
}

// API Methods
export const labTestAPI = {
  // Get all lab tests
  getLabTests: async (category?: string, includeInactive?: boolean): Promise<LabTest[]> => {
    const params: any = {};
    if (category) params.category = category;
    if (includeInactive) params.include_inactive = true;
    const response = await api.get<LabTest[]>('/lab-tests', { params });
    return response.data;
  },

  // Get specific lab test
  getLabTest: async (testId: number): Promise<LabTest> => {
    const response = await api.get<LabTest>(`/lab-tests/${testId}`);
    return response.data;
  },

  // Create lab test (admin only)
  createLabTest: async (data: LabTestCreate): Promise<LabTest> => {
    const response = await api.post<LabTest>('/lab-tests', data);
    return response.data;
  },

  // Update lab test (admin only)
  updateLabTest: async (testId: number, data: LabTestUpdate): Promise<LabTest> => {
    const response = await api.patch<LabTest>(`/lab-tests/${testId}`, data);
    return response.data;
  },

  // Delete lab test (admin only)
  deleteLabTest: async (testId: number): Promise<void> => {
    await api.delete(`/lab-tests/${testId}`);
  },

  // Toggle lab test status
  toggleLabTestStatus: async (testId: number, isActive: boolean): Promise<LabTest> => {
    const response = await api.patch<LabTest>(`/lab-tests/${testId}`, { is_active: isActive });
    return response.data;
  },
};
