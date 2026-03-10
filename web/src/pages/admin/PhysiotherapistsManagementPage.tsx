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
import { physiotherapistAPI, Physiotherapist, PhysiotherapistCreate } from '../../api/physiotherapistApi';

export default function PhysiotherapistsManagementPage() {
  const [physiotherapists, setPhysiotherapists] = useState<Physiotherapist[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPhysiotherapist, setEditingPhysiotherapist] = useState<Physiotherapist | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  const [formData, setFormData] = useState<PhysiotherapistCreate>({
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

  useEffect(() => {
    fetchPhysiotherapists();
  }, []);

  const fetchPhysiotherapists = async () => {
    try {
      const data = await physiotherapistAPI.getPhysiotherapists(undefined, true);
      setPhysiotherapists(data);
    } catch (error: any) {
      showSnackbar('Failed to load physiotherapists', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenDialog = (physiotherapist?: Physiotherapist) => {
    if (physiotherapist) {
      setEditingPhysiotherapist(physiotherapist);
      setFormData({
        name: physiotherapist.name,
        qualification: physiotherapist.qualification,
        specialization: physiotherapist.specialization,
        experience: physiotherapist.experience,
        rating: physiotherapist.rating,
        services: physiotherapist.services,
        hourly_rate: physiotherapist.hourly_rate,
        daily_rate: physiotherapist.daily_rate,
        available_shifts: physiotherapist.available_shifts,
        languages: physiotherapist.languages,
        image: physiotherapist.image,
        gender: physiotherapist.gender,
      });
    } else {
      setEditingPhysiotherapist(null);
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
    }
    setServiceInput('');
    setLanguageInput('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPhysiotherapist(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingPhysiotherapist) {
        await physiotherapistAPI.updatePhysiotherapist(editingPhysiotherapist.id, formData);
        showSnackbar('Physiotherapist updated successfully', 'success');
      } else {
        await physiotherapistAPI.createPhysiotherapist(formData);
        showSnackbar('Physiotherapist created successfully', 'success');
      }
      handleCloseDialog();
      fetchPhysiotherapists();
    } catch (error: any) {
      showSnackbar(error.response?.data?.detail || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (physiotherapistId: number) => {
    if (window.confirm('Are you sure you want to delete this physiotherapist?')) {
      try {
        await physiotherapistAPI.deletePhysiotherapist(physiotherapistId);
        showSnackbar('Physiotherapist deleted successfully', 'success');
        fetchPhysiotherapists();
      } catch (error: any) {
        showSnackbar('Failed to delete physiotherapist', 'error');
      }
    }
  };

  const handleToggleStatus = async (physiotherapist: Physiotherapist) => {
    try {
      await physiotherapistAPI.togglePhysiotherapistStatus(physiotherapist.id, !physiotherapist.is_active);
      showSnackbar(`Physiotherapist ${!physiotherapist.is_active ? 'activated' : 'deactivated'}`, 'success');
      fetchPhysiotherapists();
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
          Physiotherapists Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Physiotherapist
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Icon</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Qualification</TableCell>
              <TableCell>Specialization</TableCell>
              <TableCell>Experience</TableCell>
              <TableCell>Rating</TableCell>
              <TableCell>Session Rate</TableCell>
              <TableCell>Daily Rate</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {physiotherapists.map((physiotherapist) => (
              <TableRow key={physiotherapist.id}>
                <TableCell sx={{ fontSize: '2rem' }}>{physiotherapist.image}</TableCell>
                <TableCell>{physiotherapist.name}</TableCell>
                <TableCell>{physiotherapist.qualification}</TableCell>
                <TableCell>
                  <Chip label={physiotherapist.specialization} size="small" color="primary" />
                </TableCell>
                <TableCell>{physiotherapist.experience} years</TableCell>
                <TableCell>⭐ {physiotherapist.rating.toFixed(1)}</TableCell>
                <TableCell>₹{physiotherapist.hourly_rate}/session</TableCell>
                <TableCell>₹{physiotherapist.daily_rate}/day</TableCell>
                <TableCell>{physiotherapist.gender}</TableCell>
                <TableCell>
                  <Switch
                    checked={physiotherapist.is_active}
                    onChange={() => handleToggleStatus(physiotherapist)}
                    color="primary"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    onClick={() => handleOpenDialog(physiotherapist)}
                    color="primary"
                    size="small"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(physiotherapist.id)}
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
          {editingPhysiotherapist ? 'Edit Physiotherapist' : 'Add New Physiotherapist'}
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
              placeholder="e.g., BPT, MPT"
            />

            <FormControl fullWidth>
              <InputLabel>Specialization</InputLabel>
              <Select
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                label="Specialization"
              >
                {['Sports', 'Orthopedic', 'Neurological', 'Pediatric', 'Geriatric'].map(spec => (
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
                label="Session Rate (₹)"
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
                {['Morning (8 AM - 12 PM)', 'Afternoon (12 PM - 4 PM)', 'Evening (4 PM - 8 PM)'].map(shift => (
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

            <TextField
              label="Image (Emoji)"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              fullWidth
              placeholder="🧘"
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
            {editingPhysiotherapist ? 'Update' : 'Create'}
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
