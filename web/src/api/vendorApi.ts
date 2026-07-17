import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add token to requests automatically
api.interceptors.request.use(
  async (config: any) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

export const VENDOR_ROLES = [
  { value: 'doctor', label: 'Doctor' },
  { value: 'dentist', label: 'Dentist' },
  { value: 'lab', label: 'Lab' },
  { value: 'ambulance', label: 'Ambulance' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'physiotherapist', label: 'Physiotherapist' },
  { value: 'pharmacy', label: 'Pharmacy' },
];

// Vendor roles that must be linked to an entity record (doctors, dentists, ...)
export const ENTITY_LINKED_ROLES = ['doctor', 'dentist', 'ambulance', 'nurse', 'physiotherapist'];

// Statuses a vendor can set on a booking, per vendor role
export const VENDOR_STATUS_OPTIONS: Record<string, string[]> = {
  doctor: ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'],
  dentist: ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'],
  lab: ['pending', 'confirmed', 'sample_collected', 'completed', 'cancelled'],
  ambulance: ['pending', 'confirmed', 'dispatched', 'completed', 'cancelled'],
  nurse: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
  physiotherapist: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
  pharmacy: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
};

export interface VendorSignupData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: string;

  // Doctor / Dentist profile fields
  specialty?: string;
  qualification?: string;
  experience?: number;
  consultation_fee?: number;
  address?: string;

  // Ambulance profile fields
  ambulance_type?: string;
  base_price?: number;
  estimated_time?: string;
  description?: string;

  // Nurse / Physiotherapist profile fields
  specialization?: string;
  hourly_rate?: number;
  daily_rate?: number;
  gender?: string;
}

export interface VendorUser {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
  vendor_id: number | null;
  approval_status: string;
  is_active: boolean;
  created_at: string;
}

export interface VendorBooking {
  id: number;
  booking_kind: string;
  patient_name: string;
  status: string;
  price: number;
  created_at: string;
  details: Record<string, any>;
}

export interface VendorProfile {
  id: number;
  email: string;
  full_name: string;
  role: string;
  vendor_id: number | null;
  approval_status: string;
  entity_name: string | null;
}

export interface VendorProfileReview {
  account: VendorUser;
  // Full entity record (Doctor/Dentist/Ambulance/Nurse/Physiotherapist row),
  // or null for roles without one (lab, pharmacy) or if it's missing.
  profile: Record<string, any> | null;
}

export const vendorAPI = {
  // Public: register a new vendor account (stays pending until approved)
  signup: async (data: VendorSignupData): Promise<VendorUser> => {
    const response = await api.post<VendorUser>('/auth/vendor/signup', data);
    return response.data;
  },

  // Vendor: own profile + linked entity name
  getMyProfile: async (): Promise<VendorProfile> => {
    const response = await api.get<VendorProfile>('/vendor/me');
    return response.data;
  },

  // Vendor: own bookings only
  getMyBookings: async (): Promise<VendorBooking[]> => {
    const response = await api.get<VendorBooking[]>('/vendor/bookings');
    return response.data;
  },

  // Vendor: update status of an owned booking
  updateBookingStatus: async (bookingId: number, status: string): Promise<void> => {
    await api.patch(`/vendor/bookings/${bookingId}/status`, { status });
  },

  // Vendor: full editable business-profile fields (null for lab/pharmacy)
  getMyBusinessProfile: async (): Promise<Record<string, any> | null> => {
    const response = await api.get<{ profile: Record<string, any> | null }>('/vendor/profile');
    return response.data.profile;
  },

  // Vendor: update own business-profile fields
  updateMyBusinessProfile: async (
    data: Record<string, any>
  ): Promise<Record<string, any>> => {
    const response = await api.patch<{ message: string; profile: Record<string, any> }>(
      '/vendor/profile',
      data
    );
    return response.data.profile;
  },

  // Vendor: update own account info (name/phone)
  updateMyAccount: async (data: {
    full_name?: string;
    phone?: string;
  }): Promise<VendorUser> => {
    const response = await api.put<VendorUser>('/auth/me', data);
    return response.data;
  },

  // Admin: list vendor accounts, optionally filtered by approval status
  getVendors: async (approvalStatus?: string): Promise<VendorUser[]> => {
    const params: any = {};
    if (approvalStatus) params.approval_status = approvalStatus;
    const response = await api.get<VendorUser[]>('/users/vendors/all', { params });
    return response.data;
  },

  // Admin: full review of a vendor's account + profile fields
  getVendorProfile: async (userId: number): Promise<VendorProfileReview> => {
    const response = await api.get<VendorProfileReview>(`/users/${userId}/vendor-profile`);
    return response.data;
  },

  // Admin: approve a vendor. Their profile was already created at signup,
  // so this just grants login access and makes the profile live.
  approveVendor: async (userId: number): Promise<VendorUser> => {
    const response = await api.patch<VendorUser>(`/users/${userId}/approve`, {});
    return response.data;
  },

  // Admin: reject a vendor
  rejectVendor: async (userId: number): Promise<VendorUser> => {
    const response = await api.patch<VendorUser>(`/users/${userId}/reject`, {});
    return response.data;
  },

  // Admin: delete a vendor account
  deleteVendor: async (userId: number): Promise<void> => {
    await api.delete(`/users/${userId}`);
  },
};

export default vendorAPI;
