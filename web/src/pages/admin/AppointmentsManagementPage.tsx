import { useEffect, useState } from 'react';
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
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  TextField,
  MenuItem
} from '@mui/material';
import { Visibility as ViewIcon, CheckCircle as ConfirmIcon, Cancel as RejectIcon } from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

interface Appointment {
  id: number;
  doctor_id: number;
  patient_name: string;
  patient_age: number;
  symptoms: string;
  appointment_day: string;
  appointment_slot: string;
  appointment_date: string;
  consultation_fee: number;
  status: string;
  created_at: string;
  doctor_name: string;
  doctor_specialty: string;
  doctor_image: string;
}

export default function AppointmentsManagementPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_BASE_URL}/doctors/appointments/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(response.data);
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      setError('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleViewClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setViewDialogOpen(true);
  };

  const handleCancelClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setConfirmDialogOpen(true);
  };

  const handleConfirmAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(
        `${API_BASE_URL}/doctors/appointments/${selectedAppointment.id}/confirm`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setAppointments(appointments.map(appt => 
        appt.id === selectedAppointment.id 
          ? { ...appt, status: 'confirmed' }
          : appt
      ));
      setConfirmDialogOpen(false);
      setSelectedAppointment(null);
    } catch (error: any) {
      console.error('Error confirming appointment:', error);
      setError(error.response?.data?.detail || 'Failed to confirm appointment');
    }
  };

  const handleRejectClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setRejectDialogOpen(true);
  };

  const handleRejectAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(
        `${API_BASE_URL}/doctors/appointments/${selectedAppointment.id}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setAppointments(appointments.map(appt => 
        appt.id === selectedAppointment.id 
          ? { ...appt, status: 'rejected' }
          : appt
      ));
      setRejectDialogOpen(false);
      setSelectedAppointment(null);
    } catch (error: any) {
      console.error('Error rejecting appointment:', error);
      setError(error.response?.data?.detail || 'Failed to reject appointment');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'success';
      case 'rejected':
        return 'error';
      case 'cancelled':
        return 'error';
      case 'completed':
        return 'info';
      default:
        return 'default';
    }
  };

  const filteredAppointments = filterStatus === 'all' 
    ? appointments 
    : appointments.filter(appt => appt.status === filterStatus);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Appointments Management</Typography>
        <TextField
          select
          label="Filter by Status"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          sx={{ minWidth: 200 }}
          size="small"
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="confirmed">Confirmed</MenuItem>
          <MenuItem value="rejected">Rejected</MenuItem>
          <MenuItem value="cancelled">Cancelled</MenuItem>
          <MenuItem value="completed">Completed</MenuItem>
        </TextField>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>ID</strong></TableCell>
              <TableCell><strong>Patient Name</strong></TableCell>
              <TableCell><strong>Doctor</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Time Slot</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAppointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="textSecondary">No appointments found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredAppointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>{appointment.id}</TableCell>
                  <TableCell>{appointment.patient_name}</TableCell>
                  <TableCell>
                    {appointment.doctor_name || 'N/A'}
                    <Typography variant="caption" display="block" color="textSecondary">
                      {appointment.doctor_specialty || ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(appointment.appointment_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{appointment.appointment_slot}</TableCell>
                  <TableCell>
                    <Chip
                      label={appointment.status}
                      color={getStatusColor(appointment.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="primary"
                      onClick={() => handleViewClick(appointment)}
                      size="small"
                      title="View Details"
                    >
                      <ViewIcon />
                    </IconButton>
                    {appointment.status === 'pending' && (
                      <>
                        <IconButton
                          color="success"
                          onClick={() => handleCancelClick(appointment)}
                          size="small"
                          title="Confirm"
                        >
                          <ConfirmIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleRejectClick(appointment)}
                          size="small"
                          title="Reject"
                        >
                          <RejectIcon />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Appointment Details</DialogTitle>
        <DialogContent>
          {selectedAppointment && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="subtitle2" color="textSecondary">Patient Information</Typography>
              <Typography><strong>Name:</strong> {selectedAppointment.patient_name}</Typography>
              <Typography><strong>Age:</strong> {selectedAppointment.patient_age}</Typography>
              <Typography><strong>Symptoms:</strong> {selectedAppointment.symptoms}</Typography>
              
              <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 2 }}>Appointment Details</Typography>
              <Typography><strong>Doctor:</strong> {selectedAppointment.doctor_name || 'N/A'}</Typography>
              <Typography><strong>Specialty:</strong> {selectedAppointment.doctor_specialty || 'N/A'}</Typography>
              <Typography><strong>Date:</strong> {new Date(selectedAppointment.appointment_date).toLocaleDateString()}</Typography>
              <Typography><strong>Day:</strong> {selectedAppointment.appointment_day}</Typography>
              <Typography><strong>Time Slot:</strong> {selectedAppointment.appointment_slot}</Typography>
              <Typography><strong>Consultation Fee:</strong> ₹{selectedAppointment.consultation_fee}</Typography>
              <Typography><strong>Status:</strong> {selectedAppointment.status}</Typography>
              <Typography><strong>Booked On:</strong> {new Date(selectedAppointment.created_at).toLocaleString()}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirm Appointment</DialogTitle>
        <DialogContent>
          Are you sure you want to confirm the appointment for <strong>{selectedAppointment?.patient_name}</strong>?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmAppointment} color="success" variant="contained">
            Confirm Appointment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>Reject Appointment</DialogTitle>
        <DialogContent>
          Are you sure you want to reject the appointment for <strong>{selectedAppointment?.patient_name}</strong>?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRejectAppointment} color="error" variant="contained">
            Reject Appointment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
