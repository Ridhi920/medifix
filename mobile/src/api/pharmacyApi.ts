import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, // longer timeout for base64 image upload
});

api.interceptors.request.use(async (config: any) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface PrescriptionSubmission {
  id: number;
  user_id: number | null;
  image_data: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

export const pharmacyApi = {
  submitPrescription: async (imageBase64: string): Promise<PrescriptionSubmission> => {
    const response = await api.post<PrescriptionSubmission>('/pharmacy/prescriptions', {
      image_data: imageBase64,
    });
    return response.data;
  },
};
