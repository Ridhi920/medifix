import { vendorHttp as api } from './vendorApi';

// Point-of-sale workspace for pharmacy vendors. Everything is scoped
// server-side to the logged-in vendor's own store.

export interface PosCustomer {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  total_purchases: number;
  total_spent: number;
  balance_due: number;
  created_at: string;
}

export type PosCustomerInput = Pick<PosCustomer, 'name' | 'phone' | 'email' | 'address'>;

export interface StockBatch {
  id: number;
  medicine_id: number;
  medicine_name: string;
  generic_name: string | null;
  unit: string | null;
  purchase_id: number | null;
  batch_no: string;
  expiry_date: string | null;
  quantity: number;
  purchase_price: number;
  sale_price: number;
  days_to_expiry: number | null;
  expiry_status: 'expired' | 'expiring' | 'ok' | null;
  created_at: string;
}

export interface PurchaseLine {
  medicine_id: number;
  medicine_name: string;
  batch_no: string;
  expiry_date: string | null;
  quantity: number;
  purchase_price: number;
  sale_price: number;
  amount: number;
}

export interface Purchase {
  id: number;
  supplier_name: string;
  invoice_no: string | null;
  purchase_date: string;
  total_amount: number;
  notes: string | null;
  items: PurchaseLine[];
  item_count: number;
}

export interface PurchaseInput {
  supplier_name: string;
  invoice_no?: string | null;
  purchase_date?: string | null;
  notes?: string | null;
  items: {
    medicine_id: number;
    batch_no: string;
    expiry_date?: string | null;
    quantity: number;
    purchase_price: number;
    sale_price?: number | null;
  }[];
}

export interface SaleLine {
  medicine_id: number;
  medicine_name: string;
  unit: string | null;
  quantity: number;
  price: number;
  amount: number;
  batches: string[];
}

export type SaleType = 'cash' | 'credit';

export interface Sale {
  id: number;
  receipt_no: string;
  customer_id: number | null;
  customer_name: string;
  sale_type: SaleType;
  items: SaleLine[];
  item_count: number;
  subtotal: number;
  discount: number;
  total: number;
  paid_amount: number;
  balance_due: number;
  created_at: string;
}

export interface SaleInput {
  customer_id?: number | null;
  sale_type: SaleType;
  discount?: number;
  paid_amount?: number | null;
  items: { medicine_id: number; quantity: number; price?: number }[];
}

export interface PosDashboard {
  store_name: string;
  today_revenue: number;
  today_orders: number;
  month_revenue: number;
  month_orders: number;
  total_medicines: number;
  stock_value: number;
  low_stock_count: number;
  expiring_count: number;
  expired_count: number;
  credit_due: number;
  pending_online_orders: number;
  daily_sales: { date: string; revenue: number; orders: number }[];
  recent_sales: Sale[];
  low_stock: { id: number; name: string; stock: number; min_stock: number; unit: string | null }[];
  expiring_soon: StockBatch[];
}

export interface DateRange {
  start?: string;
  end?: string;
}

const BASE = '/vendor/pharmacy';

// Browser timezone offset so the server's "today" and date filters match the user's day.
const tz = () => new Date().getTimezoneOffset();

export const pharmacyPosAPI = {
  dashboard: async (): Promise<PosDashboard> => (await api.get(`${BASE}/dashboard`, { params: { tz: tz() } })).data,

  getCustomers: async (search?: string): Promise<PosCustomer[]> =>
    (await api.get(`${BASE}/customers`, { params: search ? { search } : undefined })).data,
  createCustomer: async (data: PosCustomerInput): Promise<PosCustomer> => (await api.post(`${BASE}/customers`, data)).data,
  updateCustomer: async (id: number, data: PosCustomerInput): Promise<PosCustomer> =>
    (await api.put(`${BASE}/customers/${id}`, data)).data,
  deleteCustomer: async (id: number): Promise<void> => {
    await api.delete(`${BASE}/customers/${id}`);
  },

  getBatches: async (): Promise<StockBatch[]> => (await api.get(`${BASE}/batches`)).data,
  writeOffBatch: async (id: number): Promise<void> => {
    await api.delete(`${BASE}/batches/${id}`);
  },

  getPurchases: async (range?: DateRange): Promise<Purchase[]> => (await api.get(`${BASE}/purchases`, { params: { ...range, tz: tz() } })).data,
  createPurchase: async (data: PurchaseInput): Promise<Purchase> => (await api.post(`${BASE}/purchases`, { ...data, tz: tz() })).data,

  getSales: async (params?: DateRange & { customer_id?: number }): Promise<Sale[]> =>
    (await api.get(`${BASE}/sales`, { params: { ...params, tz: tz() } })).data,
  createSale: async (data: SaleInput): Promise<Sale> => (await api.post(`${BASE}/sales`, { ...data, tz: tz() })).data,
  recordPayment: async (id: number, amount: number): Promise<Sale> =>
    (await api.post(`${BASE}/sales/${id}/payment`, null, { params: { amount } })).data,
};

/** Pull a readable message out of an axios error. */
export const apiError = (e: any, fallback: string): string => {
  const detail = e?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  return fallback;
};

export default pharmacyPosAPI;
