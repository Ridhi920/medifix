// Shared helpers for the vendor workspace tabs.

export const STATUS_COLORS: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  pending: 'warning',
  confirmed: 'info',
  scheduled: 'info',
  in_progress: 'info',
  sample_collected: 'info',
  dispatched: 'info',
  preparing: 'info',
  out_for_delivery: 'info',
  completed: 'success',
  delivered: 'success',
  paid: 'success',
  cancelled: 'error',
  rejected: 'error',
  unpaid: 'warning',
};

export const prettyStatus = (s: string): string =>
  s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const money = (v: number | null | undefined): string =>
  v === null || v === undefined ? '—' : `₹${Number(v).toLocaleString('en-IN')}`;

export const formatDateTime = (iso: string | null | undefined): string =>
  !iso ? '—' : new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const formatDate = (iso: string | null | undefined): string =>
  !iso ? '—' : new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

// Read a File into a base64 data-URL (matches the app's prescription_image convention).
export const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// Roles that run appointment-style bookings (accept/reject makes sense).
export const CLINICAL_ROLES = ['doctor', 'dentist', 'physiotherapist', 'nurse', 'lab'];

// Map an "accept"/"reject" action to a concrete status for this role.
export const acceptStatus = (): string => 'confirmed';
export const rejectStatus = (role: string): string =>
  role === 'doctor' || role === 'dentist' ? 'rejected' : 'cancelled';
