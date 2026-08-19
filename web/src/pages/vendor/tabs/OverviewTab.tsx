import { Box, Paper, Typography, Stack, Chip } from '@mui/material';
import type { VendorBooking } from '../../../api/vendorApi';
import { money, prettyStatus, STATUS_COLORS } from '../vendorUtils';

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

export default function OverviewTab({ bookings }: { bookings: VendorBooking[] }) {
  const today = new Date().toDateString();
  const todays = bookings.filter((b) => new Date(b.created_at).toDateString() === today);
  const pending = bookings.filter((b) => b.status === 'pending');
  const completed = bookings.filter((b) => ['completed', 'delivered'].includes(b.status));
  const revenue = completed.reduce((sum, b) => sum + (b.price || 0), 0);
  const uniquePatients = new Set(bookings.map((b) => b.patient_name)).size;

  // Status breakdown
  const byStatus: Record<string, number> = {};
  bookings.forEach((b) => {
    byStatus[b.status] = (byStatus[b.status] ?? 0) + 1;
  });

  return (
    <Box>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        Today at a glance
      </Typography>
      <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <Tile label="Today's Bookings" value={todays.length} color="#0d9488" />
        <Tile label="Pending Actions" value={pending.length} color="#ea580c" />
        <Tile label="Total Patients" value={uniquePatients} color="#2563eb" />
        <Tile label="Completed" value={completed.length} color="#16a34a" />
        <Tile label="Revenue (completed)" value={money(revenue)} color="#7c3aed" />
      </Stack>

      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        Booking status breakdown
      </Typography>
      {bookings.length === 0 ? (
        <Typography color="text.secondary">No bookings yet.</Typography>
      ) : (
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          {Object.entries(byStatus).map(([status, count]) => (
            <Chip
              key={status}
              label={`${prettyStatus(status)}: ${count}`}
              color={STATUS_COLORS[status] || 'default'}
              variant="outlined"
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}
