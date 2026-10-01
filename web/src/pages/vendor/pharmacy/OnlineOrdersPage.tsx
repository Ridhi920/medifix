import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import vendorAPI, { VendorBooking, VENDOR_STATUS_OPTIONS } from '../../../api/vendorApi';
import AppointmentsTab from '../tabs/AppointmentsTab';
import { PageHeader } from './shared';

/** Orders placed from the MedEfix mobile app for this store. */
export default function OnlineOrdersPage() {
  const [orders, setOrders] = useState<VendorBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setOrders(await vendorAPI.getMyBookings());
      setError('');
    } catch {
      setError('Failed to load online orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await vendorAPI.updateBookingStatus(id, status);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    } catch {
      setError('Failed to update status.');
      load();
    }
  };

  return (
    <Box>
      <PageHeader
        title="Online Orders"
        actions={
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load} sx={{ bgcolor: 'background.paper' }}>
            Refresh
          </Button>
        }
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <CircularProgress />
        </Box>
      ) : (
        <AppointmentsTab bookings={orders} role="pharmacy" statusOptions={VENDOR_STATUS_OPTIONS.pharmacy} onStatusChange={handleStatusChange} />
      )}
    </Box>
  );
}
