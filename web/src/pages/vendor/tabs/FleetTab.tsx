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
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DirectionsCar as FleetIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import vendorAPI, {
  AVAILABILITY_LABELS,
  FleetVehicle,
  FleetVehicleCreate,
  VehicleAvailability,
} from '../../../api/vendorApi';
import { money } from '../vendorUtils';

const AMBULANCE_TYPES = ['BLS', 'ALS', 'Neonatal', 'Air'];
const AVAILABILITIES: VehicleAvailability[] = ['available', 'on_trip', 'off_duty'];

const listToText = (v: string[]): string => v.join(', ');
const textToList = (v: string): string[] =>
  v.split(',').map((s) => s.trim()).filter(Boolean);

const EMPTY: FleetVehicleCreate = {
  name: '',
  description: '',
  features: ['Trained paramedic', 'First aid kit'],
  estimated_time: '10-15 mins',
  base_price: 0,
  image: '🚑',
  ambulance_type: 'BLS',
  vehicle_number: '',
  driver_name: '',
  driver_phone: '',
  availability: 'available',
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
 * The operator's fleet. Everything here is scoped server-side to vehicles this
 * account owns. Only vehicles that are both listed and marked Available are
 * offered to customers booking an ambulance.
 */
export default function FleetTab({ operatorName }: { operatorName?: string | null }) {
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<FleetVehicle | null>(null);
  const [form, setForm] = useState<FleetVehicleCreate>(EMPTY);
  const [featuresText, setFeaturesText] = useState(listToText(EMPTY.features));
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setVehicles(await vendorAPI.getMyFleet());
      setError('');
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to load your fleet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(
    () => ({
      total: vehicles.length,
      available: vehicles.filter((v) => v.availability === 'available' && v.is_active).length,
      onTrip: vehicles.filter((v) => v.availability === 'on_trip').length,
      offDuty: vehicles.filter((v) => v.availability === 'off_duty').length,
    }),
    [vehicles],
  );

  const openFor = (vehicle?: FleetVehicle) => {
    if (vehicle) {
      setEditing(vehicle);
      setForm({
        name: vehicle.name,
        description: vehicle.description,
        features: vehicle.features,
        estimated_time: vehicle.estimated_time,
        base_price: vehicle.base_price,
        image: vehicle.image,
        ambulance_type: vehicle.ambulance_type,
        vehicle_number: vehicle.vehicle_number ?? '',
        driver_name: vehicle.driver_name ?? '',
        driver_phone: vehicle.driver_phone ?? '',
        availability: vehicle.availability,
      });
      setFeaturesText(listToText(vehicle.features));
    } else {
      setEditing(null);
      setForm(EMPTY);
      setFeaturesText(listToText(EMPTY.features));
    }
    setOpenDialog(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.description.trim()) {
      setError('Vehicle name and description are required.');
      return;
    }
    if (!form.base_price || form.base_price <= 0) {
      setError('Base price must be greater than zero.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = { ...form, features: textToList(featuresText) };
    try {
      if (editing) {
        await vendorAPI.updateFleetVehicle(editing.id, payload);
        setToast(`${form.name} updated`);
      } else {
        await vendorAPI.addFleetVehicle(payload);
        setToast(`${form.name} added to your fleet`);
      }
      setOpenDialog(false);
      load();
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to save the vehicle.');
    } finally {
      setSaving(false);
    }
  };

  const setAvailability = async (vehicle: FleetVehicle, availability: VehicleAvailability) => {
    try {
      const updated = await vendorAPI.updateFleetVehicle(vehicle.id, { availability });
      setVehicles((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
      setToast(`${updated.name} is now ${AVAILABILITY_LABELS[availability].toLowerCase()}`);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to update availability.');
    }
  };

  const toggleListed = async (vehicle: FleetVehicle) => {
    try {
      const updated = await vendorAPI.updateFleetVehicle(vehicle.id, { is_active: !vehicle.is_active });
      setVehicles((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
      setToast(updated.is_active ? `${updated.name} is listed` : `${updated.name} unlisted`);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to update the listing.');
    }
  };

  const remove = async (vehicle: FleetVehicle) => {
    if (!window.confirm(`Remove "${vehicle.name}" from your fleet? This cannot be undone.`)) return;
    try {
      await vendorAPI.removeFleetVehicle(vehicle.id);
      setVehicles((prev) => prev.filter((v) => v.id !== vehicle.id));
      setToast(`${vehicle.name} removed`);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to remove the vehicle.');
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
        <Tile label="Vehicles" value={stats.total} color="#2563eb" />
        <Tile label="Available Now" value={stats.available} color="#16a34a" />
        <Tile label="On Trip" value={stats.onTrip} color="#0d9488" />
        <Tile label="Off Duty" value={stats.offDuty} color="#64748b" />
      </Stack>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 2, alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Typography variant="h6" fontWeight={700}>
            My Fleet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Customers booking an ambulance from
            {operatorName ? ` ${operatorName}` : ' your service'} only see vehicles that are
            listed and marked Available.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => openFor()} sx={{ textTransform: 'none' }}>
          Add Vehicle
        </Button>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Vehicle</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Crew</TableCell>
              <TableCell align="right">Base Price</TableCell>
              <TableCell>ETA</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Listed</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vehicles.map((v) => (
              <TableRow key={v.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {v.image} {v.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {v.vehicle_number || 'No plate recorded'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={v.ambulance_type} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  {v.driver_name ? (
                    <>
                      <Typography variant="body2">{v.driver_name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {v.driver_phone || '—'}
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      —
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">{money(v.base_price)}</TableCell>
                <TableCell>{v.estimated_time}</TableCell>
                <TableCell>
                  <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={v.availability}
                    onChange={(_, next) => next && setAvailability(v, next)}
                  >
                    {AVAILABILITIES.map((a) => (
                      <ToggleButton key={a} value={a} sx={{ textTransform: 'none', px: 1.2, py: 0.3, fontSize: 12 }}>
                        {AVAILABILITY_LABELS[a]}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </TableCell>
                <TableCell>
                  <Tooltip title={v.is_active ? 'Visible to customers' : 'Hidden from customers'}>
                    <Switch checked={v.is_active} onChange={() => toggleListed(v)} size="small" />
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="primary" onClick={() => openFor(v)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => remove(v)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {vehicles.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>
                  <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                    <FleetIcon sx={{ fontSize: 44, opacity: 0.4, mb: 1 }} />
                    <Typography variant="body2">
                      Your fleet is empty. Add a vehicle so customers can book it.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? `Edit ${editing.name}` : 'Add Vehicle to Your Fleet'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Vehicle Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Registration Number"
                placeholder="e.g. MH-12-AB-1234"
                value={form.vehicle_number ?? ''}
                onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })}
                fullWidth
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                label="Type"
                value={form.ambulance_type}
                onChange={(e) => setForm({ ...form, ambulance_type: e.target.value })}
                fullWidth
              >
                {AMBULANCE_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Base Price (₹)"
                type="number"
                value={form.base_price}
                onChange={(e) => setForm({ ...form, base_price: Number(e.target.value) })}
                inputProps={{ min: 1 }}
                fullWidth
                required
              />
              <TextField
                label="Response Time"
                placeholder="e.g. 10-15 mins"
                value={form.estimated_time}
                onChange={(e) => setForm({ ...form, estimated_time: e.target.value })}
                fullWidth
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Driver / Crew Lead"
                value={form.driver_name ?? ''}
                onChange={(e) => setForm({ ...form, driver_name: e.target.value })}
                fullWidth
              />
              <TextField
                label="Driver Phone"
                value={form.driver_phone ?? ''}
                onChange={(e) => setForm({ ...form, driver_phone: e.target.value })}
                fullWidth
              />
            </Stack>
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              multiline
              rows={2}
              fullWidth
              required
            />
            <TextField
              label="Equipment / Features (comma-separated)"
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              helperText="Shown to customers, e.g. Oxygen supply, Ventilator, Stretcher"
              fullWidth
            />
            <TextField
              select
              label="Availability"
              value={form.availability ?? 'available'}
              onChange={(e) => setForm({ ...form, availability: e.target.value as VehicleAvailability })}
              fullWidth
            >
              {AVAILABILITIES.map((a) => (
                <MenuItem key={a} value={a}>
                  {AVAILABILITY_LABELS[a]}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button onClick={save} variant="contained" disabled={saving} sx={{ textTransform: 'none' }}>
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add to Fleet'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast('')} message={toast} />
    </Box>
  );
}
