import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
} from '@mui/icons-material';
import { doctorAPI, Doctor, DoctorCreate } from '../../api/doctorApi';
import LocationPicker from '../../components/LocationPicker';

const SPECIALTIES = [
  'Cardiologist',
  'Dentist',
  'Pediatrician',
  'General Physician',
  'Dermatologist',
  'Orthopedic',
  'Neurologist',
  'Gynecologist',
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
];

export default function DoctorsManagementPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  const [formData, setFormData] = useState<DoctorCreate>({
    name: '',
    specialty: '',
    qualification: '',
    experience: 0,
    rating: 4.5,
    consultation_fee: 0,
    available_days: [],
    available_slots: [],
    image: '',
    address: '',
    latitude: undefined,
    longitude: undefined,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const data = await doctorAPI.getDoctors(undefined, true); // Include inactive doctors for admin
      setDoctors(data);
    } catch (error: any) {
      showSnackbar('Failed to load doctors', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenDialog = (doctor?: Doctor) => {
    if (doctor) {
      setEditingDoctor(doctor);
      setFormData({
        name: doctor.name,
        specialty: doctor.specialty,
        qualification: doctor.qualification,
        experience: doctor.experience,
        rating: doctor.rating,
        consultation_fee: doctor.consultation_fee,
        available_days: doctor.available_days,
        available_slots: doctor.available_slots,
        image: doctor.image,
        address: doctor.address,
        latitude: doctor.latitude ?? undefined,
        longitude: doctor.longitude ?? undefined,
      });
      setImagePreview(doctor.image);
      setImageFile(null);
    } else {
      setEditingDoctor(null);
      setFormData({
        name: '',
        specialty: '',
        qualification: '',
        experience: 0,
        rating: 4.5,
        consultation_fee: 0,
        available_days: [],
        available_slots: [],
        image: '',
        address: '',
        latitude: undefined,
        longitude: undefined,
      });
      setImagePreview('');
      setImageFile(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setImageFile(null);
    setImagePreview('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setFormData(prev => ({ ...prev, image: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingDoctor) {
        await doctorAPI.updateDoctor(editingDoctor.id, formData);
        showSnackbar('Doctor updated successfully', 'success');
      } else {
        await doctorAPI.createDoctor(formData);
        showSnackbar('Doctor created successfully', 'success');
      }
      handleCloseDialog();
      fetchDoctors();
    } catch (error: any) {
      showSnackbar(error.response?.data?.detail || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (doctorId: number) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      try {
        await doctorAPI.deleteDoctor(doctorId);
        showSnackbar('Doctor deleted successfully', 'success');
        fetchDoctors();
      } catch (error: any) {
        showSnackbar('Failed to delete doctor', 'error');
      }
    }
  };

  const handleToggleStatus = async (doctor: Doctor) => {
    try {
      await doctorAPI.toggleDoctorStatus(doctor.id, !doctor.is_active);
      showSnackbar(`Doctor ${!doctor.is_active ? 'activated' : 'deactivated'}`, 'success');
      fetchDoctors();
    } catch (error: any) {
      showSnackbar('Failed to update status', 'error');
    }
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      available_days: prev.available_days.includes(day)
        ? prev.available_days.filter(d => d !== day)
        : [...prev.available_days, day],
    }));
  };

  const toggleSlot = (slot: string) => {
    setFormData(prev => ({
      ...prev,
      available_slots: prev.available_slots.includes(slot)
        ? prev.available_slots.filter(s => s !== slot)
        : [...prev.available_slots, slot],
    }));
  };

  return (
    <Box>
      {/* Action Bar */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Doctors Management ({doctors.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Doctor
        </Button>
      </Stack>

      {/* Doctors Table */}
      <TableContainer component={Paper} sx={{ overflow: 'auto' }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow>
              <TableCell width="50"><strong>Icon</strong></TableCell>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Specialty</strong></TableCell>
              <TableCell><strong>Experience</strong></TableCell>
              <TableCell><strong>Address</strong></TableCell>
              <TableCell><strong>Rating</strong></TableCell>
              <TableCell><strong>Fee (₹)</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {doctors.map((doctor) => (
              <TableRow key={doctor.id} hover>
                <TableCell>
                  {doctor.image && (doctor.image.startsWith('data:') || doctor.image.startsWith('http')) ? (
                    <img 
                      src={doctor.image} 
                      alt={doctor.name}
                      style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Typography fontSize={32}>{doctor.image || '👨‍⚕️'}</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography fontWeight={600}>{doctor.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {doctor.qualification}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={doctor.specialty} size="small" color="primary" variant="outlined" />
                </TableCell>
                <TableCell>{doctor.experience} years</TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 200 }}>
                    {doctor.address || '—'}
                  </Typography>
                </TableCell>
                <TableCell>⭐ {doctor.rating}</TableCell>
                <TableCell>₹{doctor.consultation_fee}</TableCell>
                <TableCell>
                  <Switch
                    checked={doctor.is_active}
                    onChange={() => handleToggleStatus(doctor)}
                    color="success"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(doctor)}
                    color="primary"
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(doctor.id)}
                    color="error"
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Specialty"
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value=""></option>
                {SPECIALTIES.map((spec) => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Qualification"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="doctor-image-upload"
                type="file"
                onChange={handleImageChange}
              />
              <label htmlFor="doctor-image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  sx={{ height: '56px' }}
                >
                  📸 Add Photo
                </Button>
              </label>
              {imagePreview && (
                <Box sx={{ mt: 1, textAlign: 'center' }}>
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: '8px' }}
                  />
                </Box>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary" sx={{ pt: 2 }}>
                {imagePreview ? '✓ Photo selected' : 'No photo selected'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Experience (years)"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Rating"
                inputProps={{ min: 0, max: 5, step: 0.1 }}
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Consultation Fee (₹)"
                value={formData.consultation_fee}
                onChange={(e) => setFormData({ ...formData, consultation_fee: parseInt(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12}>
              <LocationPicker
                address={formData.address}
                latitude={formData.latitude}
                longitude={formData.longitude}
                onAddressChange={(addr) => setFormData({ ...formData, address: addr })}
                onLocationChange={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng })}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Available Days
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {DAYS.map((day) => (
                  <Chip
                    key={day}
                    label={day}
                    onClick={() => toggleDay(day)}
                    color={formData.available_days.includes(day) ? 'primary' : 'default'}
                    variant={formData.available_days.includes(day) ? 'filled' : 'outlined'}
                  />
                ))}
              </Stack>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Available Time Slots
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {TIME_SLOTS.map((slot) => (
                  <Chip
                    key={slot}
                    label={slot}
                    onClick={() => toggleSlot(slot)}
                    color={formData.available_slots.includes(slot) ? 'secondary' : 'default'}
                    variant={formData.available_slots.includes(slot) ? 'filled' : 'outlined'}
                    size="small"
                  />
                ))}
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
          >
            {editingDoctor ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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
