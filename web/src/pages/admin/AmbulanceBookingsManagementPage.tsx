import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Grid,
} from '@mui/material';
import {
  CheckCircle,
  LocalShipping,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

interface User {
  id: number;
  email: string;
  full_name: string;
  phone_number: string;
}

interface Ambulance {
  id: number;
  name: string;
  ambulance_type: string;
  estimated_time: string;
  image: string;
}

interface AmbulanceBooking {
  id: number;
  user_id: number;
  ambulance_id: number;
  patient_name: string;
  contact_number: string;
  pickup_address: string;
  dropoff_address: string;
  medical_condition: string | null;
  booking_type: 'immediate' | 'scheduled';
  scheduled_date: string | null;
  scheduled_time: string | null;
  ambulance_price: number;
  status: 'pending' | 'confirmed' | 'dispatched' | 'completed' | 'cancelled';
  created_at: string;
  user?: User;
  ambulance?: Ambulance;
}

const STATUS_COLORS = {
  pending: 'warning',
  confirmed: 'info',
  dispatched: 'primary',
  completed: 'success',
  cancelled: 'error',
} as const;

const STATUS_FILTERS = ['all', 'pending', 'confirmed', 'dispatched', 'completed', 'cancelled'] as const;

export default function AmbulanceBookingsManagementPage() {
  const [bookings, setBookings] = useState<AmbulanceBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<AmbulanceBooking[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<AmbulanceBooking | null>(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, selectedStatus, searchQuery]);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_BASE_URL}/ambulances/bookings/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(response.data);
    } catch (error: any) {
      showSnackbar('Failed to load bookings', 'error');
    }
  };

  const filterBookings = () => {
    let filtered = bookings;

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((b) => b.status === selectedStatus);
    }

    // Search by patient name or contact
    if (searchQuery) {
      filtered = filtered.filter(
        (b) =>
          b.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.contact_number.includes(searchQuery)
      );
    }

    setFilteredBookings(filtered);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleStatusUpdate = async (bookingId: number, action: 'confirm' | 'dispatch' | 'complete' | 'cancel') => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(
        `${API_BASE_URL}/ambulances/bookings/${bookingId}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showSnackbar(`Booking ${action}ed successfully`, 'success');
      fetchBookings();
      setOpenDetailsDialog(false);
    } catch (error: any) {
      showSnackbar(error.response?.data?.detail || 'Operation failed', 'error');
    }
  };

  const handleViewDetails = (booking: AmbulanceBooking) => {
    setSelectedBooking(booking);
    setOpenDetailsDialog(true);
  };

  const getActionButtons = (booking: AmbulanceBooking) => {
    switch (booking.status) {
      case 'pending':
        return (
          <>
            <Button
              variant="contained"
              color="info"
              size="small"
              startIcon={<CheckCircle />}
              onClick={() => handleStatusUpdate(booking.id, 'confirm')}
            >
              Confirm
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<CancelIcon />}
              onClick={() => handleStatusUpdate(booking.id, 'cancel')}
            >
              Cancel
            </Button>
          </>
        );
      case 'confirmed':
        return (
          <>
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<LocalShipping />}
              onClick={() => handleStatusUpdate(booking.id, 'dispatch')}
            >
              Dispatch
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<CancelIcon />}
              onClick={() => handleStatusUpdate(booking.id, 'cancel')}
            >
              Cancel
            </Button>
          </>
        );
      case 'dispatched':
        return (
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={<CheckCircle />}
            onClick={() => handleStatusUpdate(booking.id, 'complete')}
          >
            Mark Complete
          </Button>
        );
      default:
        return null;
    }
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Ambulance Bookings Management ({filteredBookings.length})
        </Typography>
      </Stack>

      {/* Filters */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={selectedStatus}
          onChange={(_, value) => setSelectedStatus(value)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {STATUS_FILTERS.map((status) => (
            <Tab
              key={status}
              label={
                status === 'all'
                  ? `All (${bookings.length})`
                  : `${status.charAt(0).toUpperCase() + status.slice(1)} (${bookings.filter((b) => b.status === status).length})`
              }
              value={status}
            />
          ))}
        </Tabs>
        <Box p={2}>
          <TextField
            placeholder="Search by patient name or contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            size="small"
          />
        </Box>
      </Paper>

      {/* Bookings Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Booking ID</strong></TableCell>
              <TableCell><strong>Patient</strong></TableCell>
              <TableCell><strong>Ambulance</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>Pickup</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Price</strong></TableCell>
              <TableCell><strong>Booked At</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBookings.map((booking) => (
              <TableRow key={booking.id} hover>
                <TableCell>#{booking.id}</TableCell>
                <TableCell>
                  <Typography fontWeight={600}>{booking.patient_name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {booking.contact_number}
                  </Typography>
                  {booking.user && (
                    <Typography variant="caption" color="text.secondary">
                      User: {booking.user.full_name}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography fontSize={24}>{booking.ambulance?.image || '🚑'}</Typography>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {booking.ambulance?.name || `Ambulance #${booking.ambulance_id}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {booking.ambulance?.ambulance_type}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip
                    label={booking.booking_type}
                    size="small"
                    color={booking.booking_type === 'immediate' ? 'error' : 'default'}
                    variant="outlined"
                  />
                  {booking.booking_type === 'scheduled' && booking.scheduled_date && (
                    <Typography variant="caption" display="block" mt={0.5}>
                      {new Date(booking.scheduled_date).toLocaleDateString('en-IN')} {booking.scheduled_time}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap maxWidth={200}>
                    {booking.pickup_address}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={booking.status}
                    size="small"
                    color={STATUS_COLORS[booking.status]}
                  />
                </TableCell>
                <TableCell>
                  <Typography fontWeight={600}>₹{booking.ambulance_price}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{formatDateTime(booking.created_at)}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button size="small" onClick={() => handleViewDetails(booking)}>
                      View
                    </Button>
                    {getActionButtons(booking)}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Details Dialog */}
      <Dialog open={openDetailsDialog} onClose={() => setOpenDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Booking Details #{selectedBooking?.id}</DialogTitle>
        <DialogContent>
          {selectedBooking && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Patient Info */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Patient Information
                </Typography>
                <Typography variant="body1">
                  <strong>Name:</strong> {selectedBooking.patient_name}
                </Typography>
                <Typography variant="body1">
                  <strong>Contact:</strong> {selectedBooking.contact_number}
                </Typography>
                {selectedBooking.medical_condition && (
                  <Typography variant="body1">
                    <strong>Medical Condition:</strong> {selectedBooking.medical_condition}
                  </Typography>
                )}
              </Grid>

              {/* Ambulance Info */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Ambulance Information
                </Typography>
                <Typography variant="body1">
                  <strong>Type:</strong> {selectedBooking.ambulance?.name} ({selectedBooking.ambulance?.ambulance_type})
                </Typography>
                <Typography variant="body1">
                  <strong>Estimated Time:</strong> {selectedBooking.ambulance?.estimated_time}
                </Typography>
                <Typography variant="body1">
                  <strong>Price:</strong> ₹{selectedBooking.ambulance_price}
                </Typography>
              </Grid>

              {/* Location Info */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Location Details
                </Typography>
                <Typography variant="body1">
                  <strong>Pickup:</strong> {selectedBooking.pickup_address}
                </Typography>
                <Typography variant="body1">
                  <strong>Drop-off:</strong> {selectedBooking.dropoff_address}
                </Typography>
              </Grid>

              {/* Booking Type */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Booking Details
                </Typography>
                <Typography variant="body1">
                  <strong>Type:</strong>{' '}
                  <Chip
                    label={selectedBooking.booking_type}
                    size="small"
                    color={selectedBooking.booking_type === 'immediate' ? 'error' : 'default'}
                  />
                </Typography>
                {selectedBooking.booking_type === 'scheduled' && selectedBooking.scheduled_date && (
                  <>
                    <Typography variant="body1">
                      <strong>Scheduled Date:</strong>{' '}
                      {new Date(selectedBooking.scheduled_date).toLocaleDateString('en-IN')}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Scheduled Time:</strong> {selectedBooking.scheduled_time}
                    </Typography>
                  </>
                )}
                <Typography variant="body1">
                  <strong>Booked At:</strong> {formatDateTime(selectedBooking.created_at)}
                </Typography>
                <Typography variant="body1">
                  <strong>Status:</strong>{' '}
                  <Chip label={selectedBooking.status} size="small" color={STATUS_COLORS[selectedBooking.status]} />
                </Typography>
              </Grid>

              {/* User Info */}
              {selectedBooking.user && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    User Information
                  </Typography>
                  <Typography variant="body1">
                    <strong>Name:</strong> {selectedBooking.user.full_name}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Email:</strong> {selectedBooking.user.email}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Phone:</strong> {selectedBooking.user.phone_number}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailsDialog(false)}>Close</Button>
          {selectedBooking && (
            <Stack direction="row" spacing={1}>
              {getActionButtons(selectedBooking)}
            </Stack>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
