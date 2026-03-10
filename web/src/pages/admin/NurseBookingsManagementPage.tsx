import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Alert,
  Snackbar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Visibility,
  Cancel,
  MoreVert,
  CheckCircle,
  Schedule,
  PlayArrow,
  Done,
  Close,
} from '@mui/icons-material';
import { nurseAPI, NurseBooking } from '../../api/nurseApi';

const STATUS_COLORS: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  pending: 'warning',
  confirmed: 'info',
  in_progress: 'info',
  completed: 'success',
  cancelled: 'error',
};

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'warning' },
  { value: 'confirmed', label: 'Confirmed', color: 'info' },
  { value: 'in_progress', label: 'In Progress', color: 'info' },
  { value: 'completed', label: 'Completed', color: 'success' },
  { value: 'cancelled', label: 'Cancelled', color: 'error' },
] as const;

export default function NurseBookingsManagementPage() {
  const [bookings, setBookings] = useState<NurseBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<NurseBooking | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<null | HTMLElement>(null);
  const [statusChangeBooking, setStatusChangeBooking] = useState<NurseBooking | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const data = await nurseAPI.getAllBookings();
      setBookings(data);
    } catch (error: any) {
      showSnackbar('Failed to load bookings', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleViewBooking = (booking: NurseBooking) => {
    setSelectedBooking(booking);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedBooking(null);
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await nurseAPI.cancelBooking(bookingId);
        showSnackbar('Booking cancelled successfully', 'success');
        fetchBookings();
        handleCloseDialog();
      } catch (error: any) {
        showSnackbar('Failed to cancel booking', 'error');
      }
    }
  };

  const handleOpenStatusMenu = (event: React.MouseEvent<HTMLElement>, booking: NurseBooking) => {
    setStatusMenuAnchor(event.currentTarget);
    setStatusChangeBooking(booking);
  };

  const handleCloseStatusMenu = () => {
    setStatusMenuAnchor(null);
    setStatusChangeBooking(null);
  };

  const handleChangeStatus = async (newStatus: string) => {
    if (!statusChangeBooking) return;

    try {
      await nurseAPI.updateBookingStatus(statusChangeBooking.id, newStatus);
      showSnackbar(`Booking status updated to ${newStatus}`, 'success');
      fetchBookings();
      handleCloseStatusMenu();
      if (selectedBooking && selectedBooking.id === statusChangeBooking.id) {
        setSelectedBooking({ ...selectedBooking, status: newStatus as NurseBooking['status'] });
      }
    } catch (error: any) {
      showSnackbar('Failed to update booking status', 'error');
      handleCloseStatusMenu();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Schedule fontSize="small" />;
      case 'confirmed': return <CheckCircle fontSize="small" />;
      case 'in_progress': return <PlayArrow fontSize="small" />;
      case 'completed': return <Done fontSize="small" />;
      case 'cancelled': return <Close fontSize="small" />;
      default: return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Nurse Bookings Management
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Booking ID</TableCell>
              <TableCell>Nurse</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Booking Type</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>Total Price</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Booking Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell>#{booking.id}</TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {booking.nurse_name || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {booking.nurse_specialization}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">{booking.patient_name}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {booking.patient_age}y, {booking.patient_gender}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={booking.booking_type} 
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  {booking.duration} {booking.booking_type === 'hourly' ? 'hrs' : booking.booking_type === 'daily' ? 'days' : 'weeks'}
                </TableCell>
                <TableCell>{formatDate(booking.start_date)}</TableCell>
                <TableCell>
                  <Typography fontWeight="bold" color="primary">
                    ₹{booking.total_price}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={booking.status}
                    color={STATUS_COLORS[booking.status] || 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{formatDateTime(booking.created_at)}</TableCell>
                <TableCell align="right">
                  <IconButton
                    onClick={() => handleViewBooking(booking)}
                    color="primary"
                    size="small"
                    title="View Details"
                  >
                    <Visibility />
                  </IconButton>
                  <IconButton
                    onClick={(e) => handleOpenStatusMenu(e, booking)}
                    color="info"
                    size="small"
                    title="Change Status"
                  >
                    <MoreVert />
                  </IconButton>
                  {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                    <IconButton
                      onClick={() => handleCancelBooking(booking.id)}
                      color="error"
                      size="small"
                      title="Cancel Booking"
                    >
                      <Cancel />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Booking Details Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Booking Details #{selectedBooking?.id}
        </DialogTitle>
        <DialogContent>
          {selectedBooking && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="h6" gutterBottom>Nurse Information</Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Typography sx={{ fontSize: '2rem' }}>{selectedBooking.nurse_image}</Typography>
                    <Box>
                      <Typography variant="body1" fontWeight="bold">
                        {selectedBooking.nurse_name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {selectedBooking.nurse_qualification} • {selectedBooking.nurse_specialization}
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" gutterBottom>Patient Information</Typography>
                <Stack spacing={1}>
                  <Typography><strong>Name:</strong> {selectedBooking.patient_name}</Typography>
                  <Typography><strong>Age:</strong> {selectedBooking.patient_age} years</Typography>
                  <Typography><strong>Gender:</strong> {selectedBooking.patient_gender}</Typography>
                  <Typography><strong>Contact:</strong> {selectedBooking.contact_number}</Typography>
                  <Typography><strong>Address:</strong> {selectedBooking.address}</Typography>
                  {selectedBooking.medical_condition && (
                    <Typography><strong>Medical Condition:</strong> {selectedBooking.medical_condition}</Typography>
                  )}
                </Stack>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" gutterBottom>Booking Details</Typography>
                <Stack spacing={1}>
                  <Typography><strong>Booking Type:</strong> {selectedBooking.booking_type}</Typography>
                  <Typography>
                    <strong>Duration:</strong> {selectedBooking.duration} {selectedBooking.booking_type === 'hourly' ? 'hours' : selectedBooking.booking_type === 'daily' ? 'days' : 'weeks'}
                  </Typography>
                  <Typography><strong>Shift:</strong> {selectedBooking.shift_preference}</Typography>
                  <Typography><strong>Start Date:</strong> {formatDate(selectedBooking.start_date)}</Typography>
                  {selectedBooking.start_time && (
                    <Typography><strong>Start Time:</strong> {selectedBooking.start_time}</Typography>
                  )}
                  <Typography>
                    <strong>Required Services:</strong>
                    <Box sx={{ mt: 0.5 }}>
                      {selectedBooking.required_services.map(service => (
                        <Chip key={service} label={service} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                      ))}
                    </Box>
                  </Typography>
                  {selectedBooking.special_instructions && (
                    <Typography><strong>Special Instructions:</strong> {selectedBooking.special_instructions}</Typography>
                  )}
                </Stack>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" gutterBottom>Payment Information</Typography>
                <Stack spacing={1}>
                  <Typography variant="h5" color="primary" fontWeight="bold">
                    Total: ₹{selectedBooking.total_price}
                  </Typography>
                  <Chip
                    label={selectedBooking.status}
                    color={STATUS_COLORS[selectedBooking.status] || 'default'}
                  />
                </Stack>
              </Box>

              <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  Booking created on {formatDateTime(selectedBooking.created_at)}
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          {selectedBooking && (
            <>
              <Button
                onClick={(e) => handleOpenStatusMenu(e, selectedBooking)}
                color="info"
                startIcon={<MoreVert />}
                variant="outlined"
              >
                Change Status
              </Button>
              {selectedBooking.status !== 'cancelled' && selectedBooking.status !== 'completed' && (
                <Button
                  onClick={() => handleCancelBooking(selectedBooking.id)}
                  color="error"
                  startIcon={<Cancel />}
                >
                  Cancel Booking
                </Button>
              )}
            </>
          )}
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Status Change Menu */}
      <Menu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor)}
        onClose={handleCloseStatusMenu}
      >
        {STATUS_OPTIONS.map((statusOption) => (
          <MenuItem
            key={statusOption.value}
            onClick={() => handleChangeStatus(statusOption.value)}
            disabled={statusChangeBooking?.status === statusOption.value}
          >
            <ListItemIcon>
              {getStatusIcon(statusOption.value)}
            </ListItemIcon>
            <ListItemText>
              {statusOption.label}
            </ListItemText>
          </MenuItem>
        ))}
      </Menu>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
