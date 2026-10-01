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
  InputAdornment,
  MenuItem,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
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
  Search as SearchIcon,
  QrCode2 as BarcodeIcon,
} from '@mui/icons-material';
import vendorAPI, { VendorMedicine, VendorMedicineCreate } from '../../../api/vendorApi';
import { apiError } from '../../../api/pharmacyPosApi';
import SelectWithOther from '../../../components/SelectWithOther';
import { ConfirmDialog, EmptyRow, TableCard, rs } from './shared';

const CATEGORIES = ['Pain Relief', 'Antibiotics', 'Vitamins', 'Cough & Cold', 'Acidity', 'Allergy', 'Diabetes', 'Blood Pressure', 'First Aid', 'Others'];
const UNITS = ['Tablet', 'Capsule', 'Strip', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Inhaler', 'Powder'];

type Form = VendorMedicineCreate & { is_active: boolean };

const EMPTY: Form = {
  name: '',
  generic_name: '',
  manufacturer: '',
  category: '',
  price: 0,
  stock: 0,
  requires_prescription: false,
  dosage_form: 'Tablet',
  strength: '',
  barcode: '',
  min_stock: 10,
  description: '',
  is_active: true,
};

function MedicineDialog({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean;
  editing: VendorMedicine | null;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [form, setForm] = useState<Form>(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(
      editing
        ? {
            name: editing.name,
            generic_name: editing.generic_name,
            manufacturer: editing.manufacturer,
            category: editing.category,
            price: editing.price,
            requires_prescription: editing.requires_prescription,
            dosage_form: editing.dosage_form ?? 'Tablet',
            strength: editing.strength ?? '',
            barcode: editing.barcode ?? '',
            min_stock: editing.min_stock,
            description: editing.description ?? '',
            is_active: editing.is_active,
          }
        : EMPTY,
    );
  }, [open, editing]);

  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    if (!form.name.trim() || !form.generic_name.trim()) return setError('Name and generic name are required');
    if (!form.category.trim()) return setError('Category is required');
    if (!(Number(form.price) > 0)) return setError('MRP must be greater than 0');
    const payload = {
      ...form,
      manufacturer: form.manufacturer.trim() || '-',
      price: Math.round(Number(form.price)),
      min_stock: Number(form.min_stock) || 0,
      barcode: form.barcode?.trim() || null,
    };
    setSaving(true);
    try {
      if (editing) {
        // Stock moves only through purchases/sales; listing has its own endpoint.
        const { stock: _stock, is_active, ...update } = payload;
        await vendorAPI.updateMyMedicine(editing.id, update);
        if (is_active !== editing.is_active) await vendorAPI.toggleMyMedicine(editing.id, is_active);
        onSaved('Medicine updated');
      } else {
        const { is_active, ...create } = payload;
        const created = await vendorAPI.createMyMedicine({ ...create, stock: Number(form.stock) || 0 });
        if (!is_active) await vendorAPI.toggleMyMedicine(created.id, false);
        onSaved('Medicine added');
      }
      onClose();
    } catch (e) {
      setError(apiError(e, 'Failed to save medicine'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editing ? 'Edit Medicine' : 'Add Medicine'}</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack spacing={2}>
          <TextField label="Medicine Name *" value={form.name} onChange={(e) => set({ name: e.target.value })} />
          <TextField label="Generic Name *" value={form.generic_name} onChange={(e) => set({ generic_name: e.target.value })} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField fullWidth label="Barcode" value={form.barcode ?? ''} onChange={(e) => set({ barcode: e.target.value })} />
            <TextField fullWidth label="Strength" placeholder="e.g. 500mg" value={form.strength ?? ''} onChange={(e) => set({ strength: e.target.value })} />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Box sx={{ flex: 1 }}>
              <SelectWithOther label="Category *" value={form.category} options={CATEGORIES} onChange={(v) => set({ category: v })} />
            </Box>
            <TextField fullWidth label="Manufacturer" value={form.manufacturer} onChange={(e) => set({ manufacturer: e.target.value })} sx={{ flex: 1 }} />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField select fullWidth label="Unit" value={form.dosage_form ?? ''} onChange={(e) => set({ dosage_form: e.target.value })}>
              {UNITS.map((u) => (
                <MenuItem key={u} value={u}>
                  {u}
                </MenuItem>
              ))}
            </TextField>
            <TextField fullWidth label="MRP (₹) *" type="number" value={form.price || ''} onChange={(e) => set({ price: Number(e.target.value) })} />
            <TextField fullWidth label="Min Stock" type="number" value={form.min_stock} onChange={(e) => set({ min_stock: Number(e.target.value) })} />
          </Stack>
          {!editing && (
            <TextField
              label="Opening Stock"
              type="number"
              helperText="Units already on the shelf. Later stock comes in through Purchases."
              value={form.stock || ''}
              onChange={(e) => set({ stock: Number(e.target.value) })}
            />
          )}
          <Stack direction="row" spacing={3} flexWrap="wrap">
            <FormControlLabel
              control={<Switch checked={!!form.requires_prescription} onChange={(e) => set({ requires_prescription: e.target.checked })} />}
              label="Prescription required"
            />
            <FormControlLabel
              control={<Switch checked={form.is_active} onChange={(e) => set({ is_active: e.target.checked })} />}
              label="Listed on MedEfix app"
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Medicine'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<VendorMedicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<VendorMedicine | null>(null);
  const [deleting, setDeleting] = useState<VendorMedicine | null>(null);
  const [toast, setToast] = useState('');

  const load = async () => {
    try {
      setMedicines(await vendorAPI.getMyMedicines());
      setError('');
    } catch (e) {
      setError(apiError(e, 'Failed to load medicines'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return medicines;
    return medicines.filter((m) =>
      [m.name, m.generic_name, m.barcode ?? '', m.manufacturer].some((v) => v.toLowerCase().includes(q)),
    );
  }, [medicines, search]);

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await vendorAPI.deleteMyMedicine(deleting.id);
      setToast('Medicine deleted');
      load();
    } catch (e) {
      setError(apiError(e, 'Failed to delete medicine'));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between', mb: 3, pt: 1 }}>
        <TextField
          placeholder="Search medicines by name, generic, or barcode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: { xs: '100%', sm: 460 }, bgcolor: 'background.paper' }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setDialogOpen(true); }} sx={{ py: 1.25 }}>
          Add Medicine
        </Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TableCard>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Medicine Info</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Manufacturer</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell align="right">MRP</TableCell>
              <TableCell align="center">Min Stock</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <EmptyRow colSpan={7} text={search ? 'No medicines match your search.' : 'No medicines yet. Add your first one.'} />
            ) : (
              filtered.map((m) => (
                <TableRow key={m.id} hover sx={{ opacity: m.is_active ? 1 : 0.6 }}>
                  <TableCell>
                    <Typography fontWeight={700}>
                      {m.name}
                      {m.strength && m.strength !== '-' && !m.name.includes(m.strength) ? ` ${m.strength}` : ''}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {m.generic_name}
                    </Typography>
                    {m.barcode && (
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                        <BarcodeIcon sx={{ fontSize: 15 }} /> {m.barcode}
                      </Typography>
                    )}
                    {!m.is_active && <Chip size="small" label="Not listed on app" sx={{ mt: 0.5, height: 20 }} />}
                  </TableCell>
                  <TableCell>
                    <Chip variant="outlined" label={m.category || 'N/A'} />
                  </TableCell>
                  <TableCell>{m.manufacturer || '-'}</TableCell>
                  <TableCell>{m.dosage_form || '-'}</TableCell>
                  <TableCell align="right">{rs(m.price)}</TableCell>
                  <TableCell align="center">
                    <Chip
                      variant="outlined"
                      size="small"
                      label={m.min_stock}
                      sx={{ borderColor: '#E6A23C', color: '#B7791F', fontWeight: 600, minWidth: 36 }}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="Edit">
                      <IconButton color="primary" onClick={() => { setEditing(m); setDialogOpen(true); }}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton color="error" onClick={() => setDeleting(m)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableCard>

      <MedicineDialog open={dialogOpen} editing={editing} onClose={() => setDialogOpen(false)} onSaved={(msg) => { setToast(msg); load(); }} />
      <ConfirmDialog
        open={!!deleting}
        title="Delete medicine?"
        message={`${deleting?.name ?? ''} and its stock batches will be removed. Past sales and purchases keep their records.`}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
      <Snackbar open={!!toast} autoHideDuration={2500} onClose={() => setToast('')} message={toast} />
    </Box>
  );
}
