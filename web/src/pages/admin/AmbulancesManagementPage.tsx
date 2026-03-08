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
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
} from '@mui/icons-material';
import { ambulanceAPI, Ambulance, AmbulanceCreate } from '../../api/ambulanceApi';

const AMBULANCE_TYPES = [
  'BLS',
  'ALS',
  'Neonatal',
  'Air',
  'Patient Transport',
];

export default function AmbulancesManagementPage() {
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAmbulance, setEditingAmbulance] = useState<Ambulance | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  const [formData, setFormData] = useState<AmbulanceCreate>({
    name: '',
    description: '',
    features: [],
    estimated_time: '',
    base_price: 0,
    image: '🚑',
    ambulance_type: 'BLS',
  });

  const [featureInput, setFeatureInput] = useState('');

  useEffect(() => {
    fetchAmbulances();
  }, []);

  const fetchAmbulances = async () => {
    try {
      const data = await ambulanceAPI.getAmbulances(undefined, true); // Include inactive ambulances for admin
      setAmbulances(data);
    } catch (error: any) {
      showSnackbar('Failed to load ambulances', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenDialog = (ambulance?: Ambulance) => {
    if (ambulance) {
      setEditingAmbulance(ambulance);
      setFormData({
        name: ambulance.name,
        description: ambulance.description,
        features: ambulance.features,
        estimated_time: ambulance.estimated_time,
        base_price: ambulance.base_price,
        image: ambulance.image,
        ambulance_type: ambulance.ambulance_type,
      });
    } else {
      setEditingAmbulance(null);
      setFormData({
        name: '',
        description: '',
        features: [],
        estimated_time: '',
        base_price: 0,
        image: '🚑',
        ambulance_type: 'BLS',
      });
    }
    setFeatureInput('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAmbulance(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingAmbulance) {
        await ambulanceAPI.updateAmbulance(editingAmbulance.id, formData);
        showSnackbar('Ambulance updated successfully', 'success');
      } else {
        await ambulanceAPI.createAmbulance(formData);
        showSnackbar('Ambulance created successfully', 'success');
      }
      handleCloseDialog();
      fetchAmbulances();
    } catch (error: any) {
      showSnackbar(error.response?.data?.detail || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (ambulanceId: number) => {
    if (window.confirm('Are you sure you want to delete this ambulance?')) {
      try {
        await ambulanceAPI.deleteAmbulance(ambulanceId);
        showSnackbar('Ambulance deleted successfully', 'success');
        fetchAmbulances();
      } catch (error: any) {
        showSnackbar('Failed to delete ambulance', 'error');
      }
    }
  };

  const handleToggleStatus = async (ambulance: Ambulance) => {
    try {
      await ambulanceAPI.toggleAmbulanceStatus(ambulance.id, !ambulance.is_active);
      showSnackbar(`Ambulance ${!ambulance.is_active ? 'activated' : 'deactivated'}`, 'success');
      fetchAmbulances();
    } catch (error: any) {
      showSnackbar('Failed to update status', 'error');
    }
  };

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, featureInput.trim()],
      }));
      setFeatureInput('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  return (
    <Box>
      {/* Action Bar */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Ambulances Management ({ambulances.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Ambulance
        </Button>
      </Stack>

      {/* Ambulances Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width="50"><strong>Icon</strong></TableCell>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>Features</strong></TableCell>
              <TableCell><strong>Est. Time</strong></TableCell>
              <TableCell><strong>Base Price (₹)</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ambulances.map((ambulance) => (
              <TableRow key={ambulance.id} hover>
                <TableCell>
                  <Typography fontSize={32}>{ambulance.image}</Typography>
                </TableCell>
                <TableCell>
                  <Typography fontWeight={600}>{ambulance.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {ambulance.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={ambulance.ambulance_type} size="small" color="primary" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{ambulance.features.length} features</Typography>
                </TableCell>
                <TableCell>{ambulance.estimated_time}</TableCell>
                <TableCell>₹{ambulance.base_price}</TableCell>
                <TableCell>
                  <Switch
                    checked={ambulance.is_active}
                    onChange={() => handleToggleStatus(ambulance)}
                    color="success"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(ambulance)}
                    color="primary"
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(ambulance.id)}
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
        <DialogTitle>{editingAmbulance ? 'Edit Ambulance' : 'Add Ambulance'}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {/* Name */}
            <TextField
              label="Ambulance Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />

            {/* Description */}
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
              required
            />

            {/* Type and Image */}
            <Stack direction="row" spacing={2}>
              <TextField
                label="Type"
                value={formData.ambulance_type}
                onChange={(e) => setFormData({ ...formData, ambulance_type: e.target.value })}
                select
                SelectProps={{ native: true }}
                fullWidth
                required
              >
                {AMBULANCE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </TextField>
              <TextField
                label="Image/Emoji"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                fullWidth
                required
              />
            </Stack>

            {/* Features */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Features
              </Typography>
              <Stack direction="row" spacing={1} mb={1}>
                <TextField
                  placeholder="Add feature (e.g., Oxygen supply)"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                  size="small"
                  fullWidth
                />
                <Button onClick={handleAddFeature} variant="outlined">
                  Add
                </Button>
              </Stack>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                {formData.features.map((feature, index) => (
                  <Chip
                    key={index}
                    label={feature}
                    onDelete={() => handleRemoveFeature(index)}
                    size="small"
                  />
                ))}
              </Stack>
            </Box>

            {/* Price and Time */}
            <Stack direction="row" spacing={2}>
              <TextField
                label="Base Price (₹)"
                type="number"
                value={formData.base_price}
                onChange={(e) => setFormData({ ...formData, base_price: parseInt(e.target.value) || 0 })}
                fullWidth
                required
              />
              <TextField
                label="Estimated Time"
                placeholder="e.g., 10-15 mins"
                value={formData.estimated_time}
                onChange={(e) => setFormData({ ...formData, estimated_time: e.target.value })}
                fullWidth
                required
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.name || !formData.description || formData.features.length === 0}
          >
            {editingAmbulance ? 'Update' : 'Create'}
          </Button>
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
