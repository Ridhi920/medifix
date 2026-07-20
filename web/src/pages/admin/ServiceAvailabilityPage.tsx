import { useState, useEffect } from 'react';
import {
  Box, Button, Paper, Stack, Typography, Switch, Chip,
  Alert, Snackbar, CircularProgress, TextField, Collapse, alpha,
} from '@mui/material';
import {
  MedicalServices, LocalPharmacy, AirportShuttle, Biotech,
  HealthAndSafety, FitnessCenter, LocalHospital, EventAvailable,
} from '@mui/icons-material';
import { settingsAPI } from '../../api/settingsApi';
import { useAuth } from '../../context/AuthContext';

// Service metadata for display. Keys must match the backend KNOWN_SERVICES.
const SERVICES: { key: string; label: string; unavailableLabel: string; icon: JSX.Element }[] = [
  { key: 'doctor', label: 'Consult Doctor', unavailableLabel: 'Service unavailable', icon: <MedicalServices /> },
  { key: 'pharmacy', label: 'Pharmacy / Order Medicines', unavailableLabel: 'Store unavailable', icon: <LocalPharmacy /> },
  { key: 'ambulance', label: 'Book Ambulance', unavailableLabel: 'Service unavailable', icon: <AirportShuttle /> },
  { key: 'lab', label: 'Lab Tests', unavailableLabel: 'Service unavailable', icon: <Biotech /> },
  { key: 'nurse', label: 'Book Nurse', unavailableLabel: 'Service unavailable', icon: <HealthAndSafety /> },
  { key: 'physiotherapist', label: 'Physiotherapy', unavailableLabel: 'Service unavailable', icon: <FitnessCenter /> },
  { key: 'dentist', label: 'Book Dentist', unavailableLabel: 'Service unavailable', icon: <LocalHospital /> },
];

const todayISO = () => new Date().toISOString().slice(0, 10);

function formatReturnDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ServiceAvailabilityPage() {
  const { token } = useAuth();
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const [returnDates, setReturnDates] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    settingsAPI.getAvailability()
      .then((data) => {
        setUnavailable(data.unavailable_services);
        setReturnDates(data.return_dates ?? {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isAvailable = (key: string) => !unavailable.includes(key);

  const toggle = (key: string) => {
    setUnavailable((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const setReturnDate = (key: string, value: string) => {
    setReturnDates((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const updated = await settingsAPI.updateAvailability(unavailable, token, returnDates);
      setUnavailable(updated.unavailable_services);
      setReturnDates(updated.return_dates ?? {});
      setSnackbar({ open: true, message: 'Availability updated successfully', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to save availability', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box maxWidth={1160}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        Service Availability
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3} maxWidth={720}>
        Turn a service off to show it as unavailable in the customer app. Users
        can still see the service but won't be able to place orders or bookings
        for it until it's turned back on. Optionally let them know when it'll be
        back.
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 1.5,
          alignItems: 'start',
        }}
      >
        {SERVICES.map((service) => {
          const available = isAvailable(service.key);
          const returnDate = returnDates[service.key] ?? '';

          return (
            <Paper
              key={service.key}
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 3,
                borderColor: available ? 'divider' : alpha('#ef4444', 0.3),
                backgroundColor: available ? 'background.paper' : alpha('#ef4444', 0.04),
                transition: 'background-color 0.2s, border-color 0.2s',
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={2}
              >
                <Stack direction="row" alignItems="center" spacing={2} minWidth={0}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      flexShrink: 0,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: available ? 'primary.main' : 'text.disabled',
                      backgroundColor: available ? alpha('#0D9488', 0.1) : alpha('#000', 0.06),
                    }}
                  >
                    {service.icon}
                  </Box>
                  <Box minWidth={0}>
                    <Typography variant="subtitle1" fontWeight={600} noWrap>
                      {service.label}
                    </Typography>
                    <Chip
                      size="small"
                      label={
                        available
                          ? 'Available'
                          : returnDate
                          ? `Back on ${formatReturnDate(returnDate)}`
                          : service.unavailableLabel
                      }
                      color={available ? 'success' : 'default'}
                      variant={available ? 'filled' : 'outlined'}
                      sx={{
                        mt: 0.5,
                        ...(!available && { color: 'error.main', borderColor: 'error.light' }),
                      }}
                    />
                  </Box>
                </Stack>
                <Switch
                  checked={available}
                  onChange={() => toggle(service.key)}
                  color="success"
                />
              </Stack>

              <Collapse in={!available} timeout={200} unmountOnExit>
                <Box sx={{ mt: 1.5, pl: { xs: 0, sm: 7.5 } }}>
                  <TextField
                    size="small"
                    type="date"
                    label="Expected back on (optional)"
                    value={returnDate}
                    onChange={(e) => setReturnDate(service.key, e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: todayISO() }}
                    InputProps={{
                      startAdornment: <EventAvailable fontSize="small" sx={{ mr: 1, color: 'action.active' }} />,
                    }}
                    sx={{ maxWidth: 280, width: '100%' }}
                  />
                </Box>
              </Collapse>
            </Paper>
          );
        })}
      </Box>

      <Button
        variant="contained"
        size="large"
        onClick={handleSave}
        disabled={saving}
        sx={{ borderRadius: 2, mt: 3 }}
      >
        {saving ? 'Saving…' : 'Save Changes'}
      </Button>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
