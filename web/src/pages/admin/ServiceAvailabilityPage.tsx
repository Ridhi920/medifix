import { useState, useEffect } from 'react';
import {
  Box, Button, Paper, Stack, Typography, Switch, Chip,
  Alert, Snackbar, Divider, CircularProgress,
} from '@mui/material';
import {
  MedicalServices, LocalPharmacy, AirportShuttle, Biotech,
  HealthAndSafety, FitnessCenter, LocalHospital,
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

export default function ServiceAvailabilityPage() {
  const { token } = useAuth();
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    settingsAPI.getAvailability()
      .then((data) => setUnavailable(data.unavailable_services))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isAvailable = (key: string) => !unavailable.includes(key);

  const toggle = (key: string) => {
    setUnavailable((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const updated = await settingsAPI.updateAvailability(unavailable, token);
      setUnavailable(updated.unavailable_services);
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
    <Box maxWidth={640}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        Service Availability
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Turn a service off to show it as unavailable in the customer app. Users
        can still see the service but won't be able to place orders or bookings
        for it until it's turned back on.
      </Typography>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack spacing={1}>
          {SERVICES.map((service, index) => {
            const available = isAvailable(service.key);
            return (
              <Box key={service.key}>
                {index > 0 && <Divider />}
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ py: 1.5 }}
                >
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box sx={{ color: available ? 'primary.main' : 'text.disabled', display: 'flex' }}>
                      {service.icon}
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {service.label}
                      </Typography>
                      <Chip
                        size="small"
                        label={available ? 'Available' : service.unavailableLabel}
                        color={available ? 'success' : 'default'}
                        variant={available ? 'filled' : 'outlined'}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Stack>
                  <Switch
                    checked={available}
                    onChange={() => toggle(service.key)}
                    color="success"
                  />
                </Stack>
              </Box>
            );
          })}
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Button
          variant="contained"
          size="large"
          onClick={handleSave}
          disabled={saving}
          sx={{ borderRadius: 2 }}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </Paper>

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
