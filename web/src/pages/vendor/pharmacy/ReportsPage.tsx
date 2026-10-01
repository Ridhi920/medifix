import { ReactNode, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import {
  BarChart as SalesIcon,
  ReceiptLong as PurchaseIcon,
  Inventory2 as ValuationIcon,
  EventBusy as ExpiryIcon,
  FileDownload as ExportIcon,
} from '@mui/icons-material';
import vendorAPI, { VendorMedicine } from '../../../api/vendorApi';
import pharmacyPosAPI, { PosCustomer, Purchase, Sale, StockBatch, apiError } from '../../../api/pharmacyPosApi';
import ReceiptDialog from './ReceiptDialog';
import { ExpiryChip } from './StockPage';
import { EmptyRow, downloadCsv, isoDay, rs, shortDate } from './shared';

function Stat({ label, value, tone = 'primary' }: { label: string; value: ReactNode; tone?: 'primary' | 'plain' | 'error' }) {
  return (
    <Paper elevation={0} sx={{ flex: '1 1 220px', p: 2.5, textAlign: 'center', border: 1, borderColor: 'divider', borderRadius: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <Typography color="text.secondary" sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 28, color: tone === 'primary' ? 'primary.main' : tone === 'error' ? 'error.main' : 'text.primary' }}>{value}</Typography>
    </Paper>
  );
}

function ReportTable({ head, children }: { head: { label: string; align?: 'right' | 'center' }[]; children: ReactNode }) {
  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'auto' }}>
      <Table size="small" sx={{ '& td, & th': { py: 1.25 } }}>
        <TableHead>
          <TableRow>
            {head.map((h) => (
              <TableCell key={h.label} align={h.align}>
                {h.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>{children}</TableBody>
      </Table>
    </Paper>
  );
}

function DateFilters({
  start,
  end,
  setStart,
  setEnd,
  onApply,
  onExport,
  children,
}: {
  start: string;
  end: string;
  setStart: (v: string) => void;
  setEnd: (v: string) => void;
  onApply?: () => void;
  onExport: () => void;
  children?: ReactNode;
}) {
  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 3 }}>
      <TextField size="medium" type="date" label="Start Date" value={start} onChange={(e) => setStart(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 180 }} />
      <TextField size="medium" type="date" label="End Date" value={end} onChange={(e) => setEnd(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 180 }} />
      {children}
      {onApply && (
        <Button variant="outlined" onClick={onApply} sx={{ py: 1 }}>
          Apply
        </Button>
      )}
      <Box sx={{ flex: 1 }} />
      <Button variant="contained" startIcon={<ExportIcon />} onClick={onExport} sx={{ py: 1.1 }}>
        Export CSV
      </Button>
    </Box>
  );
}

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoDay(d);
};

function SalesReport() {
  const [start, setStart] = useState(daysAgo(10));
  const [end, setEnd] = useState(isoDay(new Date()));
  const [customerId, setCustomerId] = useState<number | ''>('');
  const [customers, setCustomers] = useState<PosCustomer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<Sale | null>(null);

  const load = () =>
    pharmacyPosAPI
      .getSales({ start, end, customer_id: customerId === '' ? undefined : customerId })
      .then((s) => {
        setSales(s);
        setError('');
      })
      .catch((e) => setError(apiError(e, 'Failed to load sales')));

  useEffect(() => {
    load();
    pharmacyPosAPI.getCustomers().then(setCustomers).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const revenue = sales.reduce((s, x) => s + x.total, 0);
  const due = sales.reduce((s, x) => s + x.balance_due, 0);

  return (
    <>
      <DateFilters
        start={start}
        end={end}
        setStart={setStart}
        setEnd={setEnd}
        onApply={load}
        onExport={() =>
          downloadCsv(
            `sales_${start}_to_${end}.csv`,
            ['Date', 'Receipt #', 'Customer', 'Type', 'Items', 'Subtotal', 'Discount', 'Total', 'Paid', 'Balance Due'],
            sales.map((s) => [shortDate(s.created_at), s.receipt_no, s.customer_name, s.sale_type, s.item_count, s.subtotal, s.discount, s.total, s.paid_amount, s.balance_due]),
          )
        }
      >
        <TextField select label="Customer" value={customerId} onChange={(e) => setCustomerId(e.target.value === '' ? '' : Number(e.target.value))} sx={{ width: 220 }}>
          <MenuItem value="">All customers</MenuItem>
          {customers.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.name}
            </MenuItem>
          ))}
        </TextField>
      </DateFilters>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 3 }}>
        <Stat label="Total Revenue" value={rs(revenue)} />
        <Stat label="Total Orders" value={sales.length} tone="plain" />
        <Stat label="Credit Outstanding" value={rs(due)} tone={due > 0 ? 'error' : 'plain'} />
      </Box>
      <ReportTable head={[{ label: 'Date' }, { label: 'Receipt #' }, { label: 'Customer' }, { label: 'Items', align: 'center' }, { label: 'Amount', align: 'right' }]}>
        {sales.length === 0 ? (
          <EmptyRow colSpan={5} text="No sales in this period." />
        ) : (
          sales.map((s) => (
            <TableRow key={s.id} hover sx={{ cursor: 'pointer' }} onClick={() => setReceipt(s)}>
              <TableCell>{shortDate(s.created_at)}</TableCell>
              <TableCell>{s.receipt_no}</TableCell>
              <TableCell>{s.customer_name}</TableCell>
              <TableCell align="center">{s.item_count}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>{rs(s.total)}</TableCell>
            </TableRow>
          ))
        )}
      </ReportTable>
      <ReceiptDialog sale={receipt} onClose={() => setReceipt(null)} />
    </>
  );
}

