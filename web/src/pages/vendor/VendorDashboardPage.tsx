import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Select,
  MenuItem,
  IconButton,
  Menu,
  ListItemIcon,
  Divider,
  Avatar,
  Alert,
  CircularProgress,
  Collapse,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack
} from '@mui/material';
import {
  Logout as LogoutIcon,
  KeyboardArrowDown as ExpandIcon,
  KeyboardArrowUp as CollapseIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import {
  vendorAPI,
  VendorBooking,
  VendorProfile,
  VENDOR_STATUS_OPTIONS,
  ENTITY_LINKED_ROLES
} from '../../api/vendorApi';
import medEfixLogo from '../../assets/medEfix.png';

const DOCTOR_LIKE_ROLES = ['doctor', 'dentist'];
const CARE_ROLES = ['nurse', 'physiotherapist'];
const AMBULANCE_TYPES = ['BLS', 'ALS', 'Neonatal', 'Air'];
const GENDERS = ['Male', 'Female'];

const listToText = (value: any): string => (Array.isArray(value) ? value.join(', ') : '');
const textToList = (value: string): string[] =>
  value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

const STATUS_COLORS: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  pending: 'warning',
  confirmed: 'info',
  scheduled: 'info',
  in_progress: 'info',
  sample_collected: 'info',
  dispatched: 'info',
  preparing: 'info',
  out_for_delivery: 'info',
  completed: 'success',
  delivered: 'success',
  cancelled: 'error',
  rejected: 'error'
};

