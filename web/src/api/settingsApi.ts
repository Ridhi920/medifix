import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const api = axios.create({ baseURL: API_BASE_URL });

export interface FeeSettings {
  convenience_fee: number;
  delivery_fee: number;
  free_delivery_threshold: number;
}

export interface AvailabilitySettings {
  known_services: string[];
  unavailable_services: string[];
}

export const settingsAPI = {
  getFees: async (): Promise<FeeSettings> => {
    const res = await api.get('/settings/fees');
    return res.data;
  },

  updateFees: async (data: FeeSettings, token: string): Promise<FeeSettings> => {
    const res = await api.put('/settings/fees', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  getAvailability: async (): Promise<AvailabilitySettings> => {
    const res = await api.get('/settings/availability');
    return res.data;
  },

  updateAvailability: async (
    unavailable_services: string[],
    token: string,
  ): Promise<AvailabilitySettings> => {
    const res = await api.put(
      '/settings/availability',
      { unavailable_services },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return res.data;
  },
};
