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

export interface OrderItem {
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
  notes?: string;
}

export const pharmacyApi = {
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

  getMyOrders: async (): Promise<MedicineOrder[]> => {
    const res = await api.get<MedicineOrder[]>('/pharmacy/orders/my');
    return res.data;
  },

  cancelOrder: async (orderId: number): Promise<MedicineOrder> => {
    const res = await api.patch<MedicineOrder>(`/pharmacy/orders/${orderId}/cancel`);
    return res.data;
  },
};
