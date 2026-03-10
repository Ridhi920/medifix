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

interface DentistAppointment {
  id: number;
  dentist_id: number;
  patient_name: string;
  patient_age: number;
  symptoms: string;
  appointment_day: string;
  appointment_slot: string;
  appointment_date: string;
  consultation_fee: number;
  status: string;
  created_at: string;
  dentist_name: string;
  dentist_specialty: string;
  dentist_image: string;
}

export default function DentistAppointmentsManagementPage() {
  const [dentist_appointments, setDentistAppointments] = useState<DentistAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedDentistAppointment, setSelectedDentistAppointment] = useState<DentistAppointment | null>(null);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchDentistAppointments();
  }, []);

  const fetchDentistAppointments = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:8000/dentists/appointments/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDentistAppointments(response.data);
    } catch (error: any) {
      console.error('Error fetching dentist_appointments:', error);
      setError('Failed to fetch dentist_appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleViewClick = (dentist_appointment: DentistAppointment) => {
    setSelectedDentistAppointment(dentist_appointment);
    setViewDialogOpen(true);
  };

  const handleCancelClick = (dentist_appointment: DentistAppointment) => {
    setSelectedDentistAppointment(dentist_appointment);
    setConfirmDialogOpen(true);
  };

  const handleConfirmDentistAppointment = async () => {
    if (!selectedDentistAppointment) return;

    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(
        `http://localhost:8000/dentists/appointments/${selectedDentistAppointment.id}/confirm`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setDentistAppointments(dentist_appointments.map(appt => 
        appt.id === selectedDentistAppointment.id 
          ? { ...appt, status: 'confirmed' }
          : appt
      ));
      setConfirmDialogOpen(false);
      setSelectedDentistAppointment(null);
    } catch (error: any) {
      console.error('Error confirming dentist_appointment:', error);
      setError(error.response?.data?.detail || 'Failed to confirm dentist_appointment');
    }
  };

  const handleRejectClick = (dentist_appointment: DentistAppointment) => {
    setSelectedDentistAppointment(dentist_appointment);
    setRejectDialogOpen(true);
  };

  const handleRejectDentistAppointment = async () => {
    if (!selectedDentistAppointment) return;

    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(
        `http://localhost:8000/dentists/appointments/${selectedDentistAppointment.id}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setDentistAppointments(dentist_appointments.map(appt => 
        appt.id === selectedDentistAppointment.id 
          ? { ...appt, status: 'rejected' }
          : appt
      ));
      setRejectDialogOpen(false);
      setSelectedDentistAppointment(null);
    } catch (error: any) {
      console.error('Error rejecting dentist_appointment:', error);
      setError(error.response?.data?.detail || 'Failed to reject dentist_appointment');
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

  const filteredDentistAppointments = filterStatus === 'all' 
    ? dentist_appointments 
    : dentist_appointments.filter(appt => appt.status === filterStatus);

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
        <Typography variant="h4">DentistAppointments Management</Typography>
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
              <TableCell><strong>Dentist</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Time Slot</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredDentistAppointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="textSecondary">No dentist_appointments found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredDentistAppointments.map((dentist_appointment) => (
                <TableRow key={dentist_appointment.id}>
                  <TableCell>{dentist_appointment.id}</TableCell>
                  <TableCell>{dentist_appointment.patient_name}</TableCell>
                  <TableCell>
                    {dentist_appointment.dentist_name || 'N/A'}
                    <Typography variant="caption" display="block" color="textSecondary">
                      {dentist_appointment.dentist_specialty || ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(dentist_appointment.appointment_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{dentist_appointment.appointment_slot}</TableCell>
                  <TableCell>
                    <Chip
                      label={dentist_appointment.status}
                      color={getStatusColor(dentist_appointment.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="primary"
                      onClick={() => handleViewClick(dentist_appointment)}
                      size="small"
                      title="View Details"
                    >
                      <ViewIcon />
                    </IconButton>
                    {dentist_appointment.status === 'pending' && (
                      <>
                        <IconButton
                          color="success"
                          onClick={() => handleCancelClick(dentist_appointment)}
                          size="small"
                          title="Confirm"
                        >
                          <ConfirmIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleRejectClick(dentist_appointment)}
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
        <DialogTitle>DentistAppointment Details</DialogTitle>
        <DialogContent>
          {selectedDentistAppointment && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="subtitle2" color="textSecondary">Patient Information</Typography>
              <Typography><strong>Name:</strong> {selectedDentistAppointment.patient_name}</Typography>
              <Typography><strong>Age:</strong> {selectedDentistAppointment.patient_age}</Typography>
              <Typography><strong>Symptoms:</strong> {selectedDentistAppointment.symptoms}</Typography>
              
              <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 2 }}>DentistAppointment Details</Typography>
              <Typography><strong>Dentist:</strong> {selectedDentistAppointment.dentist_name || 'N/A'}</Typography>
              <Typography><strong>Specialty:</strong> {selectedDentistAppointment.dentist_specialty || 'N/A'}</Typography>
              <Typography><strong>Date:</strong> {new Date(selectedDentistAppointment.appointment_date).toLocaleDateString()}</Typography>
              <Typography><strong>Day:</strong> {selectedDentistAppointment.appointment_day}</Typography>
              <Typography><strong>Time Slot:</strong> {selectedDentistAppointment.appointment_slot}</Typography>
              <Typography><strong>Consultation Fee:</strong> ₹{selectedDentistAppointment.consultation_fee}</Typography>
              <Typography><strong>Status:</strong> {selectedDentistAppointment.status}</Typography>
              <Typography><strong>Booked On:</strong> {new Date(selectedDentistAppointment.created_at).toLocaleString()}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirm DentistAppointment</DialogTitle>
        <DialogContent>
          Are you sure you want to confirm the dentist_appointment for <strong>{selectedDentistAppointment?.patient_name}</strong>?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDentistAppointment} color="success" variant="contained">
            Confirm DentistAppointment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>Reject DentistAppointment</DialogTitle>
        <DialogContent>
          Are you sure you want to reject the dentist_appointment for <strong>{selectedDentistAppointment?.patient_name}</strong>?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRejectDentistAppointment} color="error" variant="contained">
            Reject DentistAppointment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
