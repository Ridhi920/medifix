import axios from 'axios';
import type { Admission, TestEntry } from './vendorApi';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface AdminAdmissionCreate {
  patient_name: string;
  vendor_role?: string;
  provider_id?: number | null;
  provider_name?: string;
  age?: number;
  gender?: string;
  contact?: string;
  ward?: string;
  bed_number?: string;
  diagnosis?: string;
  attending_doctor?: string;
  notes?: string;
  tests?: TestEntry[];
}

export interface AdmissionsSummary {
  total: number;
  admitted: number;
  discharged: number;
}

export const adminInpatientAPI = {
  list: async (params?: { status?: string; provider_id?: number }): Promise<Admission[]> => {
    const res = await api.get<Admission[]>('/admin/inpatient', { params });
    return res.data;
  },

  summary: async (): Promise<AdmissionsSummary> => {
    const res = await api.get<AdmissionsSummary>('/admin/inpatient/summary');
    return res.data;
  },

  admit: async (data: AdminAdmissionCreate): Promise<Admission> => {
    const res = await api.post<Admission>('/admin/inpatient', data);
    return res.data;
  },

  discharge: async (id: number): Promise<Admission> => {
    const res = await api.patch<Admission>(`/admin/inpatient/${id}`, { status: 'discharged' });
    return res.data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/admin/inpatient/${id}`);
  },
};
