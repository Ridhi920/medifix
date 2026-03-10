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
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
} from '@mui/icons-material';
import { pharmacyAPI, Medicine, MedicineCreate } from '../../api/pharmacyApi';

export default function PharmacyManagementPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  const [formData, setFormData] = useState<MedicineCreate>({
    name: '',
    generic_name: '',
    manufacturer: '',
    category: '',
    price: 0,
    stock: 0,
    requires_prescription: false,
    description: '',
    dosage_form: '',
    strength: '',
    image: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const data = await pharmacyAPI.getMedicines(undefined, undefined, false);
      setMedicines(data);
    } catch (error: any) {
      showSnackbar('Failed to load medicines', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenDialog = (medicine?: Medicine) => {
    if (medicine) {
      setEditingMedicine(medicine);
      setFormData({
        name: medicine.name,
        generic_name: medicine.generic_name,
        manufacturer: medicine.manufacturer,
        category: medicine.category,
        price: medicine.price,
        stock: medicine.stock,
        requires_prescription: medicine.requires_prescription,
        description: medicine.description || '',
        dosage_form: medicine.dosage_form || '',
        strength: medicine.strength || '',
        image: medicine.image || '',
      });
      setImagePreview(medicine.image || '');
      setImageFile(null);
    } else {
      setEditingMedicine(null);
      setFormData({
        name: '',
        generic_name: '',
        manufacturer: '',
        category: '',
        price: 0,
        stock: 0,
        requires_prescription: false,
        description: '',
        dosage_form: '',
        strength: '',
        image: '',
      });
      setImagePreview('');
      setImageFile(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingMedicine(null);
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
      if (editingMedicine) {
        await pharmacyAPI.updateMedicine(editingMedicine.id, formData);
        showSnackbar('Medicine updated successfully', 'success');
      } else {
        await pharmacyAPI.createMedicine(formData);
        showSnackbar('Medicine created successfully', 'success');
      }
      handleCloseDialog();
      fetchMedicines();
    } catch (error: any) {
      showSnackbar(error.response?.data?.detail || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (medicineId: number) => {
    if (window.confirm('Are you sure you want to delete this medicine?')) {
      try {
        await pharmacyAPI.deleteMedicine(medicineId);
        showSnackbar('Medicine deleted successfully', 'success');
        fetchMedicines();
      } catch (error: any) {
        showSnackbar('Failed to delete medicine', 'error');
      }
    }
  };

  const handleToggleStatus = async (medicine: Medicine) => {
    try {
      await pharmacyAPI.toggleMedicineStatus(medicine.id, !medicine.is_active);
      showSnackbar(`Medicine ${!medicine.is_active ? 'activated' : 'deactivated'}`, 'success');
      fetchMedicines();
    } catch (error: any) {
      showSnackbar('Failed to update status', 'error');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Pharmacy Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Medicine
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ overflow: 'auto' }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow>
              <TableCell>Icon</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Generic Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Manufacturer</TableCell>
              <TableCell>Strength</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Prescription</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {medicines.map((medicine) => (
              <TableRow key={medicine.id}>
                <TableCell>
                  {medicine.image && (medicine.image.startsWith('data:') || medicine.image.startsWith('http')) ? (
                    <img 
                      src={medicine.image} 
                      alt={medicine.name}
                      style={{ width: 40, height: 40, borderRadius: '8px', objectFit: 'cover' }}
                    />
                  ) : (
                    <Typography fontSize={32}>{medicine.image || '💊'}</Typography>
                  )}
                </TableCell>
                <TableCell>{medicine.name}</TableCell>
                <TableCell>{medicine.generic_name}</TableCell>
                <TableCell>
                  <Chip label={medicine.category} size="small" color="primary" />
                </TableCell>
                <TableCell>{medicine.manufacturer}</TableCell>
                <TableCell>{medicine.strength || '-'}</TableCell>
                <TableCell>₹{medicine.price}</TableCell>
                <TableCell>
                  <Chip 
                    label={medicine.stock} 
                    size="small" 
                    color={medicine.stock > 10 ? 'success' : medicine.stock > 0 ? 'warning' : 'error'}
                  />
                </TableCell>
                <TableCell>
                  {medicine.requires_prescription ? (
                    <Chip label="Required" size="small" color="warning" />
                  ) : (
                    <Chip label="Not Required" size="small" color="default" />
                  )}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={medicine.is_active}
                    onChange={() => handleToggleStatus(medicine)}
                    color="primary"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    onClick={() => handleOpenDialog(medicine)}
                    color="primary"
                    size="small"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(medicine.id)}
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
          {editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Medicine Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            
            <TextField
              label="Generic Name"
              value={formData.generic_name}
              onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
              fullWidth
              required
            />

            <TextField
              label="Manufacturer"
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              fullWidth
              required
            />

            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                label="Category"
              >
                {['Pain Relief', 'Antibiotics', 'Vitamins', 'First Aid', 'Diabetes', 'Cardiac', 'Respiratory', 'Gastrointestinal', 'Others'].map(cat => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Dosage Form</InputLabel>
                <Select
                  value={formData.dosage_form || ''}
                  onChange={(e) => setFormData({ ...formData, dosage_form: e.target.value })}
                  label="Dosage Form"
                >
                  {['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Cream', 'Drops', 'Others'].map(form => (
                    <MenuItem key={form} value={form}>{form}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Strength"
                value={formData.strength || ''}
                onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                fullWidth
                placeholder="e.g., 500mg, 10ml"
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Price (₹)"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                fullWidth
                required
              />
              <TextField
                label="Stock Quantity"
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                fullWidth
                required
              />
            </Box>

            <TextField
              label="Description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />

            <TextField
              label="Image (Emoji or leave empty to upload)"
              value={formData.image || ''}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              fullWidth
              placeholder="💊"
              helperText="Enter emoji or use the upload button below (optional)"
            />

            <Box>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="medicine-image-upload"
                type="file"
                onChange={handleImageChange}
              />
              <label htmlFor="medicine-image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<Add />}
                >
                  Upload Photo (Optional)
                </Button>
              </label>
              {imagePreview && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" display="block" gutterBottom>
                    Preview:
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

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.requires_prescription}
                  onChange={(e) => setFormData({ ...formData, requires_prescription: e.target.checked })}
                />
              }
              label="Requires Prescription"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingMedicine ? 'Update' : 'Create'}
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
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
