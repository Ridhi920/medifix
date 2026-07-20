import { useState, useEffect } from 'react';
import {
  Box, Button, Paper, Stack, TextField, Typography,
  Alert, Snackbar, Divider, InputAdornment, CircularProgress,
} from '@mui/material';
import { CurrencyRupee, LocalShipping, ConfirmationNumber } from '@mui/icons-material';
import { settingsAPI, type FeeSettings } from '../../api/settingsApi';
import { useAuth } from '../../context/AuthContext';

export default function FeeSettingsPage() {
  const { token } = useAuth();
  const [fees, setFees] = useState<FeeSettings>({
    convenience_fee: 7,
    delivery_fee: 20,
    free_delivery_threshold: 400,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    settingsAPI.getFees()
      .then(setFees)
      .catch(() => {}) // keep defaults on error
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const updated = await settingsAPI.updateFees(fees, token);
      setFees(updated);
      setSnackbar({ open: true, message: 'Fee settings saved successfully', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to save settings', severity: 'error' });
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
    <Box maxWidth={520}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        Fee Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Changes apply to all new pharmacy orders immediately.
      </Typography>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack spacing={3}>

          {/* Convenience Fee */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} mb={0.5}>
              Convenience Fee
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
              Charged on every order regardless of cart value.
            </Typography>
            <TextField
              fullWidth
              type="number"
              value={fees.convenience_fee}
              onChange={(e) => setFees({ ...fees, convenience_fee: parseFloat(e.target.value) || 0 })}
              inputProps={{ min: 0, step: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ConfirmationNumber fontSize="small" color="action" />
                    <Typography ml={0.5}>₹</Typography>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Divider />

          {/* Delivery Fee */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} mb={0.5}>
              Delivery Fee
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
              Applied when cart total is below the free delivery threshold.
            </Typography>
            <TextField
              fullWidth
              type="number"
              value={fees.delivery_fee}
              onChange={(e) => setFees({ ...fees, delivery_fee: parseFloat(e.target.value) || 0 })}
              inputProps={{ min: 0, step: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocalShipping fontSize="small" color="action" />
                    <Typography ml={0.5}>₹</Typography>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Divider />

          {/* Free Delivery Threshold */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} mb={0.5}>
              Free Delivery Above
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
              Orders at or above this amount get free delivery.
            </Typography>
            <TextField
              fullWidth
              type="number"
              value={fees.free_delivery_threshold}
              onChange={(e) => setFees({ ...fees, free_delivery_threshold: parseFloat(e.target.value) || 0 })}
              inputProps={{ min: 0, step: 50 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CurrencyRupee fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Divider />

          {/* Preview */}
          <Box sx={{ backgroundColor: '#ecfdfa', borderRadius: 2, p: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} mb={1} color="primary">
              Preview
            </Typography>
            <Stack spacing={0.5}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Cart Total (example ₹250)</Typography>
                <Typography variant="body2" fontWeight={600}>₹250</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Convenience Fee</Typography>
                <Typography variant="body2" fontWeight={600}>₹{fees.convenience_fee}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Delivery (below ₹{fees.free_delivery_threshold})
                </Typography>
                <Typography variant="body2" fontWeight={600}>₹{fees.delivery_fee}</Typography>
              </Stack>
              <Divider sx={{ my: 0.5 }} />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" fontWeight={700}>Total</Typography>
                <Typography variant="body2" fontWeight={700} color="primary">
                  ₹{250 + fees.convenience_fee + fees.delivery_fee}
                </Typography>
              </Stack>
              <Typography variant="caption" color="success.main" mt={0.5}>
                ✓ Orders ≥ ₹{fees.free_delivery_threshold} get free delivery
              </Typography>
            </Stack>
          </Box>

          <Button
            variant="contained"
            size="large"
            onClick={handleSave}
            disabled={saving}
            sx={{ borderRadius: 2 }}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </Stack>
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