function BookingRow({
  booking,
  statusOptions,
  onStatusChange
}: {
  booking: VendorBooking;
  statusOptions: string[];
  onStatusChange: (id: number, status: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow hover>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <CollapseIcon /> : <ExpandIcon />}
          </IconButton>
        </TableCell>
        <TableCell>#{booking.id}</TableCell>
        <TableCell>{booking.patient_name}</TableCell>
        <TableCell>₹{booking.price}</TableCell>
        <TableCell>
          <Chip
            label={booking.status.replace(/_/g, ' ')}
            size="small"
            color={STATUS_COLORS[booking.status] || 'default'}
          />
        </TableCell>
        <TableCell>{new Date(booking.created_at).toLocaleString()}</TableCell>
        <TableCell>
          <Select
            size="small"
            value={booking.status}
            onChange={(e) => onStatusChange(booking.id, e.target.value)}
            sx={{ minWidth: 160 }}
          >
            {(statusOptions.includes(booking.status)
              ? statusOptions
              : [booking.status, ...statusOptions]
            ).map((s) => (
              <MenuItem key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </MenuItem>
            ))}
          </Select>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={7} sx={{ py: 0, borderBottom: open ? undefined : 'none' }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, px: 1, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {Object.entries(booking.details).map(([key, value]) => (
                <Box key={key}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                    {key.replace(/_/g, ' ')}
                  </Typography>
                  <Typography variant="body2">
                    {value === null || value === undefined || value === ''
                      ? '—'
                      : Array.isArray(value)
                        ? value.map((v) => (typeof v === 'object' ? `${v.medicine_name ?? ''} x${v.quantity ?? ''}` : v)).join(', ')
                        : String(value)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

const EMPTY_EDIT_FORM = {
  full_name: '',
  phone: '',
  name: '',
  specialty: '',
  qualification: '',
  experience: '',
  consultation_fee: '',
  address: '',
  available_days: '',
  available_slots: '',
  ambulance_type: 'BLS',
  base_price: '',
  estimated_time: '',
  description: '',
  features: '',
  specialization: '',
  hourly_rate: '',
  daily_rate: '',
  gender: 'Male',
  services: '',
  available_shifts: '',
  languages: ''
};

export default function VendorDashboardPage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<VendorBooking[]>([]);
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Edit profile dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);

  const statusOptions = VENDOR_STATUS_OPTIONS[user?.role] ?? [];
  const hasBusinessProfile = ENTITY_LINKED_ROLES.includes(user?.role);
  const isDoctorLike = DOCTOR_LIKE_ROLES.includes(user?.role);
  const isAmbulance = user?.role === 'ambulance';
  const isCareRole = CARE_ROLES.includes(user?.role);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [profileData, bookingsData] = await Promise.all([
        vendorAPI.getMyProfile(),
        vendorAPI.getMyBookings()
      ]);
      setProfile(profileData);
      setBookings(bookingsData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load your bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (bookingId: number, status: string) => {
    try {
      await vendorAPI.updateBookingStatus(bookingId, status);
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status } : b)));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update status');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const openEditDialog = async () => {
    setEditOpen(true);
    setEditError('');
    setEditForm({
      ...EMPTY_EDIT_FORM,
      full_name: user?.full_name || '',
      phone: user?.phone || ''
    });

    if (!hasBusinessProfile) return;

    setEditLoading(true);
    try {
      const businessProfile = await vendorAPI.getMyBusinessProfile();
      if (businessProfile) {
        setEditForm((prev) => ({
          ...prev,
          name: businessProfile.name ?? '',
          specialty: businessProfile.specialty ?? '',
          qualification: businessProfile.qualification ?? '',
          experience: businessProfile.experience?.toString() ?? '',
          consultation_fee: businessProfile.consultation_fee?.toString() ?? '',
          address: businessProfile.address ?? '',
          available_days: listToText(businessProfile.available_days),
          available_slots: listToText(businessProfile.available_slots),
          ambulance_type: businessProfile.ambulance_type ?? 'BLS',
          base_price: businessProfile.base_price?.toString() ?? '',
          estimated_time: businessProfile.estimated_time ?? '',
          description: businessProfile.description ?? '',
          features: listToText(businessProfile.features),
          specialization: businessProfile.specialization ?? '',
          hourly_rate: businessProfile.hourly_rate?.toString() ?? '',
          daily_rate: businessProfile.daily_rate?.toString() ?? '',
          gender: businessProfile.gender ?? 'Male',
          services: listToText(businessProfile.services),
          available_shifts: listToText(businessProfile.available_shifts),
          languages: listToText(businessProfile.languages)
        }));
      }
    } catch (err: any) {
      setEditError(err.response?.data?.detail || 'Failed to load your profile');
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditChange =
    (field: keyof typeof EMPTY_EDIT_FORM) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleEditSubmit = async () => {
    setEditSaving(true);
    setEditError('');
    try {
      await vendorAPI.updateMyAccount({
        full_name: editForm.full_name,
        phone: editForm.phone || undefined
      });

      if (hasBusinessProfile) {
        await vendorAPI.updateMyBusinessProfile({
          name: editForm.name || undefined,
          ...(isDoctorLike && {
            specialty: editForm.specialty,
            qualification: editForm.qualification,
            experience: Number(editForm.experience),
            consultation_fee: Number(editForm.consultation_fee),
            address: editForm.address,
            available_days: textToList(editForm.available_days),
            available_slots: textToList(editForm.available_slots)
          }),
          ...(isAmbulance && {
            ambulance_type: editForm.ambulance_type,
            base_price: Number(editForm.base_price),
            estimated_time: editForm.estimated_time,
            description: editForm.description,
            features: textToList(editForm.features)
          }),
          ...(isCareRole && {
            qualification: editForm.qualification,
            specialization: editForm.specialization,
            experience: Number(editForm.experience),
            hourly_rate: Number(editForm.hourly_rate),
            daily_rate: Number(editForm.daily_rate),
            gender: editForm.gender,
            services: textToList(editForm.services),
            available_shifts: textToList(editForm.available_shifts),
            languages: textToList(editForm.languages)
          })
        });
      }

      await Promise.all([refreshUser(), loadData()]);
      setEditOpen(false);
    } catch (err: any) {
      setEditError(err.response?.data?.detail || 'Failed to save your profile');
    } finally {
      setEditSaving(false);
    }
  };

  const roleLabel = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : 'Vendor';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FFA07A 0%, #FFE4B5 100%)'
      }}
    >
      <AppBar
        position="static"
        sx={{ background: 'linear-gradient(90deg, #FFA07A 0%, #FFD700 100%)', boxShadow: 2 }}
      >
        <Toolbar>
          <img src={medEfixLogo} alt="MedEfix Logo" style={{ height: 40, marginRight: 16 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {roleLabel} Dashboard
          </Typography>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0 }}>
            <Avatar sx={{ bgcolor: 'secondary.main' }}>
              {user?.email?.[0]?.toUpperCase() || 'V'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <MenuItem disabled>
              <Typography variant="body2">{user?.email}</Typography>
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                openEditDialog();
              }}
            >
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              Edit Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={4} sx={{ p: 3, borderRadius: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              My Appointments & Bookings
            </Typography>
            <Button
              size="small"
              startIcon={<EditIcon fontSize="small" />}
              onClick={openEditDialog}
              sx={{ flexShrink: 0 }}
            >
              Edit Profile
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Logged in as {profile?.entity_name || user?.full_name} ({roleLabel})
            {' — '}you can only see bookings assigned to you.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : bookings.length === 0 ? (
            <Alert severity="info">No bookings yet.</Alert>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell />
                    <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Patient</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Booked At</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Update Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookings.map((booking) => (
                    <BookingRow
                      key={booking.id}
                      booking={booking}
                      statusOptions={statusOptions}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Container>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent dividers>
          {editLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <Stack spacing={2}>
              {editError && <Alert severity="error">{editError}</Alert>}

              <Typography variant="subtitle2" color="text.secondary">
                Account
              </Typography>
              <TextField
                label="Full Name"
                fullWidth
                required
                value={editForm.full_name}
                onChange={handleEditChange('full_name')}
              />
              <TextField
                label="Phone"
                fullWidth
                value={editForm.phone}
                onChange={handleEditChange('phone')}
              />

              {hasBusinessProfile && (
                <>
                  <Divider />
                  <Typography variant="subtitle2" color="text.secondary">
                    Business Profile
                  </Typography>
                  <TextField
                    label={isAmbulance ? 'Service Name' : 'Business / Clinic Name'}
                    fullWidth
                    value={editForm.name}
                    onChange={handleEditChange('name')}
                  />

                  {isDoctorLike && (
                    <>
                      <TextField
                        label="Specialty"
                        fullWidth
                        value={editForm.specialty}
                        onChange={handleEditChange('specialty')}
                      />
                      <TextField
                        label="Qualification"
                        fullWidth
                        value={editForm.qualification}
                        onChange={handleEditChange('qualification')}
                      />
                      <TextField
                        label="Experience (years)"
                        type="number"
                        fullWidth
                        inputProps={{ min: 0 }}
                        value={editForm.experience}
                        onChange={handleEditChange('experience')}
                      />
                      <TextField
                        label="Consultation Fee (₹)"
                        type="number"
                        fullWidth
                        inputProps={{ min: 0 }}
                        value={editForm.consultation_fee}
                        onChange={handleEditChange('consultation_fee')}
                      />
                      <TextField
                        label="Clinic / Practice Address"
                        fullWidth
                        value={editForm.address}
                        onChange={handleEditChange('address')}
                      />
                      <TextField
                        label="Available Days"
                        fullWidth
                        helperText="Comma-separated, e.g. Monday, Wednesday, Friday"
                        value={editForm.available_days}
                        onChange={handleEditChange('available_days')}
                      />
                      <TextField
                        label="Available Slots"
                        fullWidth
                        helperText="Comma-separated, e.g. 10:00 AM, 11:00 AM"
                        value={editForm.available_slots}
                        onChange={handleEditChange('available_slots')}
                      />
                    </>
                  )}

                  {isAmbulance && (
                    <>
                      <TextField
                        label="Ambulance Type"
                        select
                        fullWidth
                        value={editForm.ambulance_type}
                        onChange={handleEditChange('ambulance_type')}
                      >
                        {AMBULANCE_TYPES.map((t) => (
                          <MenuItem key={t} value={t}>
                            {t}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        label="Base Price (₹)"
                        type="number"
                        fullWidth
                        inputProps={{ min: 0 }}
                        value={editForm.base_price}
                        onChange={handleEditChange('base_price')}
                      />
                      <TextField
                        label="Estimated Response Time"
                        placeholder="e.g. 10-15 mins"
                        fullWidth
                        value={editForm.estimated_time}
                        onChange={handleEditChange('estimated_time')}
                      />
                      <TextField
                        label="Description"
                        fullWidth
                        multiline
                        rows={2}
                        value={editForm.description}
                        onChange={handleEditChange('description')}
                      />
                      <TextField
                        label="Features"
                        fullWidth
                        helperText="Comma-separated, e.g. Oxygen supply, First aid kit"
                        value={editForm.features}
                        onChange={handleEditChange('features')}
                      />
                    </>
                  )}

                  {isCareRole && (
                    <>
                      <TextField
                        label="Qualification"
                        fullWidth
                        value={editForm.qualification}
                        onChange={handleEditChange('qualification')}
                      />
                      <TextField
                        label="Specialization"
                        fullWidth
                        value={editForm.specialization}
                        onChange={handleEditChange('specialization')}
                      />
                      <TextField
                        label="Experience (years)"
                        type="number"
                        fullWidth
                        inputProps={{ min: 0 }}
                        value={editForm.experience}
                        onChange={handleEditChange('experience')}
                      />
                      <TextField
                        label="Hourly Rate (₹)"
                        type="number"
                        fullWidth
                        inputProps={{ min: 0 }}
                        value={editForm.hourly_rate}
                        onChange={handleEditChange('hourly_rate')}
                      />
                      <TextField
                        label="Daily Rate (₹)"
                        type="number"
                        fullWidth
                        inputProps={{ min: 0 }}
                        value={editForm.daily_rate}
                        onChange={handleEditChange('daily_rate')}
                      />
                      <TextField
                        label="Gender"
                        select
                        fullWidth
                        value={editForm.gender}
                        onChange={handleEditChange('gender')}
                      >
                        {GENDERS.map((g) => (
                          <MenuItem key={g} value={g}>
                            {g}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        label="Services"
                        fullWidth
                        helperText="Comma-separated, e.g. Wound care, IV administration"
                        value={editForm.services}
                        onChange={handleEditChange('services')}
                      />
                      <TextField
                        label="Available Shifts"
                        fullWidth
                        helperText="Comma-separated, e.g. Day, Night"
                        value={editForm.available_shifts}
                        onChange={handleEditChange('available_shifts')}
                      />
                      <TextField
                        label="Languages"
                        fullWidth
                        helperText="Comma-separated, e.g. English, Hindi"
                        value={editForm.languages}
                        onChange={handleEditChange('languages')}
                      />
                    </>
                  )}
                </>
              )}

              {!hasBusinessProfile && (
                <Alert severity="info">
                  {roleLabel} accounts don't have a separate business profile to edit.
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleEditSubmit}
            disabled={editSaving || editLoading || !editForm.full_name}
          >
            {editSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
