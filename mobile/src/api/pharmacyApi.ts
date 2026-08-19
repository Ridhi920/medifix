import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use(async (config: any) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface PrescriptionSubmission {
  id: number;
  user_id: number | null;
  image_data: string;
  status: string;        // "pending" | "reviewed"
  admin_notes: string | null;
  created_at: string;
}

export interface PharmacyStore {
  id: number;
  name: string;
  address: string;
  city: string | null;
  phone: string | null;
  image: string;            // emoji, or an image URL / data-URL
  rating: number;
  delivery_time: string;    // e.g. "30-45 mins"
  opening_hours: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  medicine_count: number;   // active medicines currently on the shelf
}

export interface OrderItem {
  medicine_id: number;
  medicine_name: string;
  quantity: number;
  price: number;
}

export interface MedicineOrder {
  id: number;
  user_id: number;
  store_id: number | null;
  store_name: string | null;
  patient_name: string;
  patient_phone: string;
  delivery_address: string;
  items: OrderItem[];
  total_amount: number;
  prescription_image: string | null;
  notes: string | null;
  status: string;       // pending | confirmed | preparing | out_for_delivery | delivered | cancelled
  created_at: string;
}

export interface CreateOrderPayload {
  patient_name: string;
  patient_phone: string;
  delivery_address: string;
  items: OrderItem[];
  store_id?: number;
  notes?: string;
}

/** One store's basket inside a multi-store checkout. */
export interface StoreCart {
  store_id: number;
  items: OrderItem[];
}

export interface CreateMultiStoreOrderPayload {
  patient_name: string;
  patient_phone: string;
  delivery_address: string;
  carts: StoreCart[];
  notes?: string;
}

export interface BackendMedicine {
  id: number;
  store_id: number | null;
  store_name: string | null;
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
}

export const pharmacyApi = {
  // The pharmacy stores a user can order from. The app asks the customer to
  // pick a store first, then shows only that store's shelf.
  getStores: async (search?: string): Promise<PharmacyStore[]> => {
    const res = await api.get<PharmacyStore[]>('/pharmacy/stores', {
      params: { active_only: true, ...(search ? { search } : {}) },
    });
    return res.data;
  },

  // The medicine catalogue from the backend — the single source of truth so
  // medicines added/edited in the admin portal show up in the app too.
  // Pass a storeId to get just that store's shelf.
  getMedicines: async (storeId?: number): Promise<BackendMedicine[]> => {
    const res = await api.get<BackendMedicine[]>('/pharmacy/medicines', {
      params: { active_only: true, ...(storeId != null ? { store_id: storeId } : {}) },
    });
    return res.data;
  },

  submitPrescription: async (imageBase64: string): Promise<PrescriptionSubmission> => {
    const res = await api.post<PrescriptionSubmission>('/pharmacy/prescriptions', {
      image_data: imageBase64,
    });
    return res.data;
  },

  getMyPrescriptions: async (): Promise<PrescriptionSubmission[]> => {
    const res = await api.get<PrescriptionSubmission[]>('/pharmacy/prescriptions/my');
    return res.data;
  },

  createOrder: async (payload: CreateOrderPayload): Promise<MedicineOrder> => {
    const res = await api.post<MedicineOrder>('/pharmacy/orders', payload);
    return res.data;
  },

  // Check out a cart spanning several pharmacies at once. The backend creates
  // one order per store, all sharing the same delivery details, and either
  // places them all or none.
  createMultiStoreOrder: async (
    payload: CreateMultiStoreOrderPayload,
  ): Promise<MedicineOrder[]> => {
    const res = await api.post<MedicineOrder[]>('/pharmacy/orders/multi-store', payload);
    return res.data;
  },

  getMyOrders: async (): Promise<MedicineOrder[]> => {
    const res = await api.get<MedicineOrder[]>('/pharmacy/orders/my');
    return res.data;
  },

  cancelOrder: async (orderId: number): Promise<MedicineOrder> => {
    const res = await api.patch<MedicineOrder>(`/pharmacy/orders/${orderId}/cancel`);
    return res.data;
  },
};
