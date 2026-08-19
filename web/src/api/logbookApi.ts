import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const api = axios.create({ baseURL: API_BASE_URL });

export interface LogEntry {
  id: number;
  actor: string;
  actor_user_id: number | null;
  action: string;
  module: string;
  entity_type: string | null;
  entity_id: number | null;
  provider_id: number | null;
  patient_id: number | null;
  meta: string; // JSON string
  created_at: string;
}

export interface LogbookQuery {
  module?: string;
  provider_id?: number;
  patient_id?: number;
  limit?: number;
  offset?: number;
}

export const logbookAPI = {
  list: async (token: string, params: LogbookQuery = {}): Promise<LogEntry[]> => {
    const res = await api.get('/logbook', {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return res.data;
  },
};
