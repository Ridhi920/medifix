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

// Vendor roles that must be linked to an entity record (doctors, dentists,
// pharmacy stores, ...). Only `lab` operates the whole service with no record.
export const ENTITY_LINKED_ROLES = [
  'doctor',
  'dentist',
  'ambulance',
  'nurse',
  'physiotherapist',
  'pharmacy',
];

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

  // Pharmacy store fields (`address` above is the store address, `phone` its
  // contact number)
  city?: string;
  delivery_time?: string;
  opening_hours?: string;

  // Ambulance: describes the operator's first vehicle
  vehicle_number?: string;
  driver_name?: string;
}

/** Operational state of a vehicle, controlled by its operator. */
export type VehicleAvailability = 'available' | 'on_trip' | 'off_duty';

export const AVAILABILITY_LABELS: Record<VehicleAvailability, string> = {
  available: 'Available',
  on_trip: 'On trip',
  off_duty: 'Off duty',
};

export const AVAILABILITY_COLORS: Record<VehicleAvailability, 'success' | 'info' | 'default'> = {
  available: 'success',
  on_trip: 'info',
  off_duty: 'default',
};

/** One vehicle in the logged-in operator's fleet. */
export interface FleetVehicle {
  id: number;
  operator_id: number | null;
  name: string;
  description: string;
  features: string[];
  estimated_time: string;
  base_price: number;
  image: string;
  ambulance_type: string;
  vehicle_number: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  availability: VehicleAvailability;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
}

export interface FleetVehicleCreate {
  name: string;
  description: string;
  features: string[];
  estimated_time: string;
  base_price: number;
  image: string;
  ambulance_type: string;
  vehicle_number?: string | null;
  driver_name?: string | null;
  driver_phone?: string | null;
  availability?: VehicleAvailability;
}

export type FleetVehicleUpdate = Partial<FleetVehicleCreate> & { is_active?: boolean };

/** A medicine on the logged-in pharmacy's own shelf. */
export interface VendorMedicine {
  id: number;
  store_id: number | null;
  store_name: string | null;
  name: string;
  generic_name: string;
  manufacturer: string;
  category: string;
  price: number;
  stock: number;
  requires_prescription: boolean;
  description: string | null;
  dosage_form: string | null;
  strength: string | null;
  image: string | null;
  is_active: boolean;
  created_at: string;
}

export interface VendorMedicineCreate {
  name: string;
  generic_name: string;
  manufacturer: string;
  category: string;
  price: number;
  stock?: number;
  requires_prescription?: boolean;
  description?: string | null;
  dosage_form?: string | null;
  strength?: string | null;
  image?: string | null;
}

export type VendorMedicineUpdate = Partial<VendorMedicineCreate> & { is_active?: boolean };

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
  logo: string | null;
}

export interface VendorProfileReview {
  account: VendorUser;
  // Full entity record (Doctor/Dentist/Ambulance/Nurse/Physiotherapist/
  // PharmacyStore row), or null for roles without one (lab) or if it's missing.
  profile: Record<string, any> | null;
}

// ── Clinical workspace types ──────────────────────────────────────────────

export interface ClinicalNote {
  id: number;
  vendor_role: string;
  provider_id: number | null;
  patient_user_id: number | null;
  patient_name: string;
  source_type: string | null;
  source_id: number | null;
  diagnosis: string | null;
  remark: string | null;
  prescription_file: string | null;
  prescription_filename: string | null;
  created_at: string;
  updated_at: string;
}

export interface VendorPatient {
  patient_name: string;
  total_bookings: number;
  last_visit: string | null;
  condition: string | null;
  contact: string | null;
  notes_count: number;
  bookings: Array<{
    id: number;
    booking_kind: string;
    status: string;
    price: number;
    created_at: string;
    details: Record<string, any>;
  }>;
  clinical_notes: Array<{
    id: number;
    diagnosis: string | null;
    remark: string | null;
    prescription_file: string | null;
    prescription_filename: string | null;
    source_type: string | null;
    source_id: number | null;
    created_at: string;
  }>;
}

export interface VendorReport {
  id: number;
  vendor_role: string;
  provider_id: number | null;
  patient_name: string;
  source_type: string | null;
  source_id: number | null;
  title: string;
  report_type: string;
  file: string | null;
  filename: string | null;
  status: string;
  created_at: string;
}

export interface BillItem {
  description: string;
  quantity: number;
  price: number;
}

export interface VendorBill {
  id: number;
  vendor_role: string;
  provider_id: number | null;
  patient_name: string;
  source_type: string | null;
  source_id: number | null;
  items: BillItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClinicalNoteCreate {
  patient_name: string;
  patient_user_id?: number | null;
  source_type?: string | null;
  source_id?: number | null;
  diagnosis?: string;
  remark?: string;
  prescription_file?: string;
  prescription_filename?: string;
}

export interface ReportCreate {
  patient_name: string;
  patient_user_id?: number | null;
  source_type?: string | null;
  source_id?: number | null;
  title: string;
  report_type?: string;
  file?: string;
  filename?: string;
  status?: string;
}

export interface BillCreate {
  patient_name: string;
  patient_user_id?: number | null;
  source_type?: string | null;
  source_id?: number | null;
  items: BillItem[];
  tax?: number;
  discount?: number;
  notes?: string;
  status?: string;
}

export interface TestEntry {
  name: string;
  result?: string | null;
  date?: string | null;
  notes?: string | null;
}

export interface Admission {
  id: number;
  vendor_role: string;
  provider_id: number | null;
  patient_name: string;
  patient_user_id: number | null;
  age: number | null;
  gender: string | null;
  contact: string | null;
  ward: string | null;
  bed_number: string | null;
  diagnosis: string | null;
  attending_doctor: string | null;
  notes: string | null;
  tests: TestEntry[];
  admission_date: string;
  discharge_date: string | null;
  status: string; // admitted / discharged
  created_at: string;
  updated_at: string;
}

export interface AdmissionCreate {
  patient_name: string;
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

