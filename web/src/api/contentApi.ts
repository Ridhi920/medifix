import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  avatar: string;
  quote: string;
  accent: string;
  bg: string;
  display_order: number;
  is_active: boolean;
}

export type TestimonialInput = Omit<Testimonial, 'id'>;

export interface HomeFeature {
  id: number;
  icon: string;
  title: string;
  subtitle: string;
  bg: string;
  icon_bg: string;
  display_order: number;
  is_active: boolean;
}

export type HomeFeatureInput = Omit<HomeFeature, 'id'>;

export const contentAPI = {
  // ---- Testimonials ----
  getTestimonials: async (): Promise<Testimonial[]> => {
    const res = await api.get<Testimonial[]>('/content/testimonials');
    return res.data;
  },
  createTestimonial: async (data: TestimonialInput): Promise<Testimonial> => {
    const res = await api.post<Testimonial>('/content/testimonials', data);
    return res.data;
  },
  updateTestimonial: async (id: number, data: Partial<TestimonialInput>): Promise<Testimonial> => {
    const res = await api.put<Testimonial>(`/content/testimonials/${id}`, data);
    return res.data;
  },
  deleteTestimonial: async (id: number): Promise<void> => {
    await api.delete(`/content/testimonials/${id}`);
  },

  // ---- Home Features (Why Choose MedEfix) ----
  getFeatures: async (): Promise<HomeFeature[]> => {
    const res = await api.get<HomeFeature[]>('/content/features');
    return res.data;
  },
  createFeature: async (data: HomeFeatureInput): Promise<HomeFeature> => {
    const res = await api.post<HomeFeature>('/content/features', data);
    return res.data;
  },
  updateFeature: async (id: number, data: Partial<HomeFeatureInput>): Promise<HomeFeature> => {
    const res = await api.put<HomeFeature>(`/content/features/${id}`, data);
    return res.data;
  },
  deleteFeature: async (id: number): Promise<void> => {
    await api.delete(`/content/features/${id}`);
  },
};
