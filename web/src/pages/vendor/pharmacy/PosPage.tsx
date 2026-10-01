import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
  Snackbar,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  AddShoppingCart as AddCartIcon,
  Close as CloseIcon,
  History as HistoryIcon,
  Remove as RemoveIcon,
  Search as SearchIcon,
  Send as SendIcon,
  ShoppingCart as CartIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import vendorAPI, { VendorMedicine } from '../../../api/vendorApi';
import pharmacyPosAPI, { PosCustomer, Sale, SaleType, apiError } from '../../../api/pharmacyPosApi';
import ReceiptDialog from './ReceiptDialog';
import { EmptyRow, PageHeader, TableCard, dateTime, isoDay, rs } from './shared';

type CartLine = { medicine: VendorMedicine; quantity: number };

function CheckoutDialog({
  open,
  total,
  saleType,
  customer,
  onClose,
  onConfirm,
  busy,
}: {
  open: boolean;
  total: number;
  saleType: SaleType;
  customer: PosCustomer | null;
  onClose: () => void;
  onConfirm: (paid: number) => void;
  busy: boolean;
}) {
  const [paid, setPaid] = useState('');
  useEffect(() => {
    if (open) setPaid(saleType === 'cash' ? String(total) : '0');
  }, [open, total, saleType]);
  const paidNum = Number(paid) || 0;
  const cashShort = saleType === 'cash' && paidNum < total;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Checkout</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography color="text.secondary">Customer</Typography>
          <Typography fontWeight={600}>{customer?.name ?? 'Walk-in'}</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography color="text.secondary">Amount due</Typography>
          <Typography fontWeight={700} fontSize={20} color="primary.main">
            {rs(total)}
          </Typography>
        </Box>
        <TextField
          fullWidth
          autoFocus
          type="number"
          label={saleType === 'cash' ? 'Cash received' : 'Paid now (rest goes on credit)'}
          value={paid}
          onChange={(e) => setPaid(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
        />
        {saleType === 'cash' && paidNum > total && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Change to return: <b>{rs(paidNum - total)}</b>
          </Alert>
        )}
        {cashShort && <Alert severity="warning" sx={{ mt: 2 }}>Cash received is less than the total. Use a credit sale for partial payment.</Alert>}
        {saleType === 'credit' && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {rs(Math.max(0, total - paidNum))} will be added to {customer?.name}'s balance.
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={busy || cashShort} onClick={() => onConfirm(Math.min(paidNum, total))}>
          {busy ? 'Processing…' : 'Complete Sale'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function SalesHistory({ onOpen, refreshKey }: { onOpen: (s: Sale) => void; refreshKey: number }) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [day, setDay] = useState(isoDay(new Date()));
  const [error, setError] = useState('');

  useEffect(() => {
    pharmacyPosAPI
      .getSales({ start: day, end: day })
      .then((s) => {
        setSales(s);
        setError('');
      })
      .catch((e) => setError(apiError(e, 'Failed to load sales')));
  }, [day, refreshKey]);

  const total = sales.reduce((s, x) => s + x.total, 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
        <TextField size="small" type="date" label="Date" value={day} onChange={(e) => setDay(e.target.value)} InputLabelProps={{ shrink: true }} />
        <Typography color="text.secondary">
          {sales.length} sale(s) · <b>{rs(total)}</b>
        </Typography>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TableCard>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Receipt #</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {sales.length === 0 ? (
              <EmptyRow colSpan={6} text="No sales on this day." />
            ) : (
              sales.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell>{dateTime(s.created_at)}</TableCell>
                  <TableCell>{s.receipt_no}</TableCell>
                  <TableCell>{s.customer_name}</TableCell>
                  <TableCell>
                    <Chip size="small" label={s.sale_type.toUpperCase()} color={s.sale_type === 'credit' ? 'warning' : 'default'} variant="outlined" />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{rs(s.total)}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => onOpen(s)} aria-label="View receipt">
                      <ReceiptIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableCard>
    </Box>
  );
}

export default function PosPage() {
  const [tab, setTab] = useState(0);
  const [medicines, setMedicines] = useState<VendorMedicine[]>([]);
  const [customers, setCustomers] = useState<PosCustomer[]>([]);
  const [customer, setCustomer] = useState<PosCustomer | null>(null);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [saleType, setSaleType] = useState<SaleType>('cash');
  const [discount, setDiscount] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<Sale | null>(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [historyKey, setHistoryKey] = useState(0);

  const loadStock = () =>
    vendorAPI
      .getMyMedicines()
      .then((m) => setMedicines(m.filter((x) => x.is_active || x.stock > 0)))
      .catch((e) => setError(apiError(e, 'Failed to load medicines')));

  useEffect(() => {
    loadStock();
    pharmacyPosAPI.getCustomers().then(setCustomers).catch(() => undefined);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? medicines.filter((m) => [m.name, m.generic_name, m.barcode ?? ''].some((v) => v.toLowerCase().includes(q)))
      : medicines;
    return list.slice(0, 60);
  }, [medicines, search]);

  const inCart = (id: number) => cart.find((l) => l.medicine.id === id)?.quantity ?? 0;

  const addToCart = (m: VendorMedicine, qty = 1) => {
    const current = inCart(m.id);
    if (current + qty > m.stock) {
      setToast(`Only ${m.stock} unit(s) of ${m.name} in stock`);
      return;
    }
    setCart((c) =>
      current ? c.map((l) => (l.medicine.id === m.id ? { ...l, quantity: l.quantity + qty } : l)) : [...c, { medicine: m, quantity: qty }],
    );
  };

  const changeQty = (id: number, delta: number) =>
    setCart((c) =>
      c
        .map((l) => (l.medicine.id === id ? { ...l, quantity: Math.min(l.medicine.stock, l.quantity + delta) } : l))
        .filter((l) => l.quantity > 0),
    );

  // A scanner types the barcode and presses Enter: add the exact match.
  const onSearchKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    const code = search.trim();
    const hit = medicines.find((m) => m.barcode === code) ?? (filtered.length === 1 ? filtered[0] : undefined);
    if (hit) {
      addToCart(hit);
      setSearch('');
    }
  };

  const subtotal = cart.reduce((s, l) => s + l.medicine.price * l.quantity, 0);
  const discountNum = Math.min(Math.max(0, Number(discount) || 0), subtotal);
  const total = subtotal - discountNum;

  const startCheckout = () => {
    if (saleType === 'credit' && !customer) {
      setError('Select a customer for a credit sale.');
      return;
    }
    setError('');
    setCheckoutOpen(true);
  };

  const completeSale = async (paid: number) => {
    setBusy(true);
    try {
      const sale = await pharmacyPosAPI.createSale({
        customer_id: customer?.id ?? null,
        sale_type: saleType,
        discount: discountNum,
        paid_amount: paid,
        items: cart.map((l) => ({ medicine_id: l.medicine.id, quantity: l.quantity })),
      });
      setCheckoutOpen(false);
      setCart([]);
      setDiscount('');
      setReceipt(sale);
      setHistoryKey((k) => k + 1);
      loadStock();
      if (customer) pharmacyPosAPI.getCustomers().then(setCustomers).catch(() => undefined);
    } catch (e) {
      setError(apiError(e, 'Failed to complete sale'));
      setCheckoutOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box>
      <PageHeader title="Sales POS" />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.5fr) minmax(340px, 1fr)' }, gap: 3, alignItems: 'start' }}>
        <Box>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab icon={<CartIcon />} iconPosition="start" label="New Sale" />
            <Tab icon={<HistoryIcon />} iconPosition="start" label="Sales History" />
          </Tabs>
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
          {tab === 0 ? (
            <>
              <Autocomplete
                options={customers}
                value={customer}
                onChange={(_, c) => {
                  setCustomer(c);
                  if (!c) setSaleType('cash');
                }}
                getOptionLabel={(c) => `${c.name}${c.phone ? ` · ${c.phone}` : ''}`}
                renderInput={(p) => <TextField {...p} label="Select Customer" placeholder="Walk-in customer" />}
                sx={{ mb: 2, bgcolor: 'background.paper' }}
              />
              <TextField
                fullWidth
                placeholder="Search medicine by name, generic or scan barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={onSearchKey}
                sx={{ mb: 2, bgcolor: 'background.paper' }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
              />
              <TableCard>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Medicine Name</TableCell>
                      <TableCell align="right">Stock</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Add</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <EmptyRow colSpan={4} text="No medicines found." />
                    ) : (
                      filtered.map((m) => {
                        const left = m.stock - inCart(m.id);
                        return (
                          <TableRow key={m.id} hover sx={{ cursor: left > 0 ? 'pointer' : 'default' }} onClick={() => left > 0 && addToCart(m)}>
                            <TableCell>
                              <Typography fontWeight={700}>{m.name}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {m.dosage_form || '—'}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                size="small"
                                label={left}
                                color={left <= 0 ? 'error' : left <= m.min_stock ? 'warning' : 'default'}
                                variant={left <= m.min_stock ? 'filled' : 'outlined'}
                              />
                            </TableCell>
                            <TableCell align="right">{rs(m.price)}</TableCell>
                            <TableCell align="right">
                              <IconButton color="primary" disabled={left <= 0} aria-label={`Add ${m.name}`}>
                                <AddCartIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableCard>
            </>
          ) : (
            <SalesHistory onOpen={setReceipt} refreshKey={historyKey} />
          )}
        </Box>

        {/* Cart */}
        <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden', position: { lg: 'sticky' }, top: 0 }}>
          <Box sx={{ bgcolor: 'primary.main', color: '#fff', px: 2.5, py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CartIcon />
            <Typography fontSize={18} fontWeight={500}>
              Cart Items ({cart.length})
            </Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Sale Type
            </Typography>
            <ToggleButtonGroup
              exclusive
              fullWidth
              value={saleType}
              onChange={(_, v) => v && setSaleType(v)}
              sx={{ mb: 2, '& .Mui-selected': { bgcolor: 'rgba(0,105,92,0.12) !important', color: 'primary.main' } }}
            >
              <ToggleButton value="cash">Cash Sale</ToggleButton>
              <ToggleButton value="credit" disabled={!customer}>
                Credit Sale
              </ToggleButton>
            </ToggleButtonGroup>
            <Box sx={{ maxHeight: 320, overflow: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell align="center">Qty</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cart.length === 0 ? (
                    <EmptyRow colSpan={5} text="Your cart is empty" />
                  ) : (
                    cart.map((l) => (
                      <TableRow key={l.medicine.id}>
                        <TableCell sx={{ maxWidth: 140 }}>{l.medicine.name}</TableCell>
                        <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                          <IconButton size="small" onClick={() => changeQty(l.medicine.id, -1)} aria-label="Decrease">
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          {l.quantity}
                          <IconButton size="small" onClick={() => changeQty(l.medicine.id, 1)} disabled={l.quantity >= l.medicine.stock} aria-label="Increase">
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                        <TableCell align="right">{rs(l.medicine.price)}</TableCell>
                        <TableCell align="right">{rs(l.medicine.price * l.quantity)}</TableCell>
                        <TableCell align="right" sx={{ pl: 0 }}>
                          <IconButton size="small" color="error" onClick={() => changeQty(l.medicine.id, -l.quantity)} aria-label="Remove">
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
            <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 1.25, alignItems: 'center' }}>
              <Typography>Subtotal</Typography>
              <Typography align="right">{rs(subtotal)}</Typography>
              <Typography>Discount</Typography>
              <TextField
                size="small"
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="0"
                sx={{ width: 120, '& input': { textAlign: 'right', color: 'error.main' } }}
                InputProps={{ startAdornment: <InputAdornment position="start">-₹</InputAdornment> }}
              />
              <Typography fontSize={18} fontWeight={600}>
                Total
              </Typography>
              <Typography fontSize={18} fontWeight={700} color="primary.main" align="right">
                {rs(total)}
              </Typography>
            </Box>
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<SendIcon />}
              disabled={cart.length === 0}
              onClick={startCheckout}
              sx={{ mt: 3, py: 1.4 }}
            >
              Proceed to Checkout
            </Button>
          </Box>
        </Paper>
      </Box>

      <CheckoutDialog
        open={checkoutOpen}
        total={total}
        saleType={saleType}
        customer={customer}
        busy={busy}
        onClose={() => setCheckoutOpen(false)}
        onConfirm={completeSale}
      />
      <ReceiptDialog sale={receipt} onClose={() => setReceipt(null)} />
      <Snackbar open={!!toast} autoHideDuration={2500} onClose={() => setToast('')} message={toast} />
    </Box>
  );
}
