import { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Collapse,
  Select,
  MenuItem,
  Button,
  Stack,
  Typography,
} from '@mui/material';
import {
  KeyboardArrowDown as ExpandIcon,
  KeyboardArrowUp as CollapseIcon,
  Check as AcceptIcon,
  Close as RejectIcon,
} from '@mui/icons-material';
import type { VendorBooking } from '../../../api/vendorApi';
import { STATUS_COLORS, prettyStatus, money, formatDateTime, acceptStatus, rejectStatus } from '../vendorUtils';

/** Order line items arrive as objects; plain join() would print [object Object]. */
type LineItem = { medicine_name?: string; quantity?: number; price?: number };

const isLineItems = (v: any): v is LineItem[] =>
  Array.isArray(v) && v.length > 0 && typeof v[0] === 'object' && v[0] !== null;

function LineItems({ items }: { items: LineItem[] }) {
  return (
    <Box component="ul" sx={{ m: 0, pl: 2 }}>
      {items.map((item, i) => (
        <Typography component="li" variant="body2" key={`${item.medicine_name}-${i}`}>
          {item.medicine_name ?? 'Item'} × {item.quantity ?? 1}
          {item.price != null ? ` — ${money((item.price ?? 0) * (item.quantity ?? 1))}` : ''}
        </Typography>
      ))}
    </Box>
  );
}

function Row({
  booking,
  role,
  statusOptions,
  onStatusChange,
}: {
  booking: VendorBooking;
  role: string;
  statusOptions: string[];
  onStatusChange: (id: number, status: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const isPending = booking.status === 'pending';

  return (
    <>
      <TableRow hover>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <CollapseIcon /> : <ExpandIcon />}
          </IconButton>
        </TableCell>
        <TableCell>#{booking.id}</TableCell>
        <TableCell>{booking.patient_name}</TableCell>
        <TableCell>{money(booking.price)}</TableCell>
        <TableCell>
          <Chip label={prettyStatus(booking.status)} size="small" color={STATUS_COLORS[booking.status] || 'default'} />
        </TableCell>
        <TableCell>{formatDateTime(booking.created_at)}</TableCell>
        <TableCell>
          {isPending ? (
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<AcceptIcon />}
                onClick={() => onStatusChange(booking.id, acceptStatus())}
                sx={{ textTransform: 'none' }}
              >
                Accept
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<RejectIcon />}
                onClick={() => onStatusChange(booking.id, rejectStatus(role))}
                sx={{ textTransform: 'none' }}
              >
                Reject
              </Button>
            </Stack>
          ) : (
            <Select
              size="small"
              value={booking.status}
              onChange={(e) => onStatusChange(booking.id, e.target.value)}
              sx={{ minWidth: 160 }}
            >
              {(statusOptions.includes(booking.status) ? statusOptions : [booking.status, ...statusOptions]).map(
                (s) => (
                  <MenuItem key={s} value={s}>
                    {prettyStatus(s)}
                  </MenuItem>
                ),
              )}
            </Select>
          )}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={7} sx={{ py: 0, borderBottom: open ? undefined : 'none' }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, px: 1, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {Object.entries(booking.details).map(([key, value]) => (
                <Box key={key} sx={{ minWidth: 160 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                    {key.replace(/_/g, ' ')}
                  </Typography>
                  {isLineItems(value) ? (
                    <LineItems items={value} />
                  ) : (
                    <Typography variant="body2">
                      {Array.isArray(value) ? value.join(', ') : String(value ?? '—')}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function AppointmentsTab({
  bookings,
  role,
  statusOptions,
  onStatusChange,
}: {
  bookings: VendorBooking[];
  role: string;
  statusOptions: string[];
  onStatusChange: (id: number, status: string) => void;
}) {
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const isPharmacy = role === 'pharmacy';
  const isAmbulance = role === 'ambulance';
  const personLabel = isPharmacy ? 'Customer' : 'Patient';
  const workNoun = isPharmacy ? 'order' : isAmbulance ? 'trip' : 'request';

  if (bookings.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
        {isPharmacy && 'No orders yet. New medicine orders from customers will appear here.'}
        {isAmbulance && 'No trips yet. New ambulance requests will appear here.'}
        {!isPharmacy && !isAmbulance && 'No bookings yet. New requests from patients will appear here.'}
      </Paper>
    );
  }

  return (
    <Box>
      {pendingCount > 0 && (
        <Typography variant="body2" sx={{ mb: 2, color: '#ea580c', fontWeight: 600 }}>
          {pendingCount} {workNoun}{pendingCount > 1 ? 's' : ''} awaiting your response
        </Typography>
      )}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: '#f8fafc' } }}>
              <TableCell />
              <TableCell>ID</TableCell>
              <TableCell>{personLabel}</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Requested</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bookings.map((b) => (
              <Row key={b.id} booking={b} role={role} statusOptions={statusOptions} onStatusChange={onStatusChange} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