  // Vendor: set/clear own brand logo (base64 data-URL or URL; null clears)
  updateLogo: async (logo: string | null): Promise<void> => {
    await api.put('/vendor/logo', { logo });
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

  // ── Fleet (ambulance vendors only) ──────────────────────────────────────

  // Every vehicle this operator runs, listed or not.
  getMyFleet: async (): Promise<FleetVehicle[]> => {
    const response = await api.get<FleetVehicle[]>('/vendor/fleet');
    return response.data;
  },

  addFleetVehicle: async (data: FleetVehicleCreate): Promise<FleetVehicle> => {
    const response = await api.post<FleetVehicle>('/vendor/fleet', data);
    return response.data;
  },

  updateFleetVehicle: async (id: number, data: FleetVehicleUpdate): Promise<FleetVehicle> => {
    const response = await api.patch<FleetVehicle>(`/vendor/fleet/${id}`, data);
    return response.data;
  },

  removeFleetVehicle: async (id: number): Promise<void> => {
    await api.delete(`/vendor/fleet/${id}`);
  },

  // ── Pharmacy inventory (pharmacy vendors only) ──────────────────────────

  // Every medicine on the vendor's own shelf, listed or not.
  getMyMedicines: async (): Promise<VendorMedicine[]> => {
    const response = await api.get<VendorMedicine[]>('/vendor/medicines');
    return response.data;
  },

  createMyMedicine: async (data: VendorMedicineCreate): Promise<VendorMedicine> => {
    const response = await api.post<VendorMedicine>('/vendor/medicines', data);
    return response.data;
  },

  updateMyMedicine: async (id: number, data: VendorMedicineUpdate): Promise<VendorMedicine> => {
    const response = await api.patch<VendorMedicine>(`/vendor/medicines/${id}`, data);
    return response.data;
  },

  toggleMyMedicine: async (id: number, isActive: boolean): Promise<VendorMedicine> => {
    const response = await api.patch<VendorMedicine>(
      `/vendor/medicines/${id}/toggle-status?is_active=${isActive}`,
    );
    return response.data;
  },

  deleteMyMedicine: async (id: number): Promise<void> => {
    await api.delete(`/vendor/medicines/${id}`);
  },

  // ── Clinical workspace ──────────────────────────────────────────────────

  // Vendor: patient list aggregated from their bookings (+ clinical notes)
  getPatients: async (): Promise<VendorPatient[]> => {
    const response = await api.get<VendorPatient[]>('/vendor/patients');
    return response.data;
  },

  getClinicalNotes: async (params?: {
    patient_name?: string;
    source_id?: number;
  }): Promise<ClinicalNote[]> => {
    const response = await api.get<ClinicalNote[]>('/vendor/clinical-notes', { params });
    return response.data;
  },

  createClinicalNote: async (data: ClinicalNoteCreate): Promise<ClinicalNote> => {
    const response = await api.post<ClinicalNote>('/vendor/clinical-notes', data);
    return response.data;
  },

  deleteClinicalNote: async (id: number): Promise<void> => {
    await api.delete(`/vendor/clinical-notes/${id}`);
  },

  getReports: async (params?: { patient_name?: string }): Promise<VendorReport[]> => {
    const response = await api.get<VendorReport[]>('/vendor/reports', { params });
    return response.data;
  },

  createReport: async (data: ReportCreate): Promise<VendorReport> => {
    const response = await api.post<VendorReport>('/vendor/reports', data);
    return response.data;
  },

  deleteReport: async (id: number): Promise<void> => {
    await api.delete(`/vendor/reports/${id}`);
  },

  getBills: async (params?: { patient_name?: string }): Promise<VendorBill[]> => {
    const response = await api.get<VendorBill[]>('/vendor/bills', { params });
    return response.data;
  },

  createBill: async (data: BillCreate): Promise<VendorBill> => {
    const response = await api.post<VendorBill>('/vendor/bills', data);
    return response.data;
  },

  updateBillStatus: async (id: number, status: string): Promise<VendorBill> => {
    const response = await api.patch<VendorBill>(`/vendor/bills/${id}/status`, { status });
    return response.data;
  },

  deleteBill: async (id: number): Promise<void> => {
    await api.delete(`/vendor/bills/${id}`);
  },

  // ── Inpatient admissions ────────────────────────────────────────────────

  getAdmissions: async (status?: string): Promise<Admission[]> => {
    const params = status ? { status } : undefined;
    const response = await api.get<Admission[]>('/vendor/admissions', { params });
    return response.data;
  },

  createAdmission: async (data: AdmissionCreate): Promise<Admission> => {
    const response = await api.post<Admission>('/vendor/admissions', data);
    return response.data;
  },

  updateAdmission: async (
    id: number,
    data: Partial<Omit<AdmissionCreate, 'patient_name'>> & { status?: string; tests?: TestEntry[] },
  ): Promise<Admission> => {
    const response = await api.patch<Admission>(`/vendor/admissions/${id}`, data);
    return response.data;
  },

  addAdmissionTest: async (id: number, test: TestEntry): Promise<Admission> => {
    const response = await api.post<Admission>(`/vendor/admissions/${id}/tests`, test);
    return response.data;
  },

  dischargeAdmission: async (id: number): Promise<Admission> => {
    const response = await api.patch<Admission>(`/vendor/admissions/${id}`, { status: 'discharged' });
    return response.data;
  },

  deleteAdmission: async (id: number): Promise<void> => {
    await api.delete(`/vendor/admissions/${id}`);
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
