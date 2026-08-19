import { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Payment as PaidIcon,
  AddCircleOutline as AddItemIcon,
} from '@mui/icons-material';
import vendorAPI, { type VendorBill, type BillItem } from '../../../api/vendorApi';
import { formatDateTime, money, prettyStatus, STATUS_COLORS } from '../vendorUtils';

const emptyItem = (): BillItem => ({ description: '', quantity: 1, price: 0 });

export default function BillingTab() {
  const [bills, setBills] = useState<VendorBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [patientName, setPatientName] = useState('');
  const [items, setItems] = useState<BillItem[]>([emptyItem()]);
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setBills(await vendorAPI.getBills());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openDialog = () => {
    setPatientName('');
    setItems([emptyItem()]);
    setTax(0);
    setDiscount(0);
    setNotes('');
    setError('');
    setOpen(true);
  };

  const subtotal = items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.price) || 0), 0);
  const total = subtotal + (Number(tax) || 0) - (Number(discount) || 0);

  const updateItem = (idx: number, field: keyof BillItem, value: string) => {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, [field]: field === 'description' ? value : Number(value) } : it)),
    );
  };

  const save = async () => {
    const valid = items.filter((i) => i.description.trim());
    if (!patientName || valid.length === 0) {
      setError('Patient name and at least one line item are required.');
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const outstanding = bills.filter((b) => b.status === 'unpaid').reduce((s, b) => s + b.total, 0);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {bills.length} bill{bills.length !== 1 ? 's' : ''} · Outstanding: <strong>{money(outstanding)}</strong>
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openDialog} sx={{ textTransform: 'none' }}>
          New Bill
        </Button>
      </Stack>

      {bills.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          No bills yet. Raise an itemized invoice for a patient.
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: '#f8fafc' } }}>
                <TableCell>#</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Items</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bills.map((b) => (
                <TableRow key={b.id} hover>
                  <TableCell>{b.id}</TableCell>
                  <TableCell>{b.patient_name}</TableCell>
                  <TableCell>
                    {b.items.map((it) => `${it.description} ×${it.quantity}`).join(', ')}
                  </TableCell>
                  <TableCell align="right">{money(b.total)}</TableCell>
                  <TableCell>
                    <Chip size="small" label={prettyStatus(b.status)} color={STATUS_COLORS[b.status] || 'default'} />
                  </TableCell>
                  <TableCell>{formatDateTime(b.created_at)}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      {b.status === 'unpaid' && (
                        <IconButton size="small" color="success" title="Mark paid" onClick={() => markPaid(b.id)}>
                          <PaidIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton size="small" color="error" title="Delete" onClick={() => remove(b.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Bill</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Patient name" value={patientName} onChange={(e) => setPatientName(e.target.value)} fullWidth />

            <Typography variant="subtitle2" fontWeight={700}>
              Line items
            </Typography>
            {items.map((it, idx) => (
              <Stack direction="row" spacing={1} key={idx}>
                <TextField
                  label="Description"
                  value={it.description}
                  onChange={(e) => updateItem(idx, 'description', e.target.value)}
                  sx={{ flexGrow: 1 }}
                  size="small"
                />
                <TextField
                  label="Qty"
                  type="number"
                  value={it.quantity}
                  onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                  sx={{ width: 80 }}
                  size="small"
                />
                <TextField
                  label="Price"
                  type="number"
                  value={it.price}
                  onChange={(e) => updateItem(idx, 'price', e.target.value)}
                  sx={{ width: 110 }}
                  size="small"
                />
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                  disabled={items.length === 1}
                >
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
