import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Person as PersonIcon, Search as SearchIcon } from '@mui/icons-material';
import pharmacyPosAPI, { PosCustomer, PosCustomerInput, apiError } from '../../../api/pharmacyPosApi';
import { ConfirmDialog, EmptyRow, PageHeader, TableCard, rs } from './shared';

const EMPTY: PosCustomerInput = { name: '', phone: '', email: '', address: '' };

function CustomerDialog({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean;
  editing: PosCustomer | null;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [form, setForm] = useState<PosCustomerInput>(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(editing ? { name: editing.name, phone: editing.phone ?? '', email: editing.email ?? '', address: editing.address ?? '' } : EMPTY);
  }, [open, editing]);

  const save = async () => {
    if (!form.name.trim()) return setError('Customer name is required');
    const payload = {
      name: form.name.trim(),
      phone: form.phone?.trim() || null,
      email: form.email?.trim() || null,
      address: form.address?.trim() || null,
    };
    setSaving(true);
    try {
      if (editing) await pharmacyPosAPI.updateCustomer(editing.id, payload);
      else await pharmacyPosAPI.createCustomer(payload);
      onSaved(editing ? 'Customer updated' : 'Customer added');
      onClose();
    } catch (e) {
      setError(apiError(e, 'Failed to save customer'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editing ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField autoFocus label="Customer Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField label="Phone Number" value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <TextField label="Email" type="email" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <TextField label="Address" multiline minRows={3} value={form.address ?? ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={saving}>
          {editing ? 'Save Changes' : 'Add Customer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<PosCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PosCustomer | null>(null);
  const [deleting, setDeleting] = useState<PosCustomer | null>(null);
  const [toast, setToast] = useState('');

  const load = async () => {
    try {
      setCustomers(await pharmacyPosAPI.getCustomers());
      setError('');
    } catch (e) {
      setError(apiError(e, 'Failed to load customers'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? customers.filter((c) => [c.name, c.phone ?? '', c.email ?? ''].some((v) => v.toLowerCase().includes(q)))
      : customers;
  }, [customers, search]);

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await pharmacyPosAPI.deleteCustomer(deleting.id);
      setToast('Customer deleted');
      load();
    } catch (e) {
      setError(apiError(e, 'Failed to delete customer'));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Box>
      <PageHeader title="Customer Management" />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <TextField
          placeholder="Search customers by name, phone or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: { xs: '100%', sm: 420 }, bgcolor: 'background.paper' }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setDialogOpen(true); }} sx={{ py: 1.25 }}>
          Add Customer
        </Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TableCard>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Address</TableCell>
              <TableCell align="right">Purchases</TableCell>
              <TableCell align="right">Balance Due</TableCell>
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
              <EmptyRow colSpan={7} text={search ? 'No customers match your search.' : 'No customers yet.'} />
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <PersonIcon fontSize="small" color="primary" />
                      <Typography fontWeight={600}>{c.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{c.phone || '—'}</TableCell>
                  <TableCell>{c.email || '—'}</TableCell>
                  <TableCell sx={{ maxWidth: 240 }}>{c.address || '—'}</TableCell>
                  <TableCell align="right">
                    {c.total_purchases} · {rs(c.total_spent)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: c.balance_due > 0 ? 'error.main' : 'text.secondary', fontWeight: c.balance_due > 0 ? 600 : 400 }}>
                    {rs(c.balance_due)}
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="Edit">
                      <IconButton color="primary" onClick={() => { setEditing(c); setDialogOpen(true); }}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton color="error" onClick={() => setDeleting(c)}>
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
      <CustomerDialog open={dialogOpen} editing={editing} onClose={() => setDialogOpen(false)} onSaved={(m) => { setToast(m); load(); }} />
      <ConfirmDialog
        open={!!deleting}
        title="Delete customer?"
        message={`${deleting?.name ?? ''} will be removed. Their past receipts are kept.`}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
      <Snackbar open={!!toast} autoHideDuration={2500} onClose={() => setToast('')} message={toast} />
    </Box>
  );
}
