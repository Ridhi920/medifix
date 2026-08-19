import { useEffect, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Alert,
  Paper,
} from '@mui/material';
import {
  ReceiptLong as BillIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Payment as PaidIcon,
  AddCircleOutline as AddItemIcon,
} from '@mui/icons-material';
import vendorAPI, { type VendorBill, type BillItem } from '../../../api/vendorApi';
import { money, prettyStatus, STATUS_COLORS } from '../vendorUtils';

const emptyItem = (): BillItem => ({ description: '', quantity: 1, price: 0 });

/**
 * Inline billing for a single patient's record (used in both the Outpatient and
 * Inpatient panels). Billing is optional — the doctor may add a bill or not.
 */
export default function PatientBilling({ patientName }: { patientName: string }) {
  const [bills, setBills] = useState<VendorBill[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [items, setItems] = useState<BillItem[]>([emptyItem()]);
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');

  const load = async () => {
    setBills(await vendorAPI.getBills({ patient_name: patientName }));
    setLoaded(true);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientName]);

  const subtotal = items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.price) || 0), 0);
  const total = subtotal + (Number(tax) || 0) - (Number(discount) || 0);

  const openDialog = () => {
    setItems([emptyItem()]);
    setTax(0);
    setDiscount(0);
    setNotes('');
    setError('');
    setOpen(true);
  };

  const updateItem = (idx: number, field: keyof BillItem, value: string) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: field === 'description' ? value : Number(value) } : it)));

  const save = async () => {
    const valid = items.filter((i) => i.description.trim());
    if (valid.length === 0) {
      setError('Add at least one line item.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await vendorAPI.createBill({
        patient_name: patientName,
        items: valid,
        tax: Number(tax) || 0,
        discount: Number(discount) || 0,
        notes: notes || undefined,
      });
      setOpen(false);
      await load();
    } catch {
      setError('Failed to create bill.');
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async (id: number) => {
    await vendorAPI.updateBillStatus(id, 'paid');
    await load();
  };

  const remove = async (id: number) => {
    await vendorAPI.deleteBill(id);
    await load();
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <BillIcon fontSize="small" sx={{ color: '#7c3aed' }} />
        <Typography variant="subtitle2" fontWeight={700} sx={{ flexGrow: 1 }}>
          Billing {loaded && bills.length > 0 ? `(${bills.length})` : ''}
        </Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={openDialog} sx={{ textTransform: 'none' }}>
          Add Bill
        </Button>
      </Stack>

      {!loaded ? null : bills.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No bills for this patient (optional).
        </Typography>
      ) : (
        <Stack spacing={1}>
          {bills.map((b) => (
            <Paper key={b.id} variant="outlined" sx={{ p: 1.5 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2">
                    {b.items.map((it) => `${it.description} ×${it.quantity}`).join(', ') || 'Bill'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {b.notes || `Bill #${b.id}`}
                  </Typography>
                </Box>
                <Typography fontWeight={700}>{money(b.total)}</Typography>
                <Chip size="small" label={prettyStatus(b.status)} color={STATUS_COLORS[b.status] || 'default'} />
                {b.status === 'unpaid' && (
                  <IconButton size="small" color="success" title="Mark paid" onClick={() => markPaid(b.id)}>
                    <PaidIcon fontSize="small" />
                  </IconButton>
                )}
                <IconButton size="small" color="error" title="Delete" onClick={() => remove(b.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Bill — {patientName}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              Line items
            </Typography>
            {items.map((it, idx) => (
              <Stack direction="row" spacing={1} key={idx}>
                <TextField label="Description" value={it.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} sx={{ flexGrow: 1 }} size="small" />
                <TextField label="Qty" type="number" value={it.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} sx={{ width: 80 }} size="small" />
                <TextField label="Price" type="number" value={it.price} onChange={(e) => updateItem(idx, 'price', e.target.value)} sx={{ width: 110 }} size="small" />
                <IconButton size="small" color="error" onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))} disabled={items.length === 1}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
            <Button size="small" startIcon={<AddItemIcon />} onClick={() => setItems((prev) => [...prev, emptyItem()])} sx={{ alignSelf: 'flex-start', textTransform: 'none' }}>
              Add item
            </Button>

            <Divider />
            <Stack direction="row" spacing={2}>
              <TextField label="Tax (₹)" type="number" value={tax} onChange={(e) => setTax(Number(e.target.value))} size="small" />
              <TextField label="Discount (₹)" type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} size="small" />
            </Stack>
            <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} fullWidth multiline minRows={2} />

            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">Subtotal: {money(subtotal)}</Typography>
              <Typography variant="h6" fontWeight={800}>
                Total: {money(total)}
              </Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Create Bill'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
