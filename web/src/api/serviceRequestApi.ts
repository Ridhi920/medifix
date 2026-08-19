import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const api = axios.create({ baseURL: API_BASE_URL });

export interface ServiceRequest {
  id: number;
  patient_id: number | null;
  patient_name: string;
  provider_id: number | null;
  provider_name: string | null;
  service: string;
  request_type: string;
  status: string;
  booking_date: string;
  scheduled_date: string | null;
  priority: string;
  amount: number | null;
  source_type: string | null;
  source_id: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceRequestSummary {
  total: number;
  open: number;
  by_status: Record<string, number>;
  by_service: Record<string, number>;
  statuses: string[];
}

export interface ServiceRequestQuery {
  service?: string;
  status?: string;
  provider_id?: number;
  patient_id?: number;
  limit?: number;
  offset?: number;
}

// Mirror of the backend STATUS_FLOW so the UI only offers valid transitions.
export const STATUS_FLOW: Record<string, string[]> = {
  created: ['confirmed', 'cancelled'],
  confirmed: ['scheduled', 'in_progress', 'cancelled'],
  scheduled: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: ['closed'],
  closed: [],
  cancelled: [],
};

export const serviceRequestAPI = {
  list: async (token: string, params: ServiceRequestQuery = {}): Promise<ServiceRequest[]> => {
    const res = await api.get('/service-requests', {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return res.data;
  },

  summary: async (token: string): Promise<ServiceRequestSummary> => {
    const res = await api.get('/service-requests/summary', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  updateStatus: async (token: string, id: number, status: string): Promise<ServiceRequest> => {
    const res = await api.patch(
      `/service-requests/${id}/status`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return res.data;
  },
};
