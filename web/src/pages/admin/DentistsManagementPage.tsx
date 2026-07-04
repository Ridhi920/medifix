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
import { dentistAPI, Dentist, DentistCreate } from '../../api/dentistApi';
import LocationPicker from '../../components/LocationPicker';

const SPECIALTIES = [
  'General Dentist',
  'Orthodontist',
  'Endodontist',
  'Periodontist',
  'Prosthodontist',
  'Pediatric Dentist',
  'Oral Surgeon',
  'Cosmetic Dentist',
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
];

export default function DentistsManagementPage() {
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDentist, setEditingDentist] = useState<Dentist | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  const [formData, setFormData] = useState<DentistCreate>({
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
  });

  const [_imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    fetchDentists();
  }, []);

  const fetchDentists = async () => {
    try {
      const data = await dentistAPI.getDentists(undefined, true); // Include inactive dentists for admin
      setDentists(data);
    } catch (error: any) {
      showSnackbar('Failed to load dentists', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenDialog = (dentist?: Dentist) => {
    if (dentist) {
      setEditingDentist(dentist);
      setFormData({
        name: dentist.name,
        specialty: dentist.specialty,
        qualification: dentist.qualification,
        experience: dentist.experience,
        rating: dentist.rating,
        consultation_fee: dentist.consultation_fee,
        available_days: dentist.available_days,
        available_slots: dentist.available_slots,
        image: dentist.image,
        address: dentist.address,
      });
      setImagePreview(dentist.image);
      setImageFile(null);
    } else {
      setEditingDentist(null);
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
      });
      setImagePreview('');
      setImageFile(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingDentist(null);
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
      if (editingDentist) {
        await dentistAPI.updateDentist(editingDentist.id, formData);
        showSnackbar('Dentist updated successfully', 'success');
      } else {
        await dentistAPI.createDentist(formData);
        showSnackbar('Dentist created successfully', 'success');
      }
      handleCloseDialog();
      fetchDentists();
    } catch (error: any) {
      showSnackbar(error.response?.data?.detail || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (dentistId: number) => {
    if (window.confirm('Are you sure you want to delete this dentist?')) {
      try {
        await dentistAPI.deleteDentist(dentistId);
        showSnackbar('Dentist deleted successfully', 'success');
        fetchDentists();
      } catch (error: any) {
        showSnackbar('Failed to delete dentist', 'error');
      }
    }
  };

  const handleToggleStatus = async (dentist: Dentist) => {
    try {
      await dentistAPI.toggleDentistStatus(dentist.id, !dentist.is_active);
      showSnackbar(`Dentist ${!dentist.is_active ? 'activated' : 'deactivated'}`, 'success');
      fetchDentists();
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
          Dentists Management ({dentists.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Dentist
        </Button>
      </Stack>

      {/* Dentists Table */}
      <TableContainer component={Paper} sx={{ overflow: 'auto' }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow>
              <TableCell width="50"><strong>Icon</strong></TableCell>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Specialty</strong></TableCell>
              <TableCell><strong>Experience</strong></TableCell>
              <TableCell><strong>Rating</strong></TableCell>
              <TableCell><strong>Fee (₹)</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dentists.map((dentist) => (
              <TableRow key={dentist.id} hover>
                <TableCell>
                  {dentist.image && (dentist.image.startsWith('data:') || dentist.image.startsWith('http')) ? (
                    <img 
                      src={dentist.image} 
                      alt={dentist.name}
                      style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Typography fontSize={32}>{dentist.image || '🦷'}</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography fontWeight={600}>{dentist.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {dentist.qualification}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={dentist.specialty} size="small" color="primary" variant="outlined" />
                </TableCell>
                <TableCell>{dentist.experience} years</TableCell>
                <TableCell>⭐ {dentist.rating}</TableCell>
                <TableCell>₹{dentist.consultation_fee}</TableCell>
                <TableCell>
                  <Switch
                    checked={dentist.is_active}
                    onChange={() => handleToggleStatus(dentist)}
                    color="success"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(dentist)}
                    color="primary"
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(dentist.id)}
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
          {editingDentist ? 'Edit Dentist' : 'Add New Dentist'}
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
            <Grid item xs={12}>
              <Box>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="dentist-image-upload"
                  type="file"
                  onChange={handleImageChange}
                />
                <label htmlFor="dentist-image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    fullWidth
                  >
                    📸 Add Photo
                  </Button>
                </label>
                {imagePreview && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" display="block" gutterBottom>
                      ✓ Photo selected
                    </Typography>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{
                        maxWidth: '100px',
                        maxHeight: '100px',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                    />
                  </Box>
                )}
              </Box>
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
                latitude={(formData as any).latitude}
                longitude={(formData as any).longitude}
                onAddressChange={(addr) => setFormData({ ...formData, address: addr })}
                onLocationChange={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng } as any)}
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
            {editingDentist ? 'Update' : 'Create'}
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
