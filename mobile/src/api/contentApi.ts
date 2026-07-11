import { API_BASE_URL } from "../config/api";

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

export async function fetchTestimonials(): Promise<Testimonial[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/content/testimonials`);
    if (!res.ok) return [];
    const data: Testimonial[] = await res.json();
    return data.filter((t) => t.is_active);
  } catch {
    return [];
  }
}

export async function fetchHomeFeatures(): Promise<HomeFeature[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/content/features`);
    if (!res.ok) return [];
    const data: HomeFeature[] = await res.json();
    return data.filter((f) => f.is_active);
  } catch {
    return [];
  }
}