function PurchaseReport() {
  const [start, setStart] = useState(daysAgo(60));
  const [end, setEnd] = useState(isoDay(new Date()));
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [error, setError] = useState('');

  const load = () =>
    pharmacyPosAPI
      .getPurchases({ start, end })
      .then((p) => {
        setPurchases(p);
        setError('');
      })
      .catch((e) => setError(apiError(e, 'Failed to load purchases')));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = purchases.reduce((s, p) => s + p.total_amount, 0);
  const suppliers = new Set(purchases.map((p) => p.supplier_name)).size;

  return (
    <>
      <DateFilters
        start={start}
        end={end}
        setStart={setStart}
        setEnd={setEnd}
        onApply={load}
        onExport={() =>
          downloadCsv(
            `purchases_${start}_to_${end}.csv`,
            ['Date', 'Purchase #', 'Supplier', 'Invoice No', 'Items', 'Total'],
            purchases.map((p) => [shortDate(p.purchase_date), p.id, p.supplier_name, p.invoice_no, p.item_count, p.total_amount]),
          )
        }
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 3 }}>
        <Stat label="Total Purchases" value={rs(total)} />
        <Stat label="Invoices" value={purchases.length} tone="plain" />
        <Stat label="Suppliers" value={suppliers} tone="plain" />
      </Box>
      <ReportTable head={[{ label: 'Date' }, { label: 'ID' }, { label: 'Supplier' }, { label: 'Invoice No' }, { label: 'Items', align: 'center' }, { label: 'Amount', align: 'right' }]}>
        {purchases.length === 0 ? (
          <EmptyRow colSpan={6} text="No purchases in this period." />
        ) : (
          purchases.map((p) => (
            <TableRow key={p.id} hover>
              <TableCell>{shortDate(p.purchase_date)}</TableCell>
              <TableCell>#{p.id}</TableCell>
              <TableCell>{p.supplier_name}</TableCell>
              <TableCell>{p.invoice_no || '—'}</TableCell>
              <TableCell align="center">{p.item_count}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>{rs(p.total_amount)}</TableCell>
            </TableRow>
          ))
        )}
      </ReportTable>
    </>
  );
}

function useStockData() {
  const [medicines, setMedicines] = useState<VendorMedicine[]>([]);
  const [batches, setBatches] = useState<StockBatch[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    Promise.all([vendorAPI.getMyMedicines(), pharmacyPosAPI.getBatches()])
      .then(([m, b]) => {
        setMedicines(m);
        setBatches(b);
      })
      .catch((e) => setError(apiError(e, 'Failed to load stock')));
  }, []);
  return { medicines, batches, error };
}

function StockValuation() {
  const { medicines, batches, error } = useStockData();
  const rows = useMemo(
    () =>
      medicines
        .map((m) => {
          const mb = batches.filter((b) => b.medicine_id === m.id);
          const batchQty = mb.reduce((s, b) => s + b.quantity, 0);
          const batchCost = mb.reduce((s, b) => s + b.quantity * b.purchase_price, 0);
          // Units with no batch (opening stock) are valued at the average batch cost when known.
          const avgCost = batchQty ? batchCost / batchQty : 0;
          return { m, cost: avgCost * m.stock, mrp: m.price * m.stock };
        })
        .sort((a, b) => b.mrp - a.mrp),
    [medicines, batches],
  );
  const totalMrp = rows.reduce((s, r) => s + r.mrp, 0);
  const totalCost = rows.reduce((s, r) => s + r.cost, 0);
  const units = medicines.reduce((s, m) => s + m.stock, 0);

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<ExportIcon />}
          onClick={() =>
            downloadCsv(
              `stock_valuation_${isoDay(new Date())}.csv`,
              ['Medicine', 'Generic', 'Unit', 'Stock', 'MRP', 'Value at MRP', 'Value at Cost'],
              rows.map((r) => [r.m.name, r.m.generic_name, r.m.dosage_form, r.m.stock, r.m.price, r.mrp.toFixed(2), r.cost.toFixed(2)]),
            )
          }
        >
          Export CSV
        </Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 3 }}>
        <Stat label="Value at MRP" value={rs(totalMrp)} />
        <Stat label="Value at Cost" value={rs(totalCost)} tone="plain" />
        <Stat label="Units in Stock" value={units.toLocaleString('en-IN')} tone="plain" />
      </Box>
      <ReportTable head={[{ label: 'Medicine' }, { label: 'Unit' }, { label: 'Stock', align: 'right' }, { label: 'MRP', align: 'right' }, { label: 'Value at Cost', align: 'right' }, { label: 'Value at MRP', align: 'right' }]}>
        {rows.length === 0 ? (
          <EmptyRow colSpan={6} text="No medicines." />
        ) : (
          rows.map((r) => (
            <TableRow key={r.m.id} hover>
              <TableCell>{r.m.name}</TableCell>
              <TableCell>{r.m.dosage_form || '—'}</TableCell>
              <TableCell align="right">{r.m.stock}</TableCell>
              <TableCell align="right">{rs(r.m.price)}</TableCell>
              <TableCell align="right">{r.cost ? rs(r.cost) : '—'}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>{rs(r.mrp)}</TableCell>
            </TableRow>
          ))
        )}
      </ReportTable>
    </>
  );
}

