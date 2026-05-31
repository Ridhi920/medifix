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
export interface Medicine {
  id: number;
  name: string;
  generic_name: string;
  manufacturer: string;
  category: string;
  price: number;
  stock: number;
  requires_prescription: boolean;
  description: string | null;
  dosage_form: string | null;
  strength: string | null;
  image: string | null;
  is_active: boolean;
  created_at: string;
}

export interface MedicineCreate {
  name: string;
  generic_name: string;
  manufacturer: string;
  category: string;
  price: number;
  stock?: number;
  requires_prescription?: boolean;
  description?: string | null;
  dosage_form?: string | null;
  strength?: string | null;
  image?: string | null;
}

export interface MedicineUpdate extends Partial<MedicineCreate> {
  is_active?: boolean;
}

export interface MedicineOrderItem {
  medicine_id: number;
  medicine_name: string;
  quantity: number;
  price: number;
}

export interface MedicineOrder {
  id: number;
  user_id: number;
  patient_name: string;
  patient_phone: string;
  delivery_address: string;
  items: MedicineOrderItem[];
  total_amount: number;
  prescription_image: string | null;
  notes: string | null;
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  created_at: string;
}

export interface PrescriptionSubmission {
  id: number;
  user_id: number | null;
  image_data: string;
  status: 'pending' | 'reviewed';
  admin_notes: string | null;
  created_at: string;
}

// API Methods
export const pharmacyAPI = {
  // ========== Medicine Management ==========
  
  // Get all medicines
  getMedicines: async (category?: string, search?: string, activeOnly?: boolean): Promise<Medicine[]> => {
    const params: any = {};
    if (category) params.category = category;
    if (search) params.search = search;
    if (activeOnly !== undefined) params.active_only = activeOnly;
    const response = await api.get<Medicine[]>('/pharmacy/medicines', { params });
    return response.data;
  },

  // Get specific medicine
  getMedicine: async (medicineId: number): Promise<Medicine> => {
    const response = await api.get<Medicine>(`/pharmacy/medicines/${medicineId}`);
    return response.data;
  },

  // Create medicine (admin only)
  createMedicine: async (data: MedicineCreate): Promise<Medicine> => {
    const response = await api.post<Medicine>('/pharmacy/medicines', data);
    return response.data;
  },

  // Update medicine (admin only)
  updateMedicine: async (medicineId: number, data: MedicineUpdate): Promise<Medicine> => {
    const response = await api.put<Medicine>(`/pharmacy/medicines/${medicineId}`, data);
    return response.data;
  },

  // Delete medicine (admin only)
  deleteMedicine: async (medicineId: number): Promise<void> => {
    await api.delete(`/pharmacy/medicines/${medicineId}`);
  },

  // Toggle medicine status (admin only)
  toggleMedicineStatus: async (medicineId: number, isActive: boolean): Promise<void> => {
    await api.patch(`/pharmacy/medicines/${medicineId}/toggle-status?is_active=${isActive}`);
  },

  // ========== Medicine Orders ==========

  // Get all orders (admin can see all)
  getAllOrders: async (): Promise<MedicineOrder[]> => {
    const response = await api.get<MedicineOrder[]>('/pharmacy/orders/all');
    return response.data;
  },

  // Get specific order
  getOrder: async (orderId: number): Promise<MedicineOrder> => {
    const response = await api.get<MedicineOrder>(`/pharmacy/orders/${orderId}`);
    return response.data;
  },

  // Update order status (admin only)
  updateOrderStatus: async (orderId: number, status: string): Promise<MedicineOrder> => {
    const response = await api.patch<MedicineOrder>(`/pharmacy/orders/${orderId}/status`, { status });
    return response.data;
  },

  // Cancel order
  cancelOrder: async (orderId: number): Promise<MedicineOrder> => {
    const response = await api.patch<MedicineOrder>(`/pharmacy/orders/${orderId}/cancel`);
    return response.data;
  },

  // ========== Prescriptions ==========

  getAllPrescriptions: async (): Promise<PrescriptionSubmission[]> => {
    const response = await api.get<PrescriptionSubmission[]>('/pharmacy/prescriptions/all');
    return response.data;
  },

  updatePrescriptionStatus: async (id: number, status: string, adminNotes?: string): Promise<PrescriptionSubmission> => {
    const response = await api.patch<PrescriptionSubmission>(`/pharmacy/prescriptions/${id}/status`, {
      status,
      admin_notes: adminNotes,
    });
    return response.data;
  },
};
