import { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
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
  Typography,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import { pharmacyAPI, PharmacyStore, PharmacyStoreCreate } from '../../api/pharmacyApi';
import LocationPicker from '../../components/LocationPicker';
import SearchBar from '../../components/SearchBar';

const EMPTY_FORM: PharmacyStoreCreate = {
  name: '',
  address: '',
  city: '',
  phone: '',
  image: '🏥',
  rating: 0,
  delivery_time: '30-45 mins',
  opening_hours: '',
  latitude: undefined,
  longitude: undefined,
};

/**
 * Manages the pharmacy stores customers pick from in the mobile app. Each
 * medicine belongs to exactly one store, so a store must exist before its
 * shelf can be stocked on the Pharmacy page.
 */
export default function PharmacyStoresManagementPage() {
  const [stores, setStores] = useState<PharmacyStore[]>([]);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingStore, setEditingStore] = useState<PharmacyStore | null>(null);
  const [formData, setFormData] = useState<PharmacyStoreCreate>(EMPTY_FORM);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    fetchStores();
  }, []);

  const showSnackbar = (message: string, severity: 'success' | 'error') =>
    setSnackbar({ open: true, message, severity });

  const fetchStores = async () => {
    try {
      // active_only=false so closed stores stay manageable here.
      setStores(await pharmacyAPI.getStores(undefined, false));
    } catch {
      showSnackbar('Failed to load pharmacy stores', 'error');
    }
  };

  const handleOpenDialog = (store?: PharmacyStore) => {
    if (store) {
      setEditingStore(store);
      setFormData({
        name: store.name,
        address: store.address,
        city: store.city || '',
        phone: store.phone || '',
        image: store.image,
        rating: store.rating,
        delivery_time: store.delivery_time,
        opening_hours: store.opening_hours || '',
        latitude: store.latitude ?? undefined,
        longitude: store.longitude ?? undefined,
      });
    } else {
      setEditingStore(null);
      setFormData(EMPTY_FORM);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingStore(null);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.address.trim()) {
      showSnackbar('Store name and address are required', 'error');
      return;
    }
    try {
      if (editingStore) {
        await pharmacyAPI.updateStore(editingStore.id, formData);
        showSnackbar('Store updated successfully', 'success');
      } else {
        await pharmacyAPI.createStore(formData);
        showSnackbar('Store created successfully', 'success');
      }
      handleCloseDialog();
      fetchStores();
    } catch (error: any) {
      showSnackbar(error.response?.data?.detail || 'Failed to save store', 'error');
    }
  };

  const handleToggleStatus = async (store: PharmacyStore) => {
    try {
      await pharmacyAPI.toggleStoreStatus(store.id, !store.is_active);
      showSnackbar(`Store ${store.is_active ? 'closed' : 'opened'}`, 'success');
      fetchStores();
    } catch {
      showSnackbar('Failed to update store status', 'error');
    }
  };

  const handleDelete = async (store: PharmacyStore) => {
    if (!window.confirm(`Delete "${store.name}"? This cannot be undone.`)) return;
    try {
      await pharmacyAPI.deleteStore(store.id);
      showSnackbar('Store deleted successfully', 'success');
      fetchStores();
    } catch (error: any) {
      // The backend refuses to delete a store that still stocks medicines.
      showSnackbar(error.response?.data?.detail || 'Failed to delete store', 'error');
    }
  };

  const visibleStores = stores.filter((s) =>
    [s.name, s.address, s.city ?? '', s.phone ?? '']
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h4" component="h1">
          Pharmacy Stores
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
          Add Store
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Customers pick a store first, then browse that store's shelf. Add medicines to a store on
        the Pharmacy page. A customer can fill one cart from several stores and check out at once —
        the order is then split, one per store.
      </Typography>

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by store name, address, city or phone…"
      />

      <TableContainer component={Paper} sx={{ overflow: 'auto' }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow>
              <TableCell>Logo</TableCell>
              <TableCell>Store</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>City</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Delivery</TableCell>
              <TableCell>Hours</TableCell>
              <TableCell>Rating</TableCell>
              <TableCell>Medicines</TableCell>
              <TableCell>Open</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleStores.map((store) => (
              <TableRow key={store.id}>
                <TableCell>
                  {store.image.startsWith('data:') || store.image.startsWith('http') ? (
                    <img
                      src={store.image}
                      alt={store.name}
                      style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }}
                    />
                  ) : (
                    <Box sx={{ fontSize: 28 }}>{store.image}</Box>
                  )}
                </TableCell>
                <TableCell>{store.name}</TableCell>
                <TableCell sx={{ maxWidth: 260 }}>{store.address}</TableCell>
                <TableCell>{store.city || '-'}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{store.phone || '-'}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{store.delivery_time}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{store.opening_hours || '-'}</TableCell>
                <TableCell>{store.rating ? `★ ${store.rating.toFixed(1)}` : '-'}</TableCell>
                <TableCell>
                  <Chip
                    label={store.medicine_count}
                    size="small"
                    color={store.medicine_count > 0 ? 'success' : 'warning'}
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={store.is_active}
                    onChange={() => handleToggleStatus(store)}
                    color="primary"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpenDialog(store)} color="primary" size="small">
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(store)} color="error" size="small">
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {visibleStores.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No pharmacy stores yet. Add one so customers have somewhere to order from.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingStore ? 'Edit Pharmacy Store' : 'Add Pharmacy Store'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Store Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />

            <LocationPicker
              label="Store Address"
              address={formData.address}
              onAddressChange={(address) => setFormData({ ...formData, address })}
              latitude={formData.latitude ?? undefined}
              longitude={formData.longitude ?? undefined}
              onLocationChange={(latitude, longitude) =>
                setFormData({ ...formData, latitude, longitude })
              }
            />

            <Stack direction="row" spacing={2}>
              <TextField
                label="City"
                value={formData.city ?? ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                fullWidth
              />
              <TextField
                label="Phone"
                value={formData.phone ?? ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                fullWidth
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField
                label="Delivery Time"
                value={formData.delivery_time ?? ''}
                onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
                helperText="Shown on the store card, e.g. 30-45 mins"
                fullWidth
              />
              <TextField
                label="Opening Hours"
                value={formData.opening_hours ?? ''}
                onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
                helperText="e.g. 8:00 AM - 10:00 PM"
                fullWidth
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField
                label="Rating"
                type="number"
                value={formData.rating ?? 0}
                onChange={(e) =>
                  setFormData({ ...formData, rating: Math.min(5, Math.max(0, Number(e.target.value))) })
                }
                inputProps={{ min: 0, max: 5, step: 0.1 }}
                fullWidth
              />
              <TextField
                label="Logo (emoji or image URL)"
                value={formData.image ?? ''}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                helperText="An emoji like 🏥 or 💊, or a full image URL"
                fullWidth
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingStore ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