function ExpiryAnalysis() {
  const { batches, error } = useStockData();
  const [withinDays, setWithinDays] = useState(90);
  const rows = batches
    .filter((b) => b.days_to_expiry !== null && b.days_to_expiry <= withinDays)
    .sort((a, b) => (a.days_to_expiry ?? 0) - (b.days_to_expiry ?? 0));
  const expired = rows.filter((b) => b.expiry_status === 'expired');
  const atRisk = rows.reduce((s, b) => s + b.quantity * b.sale_price, 0);

  return (
    <>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 3 }}>
        <TextField select label="Expiring within" value={withinDays} onChange={(e) => setWithinDays(Number(e.target.value))} sx={{ width: 200 }}>
          {[30, 60, 90, 180].map((d) => (
            <MenuItem key={d} value={d}>
              {d} days
            </MenuItem>
          ))}
        </TextField>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          startIcon={<ExportIcon />}
          onClick={() =>
            downloadCsv(
              `expiry_${withinDays}d_${isoDay(new Date())}.csv`,
              ['Medicine', 'Batch No', 'Expiry Date', 'Days Left', 'Qty', 'MRP', 'Value at MRP'],
              rows.map((b) => [b.medicine_name, b.batch_no, b.expiry_date?.slice(0, 10), b.days_to_expiry, b.quantity, b.sale_price, (b.quantity * b.sale_price).toFixed(2)]),
            )
          }
        >
          Export CSV
        </Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 3 }}>
        <Stat label="Already Expired" value={expired.length} tone={expired.length ? 'error' : 'plain'} />
        <Stat label={`Expiring in ${withinDays} days`} value={rows.length - expired.length} tone="plain" />
        <Stat label="Stock Value at Risk" value={rs(atRisk)} />
      </Box>
      <ReportTable head={[{ label: 'Medicine' }, { label: 'Batch No' }, { label: 'Expiry Date' }, { label: 'Status' }, { label: 'Qty', align: 'right' }, { label: 'Value at MRP', align: 'right' }]}>
        {rows.length === 0 ? (
          <EmptyRow colSpan={6} text={`Nothing expires within ${withinDays} days.`} />
        ) : (
          rows.map((b) => (
            <TableRow key={b.id} hover>
              <TableCell>{b.medicine_name}</TableCell>
              <TableCell sx={{ fontFamily: 'monospace' }}>{b.batch_no}</TableCell>
              <TableCell>{shortDate(b.expiry_date)}</TableCell>
              <TableCell><ExpiryChip batch={b} /></TableCell>
              <TableCell align="right">{b.quantity}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>{rs(b.quantity * b.sale_price)}</TableCell>
            </TableRow>
          ))
        )}
      </ReportTable>
    </>
  );
}

const TABS = [
  { label: 'Sales Report', icon: <SalesIcon />, render: () => <SalesReport /> },
  { label: 'Purchase Report', icon: <PurchaseIcon />, render: () => <PurchaseReport /> },
  { label: 'Stock Valuation', icon: <ValuationIcon />, render: () => <StockValuation /> },
  { label: 'Expiry Analysis', icon: <ExpiryIcon />, render: () => <ExpiryAnalysis /> },
];

export default function ReportsPage() {
  const [tab, setTab] = useState(0);
  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 400, fontSize: { xs: 22, md: 26 }, pb: 2, mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        Business Reports
      </Typography>
      <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, mb: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ px: 1, '& .MuiTab-root': { minHeight: 72, fontSize: 15 } }}>
          {TABS.map((t) => (
            <Tab key={t.label} icon={t.icon} iconPosition="start" label={t.label} />
          ))}
        </Tabs>
      </Paper>
      <Box sx={{ px: { md: 3 } }}>{TABS[tab].render()}</Box>
    </Box>
  );
}
