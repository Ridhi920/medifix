import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
  Alert,
  Snackbar,
  MenuItem,
} from '@mui/material';
import {
  Edit,
  Delete,
} from '@mui/icons-material';
import { userAPI, User } from '../../api/userApi';
import { VENDOR_ROLES } from '../../api/vendorApi';

const USER_ROLES = ['user', 'admin', ...VENDOR_ROLES.map((r) => r.value)];
const VENDOR_ROLE_VALUES = VENDOR_ROLES.map((r) => r.value);

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    role: 'user',
  });

  // Calculate statistics
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.is_active).length;
  const adminUsers = users.filter(u => u.role === 'admin').length;
  const regularUsers = users.filter(u => u.role === 'user').length;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await userAPI.getUsers(true); // Include inactive users
      setUsers(data);
    } catch (error: any) {
      showSnackbar('Failed to load users', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name,
      phone: user.phone || '',
      role: user.role,
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
  };

  const handleSubmit = async () => {
    if (!editingUser) return;

    try {
      await userAPI.updateUser(editingUser.id, formData);
      showSnackbar('User updated successfully', 'success');
      handleCloseDialog();
      fetchUsers();
    } catch (error: any) {
      showSnackbar(error.response?.data?.detail || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userAPI.deleteUser(userId);
        showSnackbar('User deleted successfully', 'success');
        fetchUsers();
      } catch (error: any) {
        showSnackbar(error.response?.data?.detail || 'Failed to delete user', 'error');
      }
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await userAPI.toggleUserStatus(user.id);
      showSnackbar(`User ${!user.is_active ? 'activated' : 'deactivated'}`, 'success');
      fetchUsers();
    } catch (error: any) {
      showSnackbar(error.response?.data?.detail || 'Failed to update status', 'error');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Box>
      {/* Header */}
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Users Management
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                Total Users
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {totalUsers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                Active Users
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                {activeUsers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                Admin Users
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                {adminUsers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                Regular Users
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {regularUsers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>ID</strong></TableCell>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Phone</strong></TableCell>
              <TableCell><strong>Role</strong></TableCell>
              <TableCell><strong>Joined</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>#{user.id}</TableCell>
                <TableCell>
                  <Typography fontWeight={600}>{user.full_name}</Typography>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phone || '-'}</TableCell>
                <TableCell>
                  <Chip
                    label={user.role}
                    size="small"
                    color={
                      user.role === 'admin'
                        ? 'error'
                        : VENDOR_ROLE_VALUES.includes(user.role)
                          ? 'primary'
                          : 'default'
                    }
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{formatDate(user.created_at)}</TableCell>
                <TableCell>
                  <Switch
                    checked={user.is_active}
                    onChange={() => handleToggleStatus(user)}
                    color="success"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(user)}
                    color="primary"
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(user.id)}
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

      {/* Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {/* Email (read-only) */}
            <TextField
              label="Email"
              value={editingUser?.email || ''}
              fullWidth
              disabled
              helperText="Email cannot be changed"
            />

            {/* Full Name */}
            <TextField
              label="Full Name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              fullWidth
              required
            />

            {/* Phone */}
            <TextField
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              fullWidth
            />

            {/* Role */}
            <TextField
              label="Role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              select
              fullWidth
              required
            >
              {USER_ROLES.map((role) => (
                <MenuItem key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </MenuItem>
              ))}
            </TextField>

            {formData.role === 'admin' && (
              <Alert severity="warning">
                Admin users have full access to the admin dashboard and can manage all data.
              </Alert>
            )}

            {VENDOR_ROLE_VALUES.includes(formData.role) && (
              <Alert severity="info">
                This makes the account a {formData.role} vendor: web-portal login only, and
                they only see their own bookings. Link it to a {formData.role} profile from
                the Vendor Approvals page so the right bookings show up.
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.full_name}
          >
            Update
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
