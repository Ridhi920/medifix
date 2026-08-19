import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Inventory2 as InventoryIcon,
} from '@mui/icons-material';
import vendorAPI, { VendorMedicine, VendorMedicineCreate } from '../../../api/vendorApi';
import { money } from '../vendorUtils';

const CATEGORIES = [
  'Pain Relief',
  'Antibiotics',
  'Vitamins',
  'Cough & Cold',
  'Acidity',
  'Allergy',
  'Diabetes',
  'Blood Pressure',
  'First Aid',
];

const DOSAGE_FORMS = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Inhaler'];

// Below this, a medicine is flagged so the pharmacy can restock in time.
const LOW_STOCK_THRESHOLD = 10;

const EMPTY: VendorMedicineCreate = {
  name: '',
  generic_name: '',
  manufacturer: '',
  category: '',
  price: 0,
  stock: 0,
  requires_prescription: false,
  description: '',
  dosage_form: 'Tablet',
  strength: '',
};

function Tile({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <Paper variant="outlined" sx={{ px: 3, py: 2, minWidth: 150, flex: '1 1 150px', borderTop: `3px solid ${color}` }}>
      <Typography variant="h4" fontWeight={800} sx={{ color }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Paper>
  );
}

/**
 * The pharmacy vendor's own shelf. Everything here is scoped server-side to
 * the store linked to this account — a vendor can only stock their own store,
 * and only listed (active) medicines with stock appear in the mobile app.
 */
export default function InventoryTab({ storeName }: { storeName?: string | null }) {
  const [medicines, setMedicines] = useState<VendorMedicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<VendorMedicine | null>(null);
  const [form, setForm] = useState<VendorMedicineCreate>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setMedicines(await vendorAPI.getMyMedicines());
      setError('');
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to load your inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const listed = medicines.filter((m) => m.is_active);
    return {
      total: medicines.length,
      listed: listed.length,
      lowStock: medicines.filter((m) => m.stock > 0 && m.stock < LOW_STOCK_THRESHOLD).length,
      outOfStock: medicines.filter((m) => m.stock <= 0).length,
      value: medicines.reduce((sum, m) => sum + m.price * m.stock, 0),
    };
  }, [medicines]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return medicines;
    return medicines.filter((m) =>
      [m.name, m.generic_name, m.manufacturer, m.category].join(' ').toLowerCase().includes(q),
    );
  }, [medicines, search]);

  const openFor = (medicine?: VendorMedicine) => {
    if (medicine) {
      setEditing(medicine);
      setForm({
        name: medicine.name,
        generic_name: medicine.generic_name,
        manufacturer: medicine.manufacturer,
        category: medicine.category,
        price: medicine.price,
        stock: medicine.stock,
        requires_prescription: medicine.requires_prescription,
        description: medicine.description ?? '',
        dosage_form: medicine.dosage_form ?? 'Tablet',
        strength: medicine.strength ?? '',
      });
    } else {
      setEditing(null);
      setForm(EMPTY);
    }
    setOpenDialog(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.generic_name.trim() || !form.manufacturer.trim() || !form.category.trim()) {
      setError('Name, generic name, manufacturer and category are all required.');
      return;
    }
    if (!form.price || form.price <= 0) {
      setError('Price must be greater than zero.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await vendorAPI.updateMyMedicine(editing.id, form);
        setToast(`${form.name} updated`);
      } else {
        await vendorAPI.createMyMedicine(form);
        setToast(`${form.name} added to your shelf`);
      }
      setOpenDialog(false);
      load();
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to save the medicine.');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (medicine: VendorMedicine) => {
    try {
      const updated = await vendorAPI.toggleMyMedicine(medicine.id, !medicine.is_active);
      setMedicines((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setToast(updated.is_active ? `${updated.name} is live in the app` : `${updated.name} delisted`);
    } catch {
      setError('Failed to update the listing.');
    }
  };

  const remove = async (medicine: VendorMedicine) => {
    if (!window.confirm(`Remove "${medicine.name}" from your shelf? This cannot be undone.`)) return;
    try {
      await vendorAPI.deleteMyMedicine(medicine.id);
      setMedicines((prev) => prev.filter((m) => m.id !== medicine.id));
      setToast(`${medicine.name} removed`);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to remove the medicine.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Tile label="Products" value={stats.total} color="#2563eb" />
        <Tile label="Live in App" value={stats.listed} color="#16a34a" />
        <Tile label="Low Stock" value={stats.lowStock} color="#ea580c" />
        <Tile label="Out of Stock" value={stats.outOfStock} color="#dc2626" />
        <Tile label="Stock Value" value={money(stats.value)} color="#7c3aed" />
      </Stack>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 2, alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Typography variant="h6" fontWeight={700}>
            My Shelf
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Only listed medicines appear to customers browsing
            {storeName ? ` ${storeName}` : ' your store'} in the app.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <TextField
            size="small"
            placeholder="Search your shelf…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 220 }}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => openFor()} sx={{ textTransform: 'none' }}>
            Add Medicine
          </Button>
        </Stack>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Medicine</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Form</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">Stock</TableCell>
              <TableCell>Rx</TableCell>
              <TableCell>Listed</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.map((m) => (
              <TableRow key={m.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {m.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {m.generic_name} · {m.manufacturer}
                    {m.strength ? ` · ${m.strength}` : ''}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={m.category} size="small" variant="outlined" />
                </TableCell>
                <TableCell>{m.dosage_form || '—'}</TableCell>
                <TableCell align="right">{money(m.price)}</TableCell>
                <TableCell align="right">
                  <Chip
                    label={m.stock}
                    size="small"
                    color={m.stock <= 0 ? 'error' : m.stock < LOW_STOCK_THRESHOLD ? 'warning' : 'success'}
                  />
                </TableCell>
                <TableCell>
                  {m.requires_prescription ? (
                    <Chip label="Rx" size="small" color="warning" />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      —
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Tooltip title={m.is_active ? 'Visible to customers' : 'Hidden from customers'}>
                    <Switch checked={m.is_active} onChange={() => toggle(m)} size="small" />
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="primary" onClick={() => openFor(m)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => remove(m)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>
                  <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                    <InventoryIcon sx={{ fontSize: 44, opacity: 0.4, mb: 1 }} />
                    <Typography variant="body2">
                      {search
                        ? 'Nothing on your shelf matches that search.'
                        : 'Your shelf is empty. Add your first medicine so customers can order it.'}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? `Edit ${editing.name}` : 'Add Medicine to Your Shelf'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Medicine Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
              required
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Generic Name"
                value={form.generic_name}
                onChange={(e) => setForm({ ...form, generic_name: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Manufacturer"
                value={form.manufacturer}
                onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                fullWidth
                required
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                label="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                fullWidth
                required
              >
                {CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Dosage Form"
                value={form.dosage_form ?? 'Tablet'}
                onChange={(e) => setForm({ ...form, dosage_form: e.target.value })}
                fullWidth
              >
                {DOSAGE_FORMS.map((d) => (
                  <MenuItem key={d} value={d}>
                    {d}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Price (₹)"
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                inputProps={{ min: 1 }}
                fullWidth
                required
              />
              <TextField
                label="Stock"
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                inputProps={{ min: 0 }}
                helperText="Customers can't order more than this"
                fullWidth
              />
              <TextField
                label="Strength"
                placeholder="e.g. 500mg"
                value={form.strength ?? ''}
                onChange={(e) => setForm({ ...form, strength: e.target.value })}
                fullWidth
              />
            </Stack>
            <TextField
              label="Description"
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={!!form.requires_prescription}
                  onChange={(e) => setForm({ ...form, requires_prescription: e.target.checked })}
                />
              }
              label="Prescription required"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button onClick={save} variant="contained" disabled={saving} sx={{ textTransform: 'none' }}>
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add to Shelf'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast('')}
        message={toast}
      />
    </Box>
  );
}
