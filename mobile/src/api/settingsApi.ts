import { API_BASE_URL } from "../config/api";

export interface FeeSettings {
  convenience_fee: number;
  delivery_fee: number;
  free_delivery_threshold: number;
}

const DEFAULT_FEES: FeeSettings = {
  convenience_fee: 7,
  delivery_fee: 20,
  free_delivery_threshold: 400,
};

export async function fetchFeeSettings(): Promise<FeeSettings> {
  try {
    const res = await fetch(`${API_BASE_URL}/settings/fees`);
    if (!res.ok) return DEFAULT_FEES;
    return await res.json();
  } catch {
    return DEFAULT_FEES;
  }
}

export interface AvailabilitySettings {
  known_services: string[];
  unavailable_services: string[];
  return_dates: Record<string, string>;
}

export interface ServiceAvailability {
  unavailableServices: string[];
  returnDates: Record<string, string>;
}

export async function fetchServiceAvailability(): Promise<ServiceAvailability> {
  try {
    const res = await fetch(`${API_BASE_URL}/settings/availability`);
    if (!res.ok) return { unavailableServices: [], returnDates: {} };
    const data: AvailabilitySettings = await res.json();
    return {
      unavailableServices: Array.isArray(data.unavailable_services) ? data.unavailable_services : [],
      returnDates: data.return_dates ?? {},
    };
  } catch {
    return { unavailableServices: [], returnDates: {} };
  }
}
