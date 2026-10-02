import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Science,
  CheckBox,
  Visibility,
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

interface LabBooking {
  id: number;
  user_id: number;
  lab_test_id: number;
  patient_name: string;
  patient_age: number;
  patient_phone: string;
  collection_date: string;
  collection_time: string;
  home_collection: boolean;
  address: string | null;
  center_name: string | null;
  test_price: number;
  status: string;
  created_at: string;
  test_name: string;
  test_category: string;
  test_parameters: string[];
}

export default function LabBookingsManagementPage() {
  const [bookings, setBookings] = useState<LabBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [selectedBooking, setSelectedBooking] = useState<LabBooking | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_BASE_URL}/lab-tests/bookings/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(response.data);
      setLoading(false);
    } catch (error: any) {
      showSnackbar('Failed to load bookings', 'error');
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleConfirm = async (bookingId: number) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(
        `${API_BASE_URL}/lab-tests/bookings/${bookingId}/confirm`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showSnackbar('Booking confirmed successfully', 'success');
      fetchBookings();
    } catch (error: any) {
      showSnackbar('Failed to confirm booking', 'error');
    }
  };

  const handleCollected = async (bookingId: number) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(
        `${API_BASE_URL}/lab-tests/bookings/${bookingId}/collected`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showSnackbar('Sample marked as collected', 'success');
      fetchBookings();
    } catch (error: any) {
      showSnackbar('Failed to update status', 'error');
    }
  };

  const handleComplete = async (bookingId: number) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(
        `${API_BASE_URL}/lab-tests/bookings/${bookingId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showSnackbar('Booking completed successfully', 'success');
      fetchBookings();
    } catch (error: any) {
      showSnackbar('Failed to complete booking', 'error');
    }
  };

  const handleCancel = async (bookingId: number) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        const token = localStorage.getItem('adminToken');
        await axios.patch(
          `${API_BASE_URL}/lab-tests/bookings/${bookingId}/cancel`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showSnackbar('Booking cancelled', 'success');
        fetchBookings();
      } catch (error: any) {
        showSnackbar('Failed to cancel booking', 'error');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'info';
      case 'sample_collected':
        return 'primary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'sample_collected':
        return 'Sample Collected';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const filteredBookings = statusFilter === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === statusFilter);

  const statusCounts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    sample_collected: bookings.filter(b => b.status === 'sample_collected').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  const handleViewDetails = (booking: LabBooking) => {
    setSelectedBooking(booking);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedBooking(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading bookings...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Lab Test Bookings ({filteredBookings.length})
        </Typography>
      </Stack>

      {/* Status Filter Chips */}
      <Stack direction="row" spacing={1} mb={3} flexWrap="wrap">
        <Chip
          label={`All (${statusCounts.all})`}
          color={statusFilter === 'all' ? 'primary' : 'default'}
          onClick={() => setStatusFilter('all')}
          sx={{ cursor: 'pointer' }}
        />
        <Chip
          label={`Pending (${statusCounts.pending})`}
          color={statusFilter === 'pending' ? 'warning' : 'default'}
          onClick={() => setStatusFilter('pending')}
          sx={{ cursor: 'pointer' }}
        />
        <Chip
          label={`Confirmed (${statusCounts.confirmed})`}
          color={statusFilter === 'confirmed' ? 'info' : 'default'}
          onClick={() => setStatusFilter('confirmed')}
          sx={{ cursor: 'pointer' }}
        />
        <Chip
          label={`Sample Collected (${statusCounts.sample_collected})`}
          color={statusFilter === 'sample_collected' ? 'primary' : 'default'}
          onClick={() => setStatusFilter('sample_collected')}
          sx={{ cursor: 'pointer' }}
        />
        <Chip
          label={`Completed (${statusCounts.completed})`}
          color={statusFilter === 'completed' ? 'success' : 'default'}
          onClick={() => setStatusFilter('completed')}
          sx={{ cursor: 'pointer' }}
        />
        <Chip
          label={`Cancelled (${statusCounts.cancelled})`}
          color={statusFilter === 'cancelled' ? 'error' : 'default'}
          onClick={() => setStatusFilter('cancelled')}
          sx={{ cursor: 'pointer' }}
        />
      </Stack>

      {/* Bookings Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Booking ID</strong></TableCell>
              <TableCell><strong>Patient</strong></TableCell>
              <TableCell><strong>Test Name</strong></TableCell>
              <TableCell><strong>Collection</strong></TableCell>
              <TableCell><strong>Date & Time</strong></TableCell>
              <TableCell><strong>Price</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography color="text.secondary" py={3}>
                    No bookings found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredBookings.map((booking) => (
                <TableRow key={booking.id} hover>
                  <TableCell>#{booking.id}</TableCell>
                  <TableCell>
                    <Typography fontWeight={600}>{booking.patient_name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Age: {booking.patient_age} • {booking.patient_phone}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={500}>{booking.test_name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {booking.test_category}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {booking.home_collection ? (
                      <Chip label="Home Collection" size="small" color="primary" />
                    ) : (
                      <Chip label="Lab Visit" size="small" color="default" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{booking.collection_date}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {booking.collection_time}
                    </Typography>
                  </TableCell>
                  <TableCell>₹{booking.test_price}</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(booking.status)}
                      size="small"
                      color={getStatusColor(booking.status)}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => handleViewDetails(booking)}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {booking.status === 'pending' && (
                        <Tooltip title="Confirm Booking">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleConfirm(booking.id)}
                          >
                            <CheckCircle fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      {booking.status === 'confirmed' && (
                        <Tooltip title="Mark Sample Collected">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleCollected(booking.id)}
                          >
                            <Science fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      {booking.status === 'sample_collected' && (
                        <Tooltip title="Mark Completed">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleComplete(booking.id)}
                          >
                            <CheckBox fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      {(booking.status === 'pending' || booking.status === 'confirmed') && (
                        <Tooltip title="Cancel Booking">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleCancel(booking.id)}
                          >
                            <Cancel fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={handleCloseDetails} maxWidth="sm" fullWidth>
        <DialogTitle>Booking Details</DialogTitle>
        <DialogContent>
          {selectedBooking && (
            <Stack spacing={2} pt={1}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Test Name</Typography>
                <Typography variant="body1" fontWeight={600}>{selectedBooking.test_name}</Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Test Parameters</Typography>
                <Typography variant="body2">
                  {selectedBooking.test_parameters.join(', ')}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">Patient Information</Typography>
                <Typography variant="body2">
                  {selectedBooking.patient_name}, {selectedBooking.patient_age} years
                </Typography>
                <Typography variant="body2">Phone: {selectedBooking.patient_phone}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">Collection Details</Typography>
                <Typography variant="body2">
                  {selectedBooking.home_collection ? (
                    <>
                      <strong>Home Collection</strong>
                      <br />
                      Address: {selectedBooking.address}
                    </>
                  ) : (
                    <>
                      <strong>Lab Visit</strong>
                      <br />
                      Center: {selectedBooking.center_name}
                    </>
                  )}
                </Typography>
                <Typography variant="body2">
                  Date: {selectedBooking.collection_date} at {selectedBooking.collection_time}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">Pricing</Typography>
                <Typography variant="body1">₹{selectedBooking.test_price}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip
                  label={getStatusLabel(selectedBooking.status)}
                  size="small"
                  color={getStatusColor(selectedBooking.status)}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">Booked On</Typography>
                <Typography variant="body2">
                  {new Date(selectedBooking.created_at).toLocaleString()}
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Close</Button>
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
