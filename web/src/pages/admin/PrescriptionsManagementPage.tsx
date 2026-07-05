import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
  Alert,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Download,
  Edit,
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

interface Prescription {
  id: number;
  user_id: number | null;
  image_data: string;
  status: 'pending' | 'reviewed' | 'rejected';
  admin_notes: string | null;
  created_at: string;
}

export default function PrescriptionsManagementPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [statusUpdate, setStatusUpdate] = useState('');
  const [notesUpdate, setNotesUpdate] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'reviewed' | 'rejected'>('all');

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_BASE_URL}/pharmacy/prescriptions/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPrescriptions(response.data);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Failed to fetch prescriptions',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setStatusUpdate(prescription.status);
    setNotesUpdate(prescription.admin_notes || '');
    setOpenDialog(true);
  };

  const handleOpenPreview = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setOpenPreviewDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPrescription(null);
    setStatusUpdate('');
    setNotesUpdate('');
  };

  const handleClosePreview = () => {
    setOpenPreviewDialog(false);
    setSelectedPrescription(null);
  };

  const handleUpdatePrescription = async () => {
    if (!selectedPrescription) return;

    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(
        `${API_BASE_URL}/pharmacy/prescriptions/${selectedPrescription.id}/status`,
        {
          status: statusUpdate,
          admin_notes: notesUpdate,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSnackbar({
        open: true,
        message: 'Prescription updated successfully',
        severity: 'success',
      });

      handleCloseDialog();
      fetchPrescriptions();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Failed to update prescription',
        severity: 'error',
      });
    }
  };

  const handleDownloadPrescription = (prescription: Prescription) => {
    try {
      const link = document.createElement('a');
      link.href = prescription.image_data;
      link.download = `prescription-${prescription.id}.jpg`;
      link.click();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to download prescription',
        severity: 'error',
      });
    }
  };

  const filteredPrescriptions = filterStatus === 'all'
    ? prescriptions
    : prescriptions.filter(p => p.status === filterStatus);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'reviewed':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const pendingCount = prescriptions.filter(p => p.status === 'pending').length;

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          Prescription Reviews
        </Typography>
        {pendingCount > 0 && (
          <Chip
            label={`${pendingCount} Pending Review`}
            color="warning"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        )}
      </Stack>

      {/* Filter Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            label="Filter by Status"
          >
            <MenuItem value="all">All Prescriptions</MenuItem>
            <MenuItem value="pending">Pending Review</MenuItem>
            <MenuItem value="reviewed">Reviewed</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredPrescriptions.length === 0 ? (
        <Alert severity="info">
          No prescriptions found
          {filterStatus !== 'all' && ` with status "${filterStatus}"`}
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {filteredPrescriptions.map((prescription) => (
            <Grid item xs={12} sm={6} md={4} key={prescription.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={prescription.image_data}
                  alt={`Prescription ${prescription.id}`}
                  onClick={() => handleOpenPreview(prescription)}
                  sx={{ cursor: 'pointer', objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Prescription #{prescription.id}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    User ID: {prescription.user_id || 'Unknown'}
                  </Typography>
                  <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1 }}>
                    {new Date(prescription.created_at).toLocaleDateString()} at{' '}
                    {new Date(prescription.created_at).toLocaleTimeString()}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={getStatusLabel(prescription.status)}
                      color={getStatusColor(prescription.status) as any}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                  {prescription.admin_notes && (
                    <Typography variant="caption" display="block" sx={{ mb: 1, fontStyle: 'italic' }}>
                      Notes: {prescription.admin_notes.substring(0, 50)}...
                    </Typography>
                  )}
                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Button
                      size="small"
                      startIcon={<Download />}
                      onClick={() => handleDownloadPrescription(prescription)}
                    >
                      Download
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => handleOpenDialog(prescription)}
                    >
                      Review
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={openPreviewDialog}
        onClose={handleClosePreview}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Prescription Preview</DialogTitle>
        <DialogContent>
          {selectedPrescription && (
            <Box
              component="img"
              src={selectedPrescription.image_data}
              alt="Prescription preview"
              sx={{ width: '100%', mt: 2, borderRadius: 1 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Review Prescription</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedPrescription && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Prescription ID: {selectedPrescription.id}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Submitted: {new Date(selectedPrescription.created_at).toLocaleString()}
                </Typography>
              </Box>

              <Box
                component="img"
                src={selectedPrescription.image_data}
                alt="Prescription"
                sx={{ width: '100%', borderRadius: 1, maxHeight: 300, objectFit: 'cover' }}
              />

              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusUpdate}
                  onChange={(e) => setStatusUpdate(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="reviewed">Reviewed</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Admin Notes"
                multiline
                rows={3}
                value={notesUpdate}
                onChange={(e) => setNotesUpdate(e.target.value)}
                placeholder="Add any notes or observations..."
                fullWidth
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleUpdatePrescription} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity as any} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
