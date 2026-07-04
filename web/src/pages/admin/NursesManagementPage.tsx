import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
} from '@mui/icons-material';
import { nurseAPI, Nurse, NurseCreate } from '../../api/nurseApi';
import LocationPicker from '../../components/LocationPicker';

export default function NursesManagementPage() {
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingNurse, setEditingNurse] = useState<Nurse | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  const [formData, setFormData] = useState<NurseCreate>({
    name: '',
    qualification: '',
    specialization: '',
    experience: 0,
    rating: 0,
    services: [],
    hourly_rate: 0,
    daily_rate: 0,
    available_shifts: [],
    languages: [],
    image: '',
    gender: '',
  });

  const [serviceInput, setServiceInput] = useState('');
  const [languageInput, setLanguageInput] = useState('');
  const [_imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    fetchNurses();
  }, []);

  const fetchNurses = async () => {
    try {
      const data = await nurseAPI.getNurses(undefined, true);
      setNurses(data);
    } catch (error: any) {
      showSnackbar('Failed to load nurses', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenDialog = (nurse?: Nurse) => {
    if (nurse) {
      setEditingNurse(nurse);
      setFormData({
        name: nurse.name,
        qualification: nurse.qualification,
        specialization: nurse.specialization,
        experience: nurse.experience,
        rating: nurse.rating,
        services: nurse.services,
        hourly_rate: nurse.hourly_rate,
        daily_rate: nurse.daily_rate,
        available_shifts: nurse.available_shifts,
        languages: nurse.languages,
        image: nurse.image,
        gender: nurse.gender,
      });
      setImagePreview(nurse.image);
      setImageFile(null);
    } else {
      setEditingNurse(null);
      setFormData({
        name: '',
        qualification: '',
        specialization: '',
        experience: 0,
        rating: 0,
        services: [],
        hourly_rate: 0,
        daily_rate: 0,
        available_shifts: [],
        languages: [],
        image: '',
        gender: '',
      });
      setImagePreview('');
      setImageFile(null);
    }
    setServiceInput('');
    setLanguageInput('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingNurse(null);
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
      if (editingNurse) {
        await nurseAPI.updateNurse(editingNurse.id, formData);
        showSnackbar('Nurse updated successfully', 'success');
      } else {
        await nurseAPI.createNurse(formData);
        showSnackbar('Nurse created successfully', 'success');
      }
      handleCloseDialog();
      fetchNurses();
    } catch (error: any) {
      showSnackbar(error.response?.data?.detail || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (nurseId: number) => {
    if (window.confirm('Are you sure you want to delete this nurse?')) {
      try {
        await nurseAPI.deleteNurse(nurseId);
        showSnackbar('Nurse deleted successfully', 'success');
        fetchNurses();
      } catch (error: any) {
        showSnackbar('Failed to delete nurse', 'error');
      }
    }
  };

  const handleToggleStatus = async (nurse: Nurse) => {
    try {
      await nurseAPI.toggleNurseStatus(nurse.id, !nurse.is_active);
      showSnackbar(`Nurse ${!nurse.is_active ? 'activated' : 'deactivated'}`, 'success');
      fetchNurses();
    } catch (error: any) {
      showSnackbar('Failed to update status', 'error');
    }
  };

  const handleAddService = () => {
    if (serviceInput.trim() && !formData.services.includes(serviceInput.trim())) {
      setFormData(prev => ({
        ...prev,
        services: [...prev.services, serviceInput.trim()],
      }));
      setServiceInput('');
    }
  };

  const handleRemoveService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter(s => s !== service),
    }));
  };

  const handleAddLanguage = () => {
    if (languageInput.trim() && !formData.languages.includes(languageInput.trim())) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, languageInput.trim()],
      }));
      setLanguageInput('');
    }
  };

  const handleRemoveLanguage = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter(l => l !== language),
    }));
  };

  const handleToggleShift = (shift: string) => {
    setFormData(prev => ({
      ...prev,
      available_shifts: prev.available_shifts.includes(shift)
        ? prev.available_shifts.filter(s => s !== shift)
        : [...prev.available_shifts, shift],
    }));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Nurses Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Nurse
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ overflow: 'auto' }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow>
              <TableCell>Icon</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Qualification</TableCell>
              <TableCell>Specialization</TableCell>
              <TableCell>Experience</TableCell>
              <TableCell>Rating</TableCell>
              <TableCell>Hourly Rate</TableCell>
              <TableCell>Daily Rate</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {nurses.map((nurse) => (
              <TableRow key={nurse.id}>
                <TableCell>
                  {nurse.image && (nurse.image.startsWith('data:') || nurse.image.startsWith('http')) ? (
                    <img 
                      src={nurse.image} 
                      alt={nurse.name}
                      style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Typography fontSize={32}>{nurse.image || '👨‍⚕️'}</Typography>
                  )}
                </TableCell>
                <TableCell>{nurse.name}</TableCell>
                <TableCell>{nurse.qualification}</TableCell>
                <TableCell>
                  <Chip label={nurse.specialization} size="small" color="primary" />
                </TableCell>
                <TableCell>{nurse.experience} years</TableCell>
                <TableCell>⭐ {nurse.rating.toFixed(1)}</TableCell>
                <TableCell>₹{nurse.hourly_rate}/hr</TableCell>
                <TableCell>₹{nurse.daily_rate}/day</TableCell>
                <TableCell>{nurse.gender}</TableCell>
                <TableCell>
                  <Switch
                    checked={nurse.is_active}
                    onChange={() => handleToggleStatus(nurse)}
                    color="primary"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    onClick={() => handleOpenDialog(nurse)}
                    color="primary"
                    size="small"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(nurse.id)}
                    color="error"
                    size="small"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingNurse ? 'Edit Nurse' : 'Add New Nurse'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            
            <TextField
              label="Qualification"
              value={formData.qualification}
              onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
              fullWidth
              required
              placeholder="e.g., BSc Nursing, GNM"
            />

            <FormControl fullWidth>
              <InputLabel>Specialization</InputLabel>
              <Select
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                label="Specialization"
              >
                {['ICU', 'Pediatric', 'Geriatric', 'General', 'Post-operative', 'Palliative'].map(spec => (
                  <MenuItem key={spec} value={spec}>{spec}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Gender</InputLabel>
              <Select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                label="Gender"
              >
                {['Male', 'Female'].map(gender => (
                  <MenuItem key={gender} value={gender}>{gender}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Experience (years)"
              type="number"
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
              fullWidth
              required
            />

            <TextField
              label="Rating"
              type="number"
              inputProps={{ min: 0, max: 5, step: 0.1 }}
              value={formData.rating}
              onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })}
              fullWidth
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Hourly Rate (₹)"
                type="number"
                value={formData.hourly_rate}
                onChange={(e) => setFormData({ ...formData, hourly_rate: parseInt(e.target.value) || 0 })}
                fullWidth
                required
              />
              <TextField
                label="Daily Rate (₹)"
                type="number"
                value={formData.daily_rate}
                onChange={(e) => setFormData({ ...formData, daily_rate: parseInt(e.target.value) || 0 })}
                fullWidth
                required
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Available Shifts
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {['Day (8 AM - 8 PM)', 'Night (8 PM - 8 AM)', '24-hour'].map(shift => (
                  <Chip
                    key={shift}
                    label={shift}
                    onClick={() => handleToggleShift(shift)}
                    color={formData.available_shifts.includes(shift) ? 'primary' : 'default'}
                    sx={{ mb: 1 }}
                  />
                ))}
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Services Provided
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  size="small"
                  value={serviceInput}
                  onChange={(e) => setServiceInput(e.target.value)}
                  placeholder="Add service"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddService()}
                  fullWidth
                />
                <Button onClick={handleAddService} variant="outlined">Add</Button>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {formData.services.map(service => (
                  <Chip
                    key={service}
                    label={service}
                    onDelete={() => handleRemoveService(service)}
                    sx={{ mb: 1 }}
                  />
                ))}
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Languages
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  size="small"
                  value={languageInput}
                  onChange={(e) => setLanguageInput(e.target.value)}
                  placeholder="Add language"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddLanguage()}
                  fullWidth
                />
                <Button onClick={handleAddLanguage} variant="outlined">Add</Button>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {formData.languages.map(language => (
                  <Chip
                    key={language}
                    label={language}
                    onDelete={() => handleRemoveLanguage(language)}
                    sx={{ mb: 1 }}
                  />
                ))}
              </Stack>
            </Box>

            <Box>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="nurse-image-upload"
                type="file"
                onChange={handleImageChange}
              />
              <label htmlFor="nurse-image-upload">
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
            <LocationPicker
              latitude={(formData as any).latitude}
              longitude={(formData as any).longitude}
              onLocationChange={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng } as any)}
              label="Location (for Nearest sort)"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={
              !formData.name ||
              !formData.qualification ||
              !formData.specialization ||
              formData.hourly_rate <= 0 ||
              formData.daily_rate <= 0 ||
              formData.services.length === 0 ||
              formData.languages.length === 0 ||
              formData.available_shifts.length === 0
            }
          >
            {editingNurse ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

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
