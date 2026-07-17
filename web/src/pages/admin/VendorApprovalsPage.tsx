import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  CircularProgress,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Divider
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { vendorAPI, VendorUser, VendorProfileReview } from '../../api/vendorApi';

// Fields we don't show in the profile review (redundant with the account
// section, or internal bookkeeping the admin doesn't need to see).
const HIDDEN_PROFILE_FIELDS = new Set(['id', 'created_at', 'updated_at']);

const formatLabel = (key: string) =>
  key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const formatValue = (value: any): string => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
  return String(value);
};

export default function VendorApprovalsPage() {
  const [vendors, setVendors] = useState<VendorUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  // Review dialog state
  const [reviewing, setReviewing] = useState<VendorUser | null>(null);
  const [review, setReview] = useState<VendorProfileReview | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const loadVendors = async () => {
    try {
      setVendors(await vendorAPI.getVendors());
    } catch (err: any) {
      showSnackbar(err.response?.data?.detail || 'Failed to load vendor accounts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const handleApprove = async (vendor: VendorUser) => {
    try {
      await vendorAPI.approveVendor(vendor.id);
      showSnackbar('Vendor approved successfully', 'success');
      await loadVendors();
    } catch (err: any) {
      showSnackbar(err.response?.data?.detail || 'Failed to approve vendor', 'error');
    }
  };

  const handleReject = async (vendor: VendorUser) => {
    try {
      await vendorAPI.rejectVendor(vendor.id);
      showSnackbar('Vendor rejected', 'success');
      await loadVendors();
    } catch (err: any) {
      showSnackbar(err.response?.data?.detail || 'Failed to reject vendor', 'error');
    }
  };

  const handleView = async (vendor: VendorUser) => {
    setReviewing(vendor);
    setReview(null);
    setReviewLoading(true);
    try {
      setReview(await vendorAPI.getVendorProfile(vendor.id));
    } catch (err: any) {
      showSnackbar(err.response?.data?.detail || 'Failed to load vendor profile', 'error');
      setReviewing(null);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleDelete = async (vendor: VendorUser) => {
    if (!window.confirm(`Delete vendor account "${vendor.full_name}" (${vendor.email})?`)) return;
    try {
      await vendorAPI.deleteVendor(vendor.id);
      showSnackbar('Vendor deleted', 'success');
      await loadVendors();
    } catch (err: any) {
      showSnackbar(err.response?.data?.detail || 'Failed to delete vendor', 'error');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const filtered = vendors.filter((v) => v.approval_status === tab);
  const pendingCount = vendors.filter((v) => v.approval_status === 'pending').length;
  const approvedCount = vendors.filter((v) => v.approval_status === 'approved').length;
  const rejectedCount = vendors.filter((v) => v.approval_status === 'rejected').length;

  return (
    <Box>
      {/* Header */}
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Vendor Approvals
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                Total Vendors
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {vendors.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                Pending Approval
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                {pendingCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                Approved
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                {approvedCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                Rejected
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                {rejectedCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Vendors Table */}
      <TableContainer component={Paper}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab value="pending" label={`Pending (${pendingCount})`} />
          <Tab value="approved" label={`Approved (${approvedCount})`} />
          <Tab value="rejected" label={`Rejected (${rejectedCount})`} />
        </Tabs>

        {loading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : filtered.length === 0 ? (
          <Box p={4} textAlign="center">
            <Typography color="textSecondary">
              No {tab} vendor accounts.
            </Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Phone</strong></TableCell>
                <TableCell><strong>Role</strong></TableCell>
                <TableCell><strong>Profile</strong></TableCell>
                <TableCell><strong>Registered</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((vendor) => (
                <TableRow key={vendor.id} hover>
                  <TableCell>#{vendor.id}</TableCell>
                  <TableCell>
                    <Typography fontWeight={600}>{vendor.full_name}</Typography>
                  </TableCell>
                  <TableCell>{vendor.email}</TableCell>
                  <TableCell>{vendor.phone || '-'}</TableCell>
                  <TableCell>
                    <Chip label={vendor.role} size="small" color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    {vendor.vendor_id ? (
                      <Chip label={`#${vendor.vendor_id}`} size="small" variant="outlined" />
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>{formatDate(vendor.created_at)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="View profile">
                      <IconButton
                        size="small"
                        color="default"
                        onClick={() => handleView(vendor)}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {vendor.approval_status === 'approved' ? (
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(vendor)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <>
                        <Tooltip title="Approve">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleApprove(vendor)}
                          >
                            <ApproveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {vendor.approval_status !== 'rejected' && (
                          <Tooltip title="Reject">
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => handleReject(vendor)}
                            >
                              <RejectIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(vendor)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Profile Review Dialog */}
      <Dialog open={Boolean(reviewing)} onClose={() => setReviewing(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{reviewing?.full_name}'s Profile</DialogTitle>
        <DialogContent dividers>
          {reviewLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Account
                </Typography>
                <Stack spacing={0.75}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Full Name</Typography>
                    <Typography variant="body2" fontWeight={600}>{reviewing?.full_name}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography variant="body2">{reviewing?.email}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Phone</Typography>
                    <Typography variant="body2">{reviewing?.phone || '—'}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Role</Typography>
                    <Chip label={reviewing?.role} size="small" color="primary" variant="outlined" />
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Typography variant="body2">{reviewing?.approval_status}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Registered</Typography>
                    <Typography variant="body2">
                      {reviewing ? formatDate(reviewing.created_at) : ''}
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Business Profile
                </Typography>
                {review?.profile ? (
                  <Stack spacing={0.75}>
                    {Object.entries(review.profile)
                      .filter(([key]) => !HIDDEN_PROFILE_FIELDS.has(key))
                      .map(([key, value]) => (
                        <Box key={key} display="flex" justifyContent="space-between" gap={2}>
                          <Typography variant="body2" color="text.secondary">
                            {formatLabel(key)}
                          </Typography>
                          <Typography variant="body2" fontWeight={600} textAlign="right">
                            {formatValue(value)}
                          </Typography>
                        </Box>
                      ))}
                  </Stack>
                ) : (
                  <Alert severity="info">
                    {reviewing?.role} accounts don't have a separate business profile — they
                    manage all {reviewing?.role} bookings directly.
                  </Alert>
                )}
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewing(null)}>Close</Button>
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
