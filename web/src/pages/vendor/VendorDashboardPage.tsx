import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  Tabs,
  Tab,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Avatar,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Logout as LogoutIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import {
  vendorAPI,
  VendorBooking,
  VendorProfile,
  VENDOR_STATUS_OPTIONS,
} from '../../api/vendorApi';
import medEfixLogo from '../../assets/medEfix.png';
import OverviewTab from './tabs/OverviewTab';
import AppointmentsTab from './tabs/AppointmentsTab';
import PatientsTab from './tabs/PatientsTab';
import ReportsTab from './tabs/ReportsTab';
import ScanShareTab from './tabs/ScanShareTab';
import BillingTab from './tabs/BillingTab';
import ProfileTab from './tabs/ProfileTab';
import InventoryTab from './tabs/InventoryTab';
import FleetTab from './tabs/FleetTab';

const BOOKINGS_LABEL: Record<string, string> = {
  doctor: 'Appointments',
  dentist: 'Appointments',
  lab: 'Bookings',
  pharmacy: 'Orders',
  ambulance: 'Trips',
  nurse: 'Bookings',
  physiotherapist: 'Bookings',
};

export default function VendorDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role: string = user?.role ?? '';

  const [tab, setTab] = useState(0);
  const [bookings, setBookings] = useState<VendorBooking[]>([]);
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [logo, setLogo] = useState<string | null>(null);

  const loadBookings = async () => {
    try {
      const [profileData, bookingsData] = await Promise.all([
        vendorAPI.getMyProfile(),
        vendorAPI.getMyBookings(),
      ]);
      setProfile(profileData);
      setLogo(profileData.logo ?? null);
      setBookings(bookingsData);
      setError('');
    } catch {
      setError('Failed to load your workspace.');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStatusChange = async (bookingId: number, status: string) => {
    try {
      await vendorAPI.updateBookingStatus(bookingId, status);
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status } : b)));
    } catch {
      setError('Failed to update status.');
      loadBookings();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const statusOptions = VENDOR_STATUS_OPTIONS[role] ?? [];
  const bookingsLabel = BOOKINGS_LABEL[role] ?? 'Bookings';

  const isPharmacy = role === 'pharmacy';
  const isAmbulance = role === 'ambulance';

  // Tab set. Clinical/entity roles get the full clinical workspace. Roles that
  // supply rather than treat swap the clinical tabs (per-patient notes,
  // reports, scan & share, billing) for the thing they actually manage: a
  // pharmacy stocks a shelf, an ambulance operator runs a fleet.
  const commonTabs: { label: string; render: () => JSX.Element }[] = [
    { label: 'Overview', render: () => <OverviewTab bookings={bookings} role={role} /> },
    {
      label: bookingsLabel,
      render: () => (
        <AppointmentsTab bookings={bookings} role={role} statusOptions={statusOptions} onStatusChange={handleStatusChange} />
      ),
    },
  ];

  const profileTab = {
    label: 'Profile',
    render: () => <ProfileTab initialLogo={logo} onLogoUpdated={setLogo} />,
  };

  const supplierTabs: { label: string; render: () => JSX.Element }[] | null = isPharmacy
    ? [
        { label: 'Inventory', render: () => <InventoryTab storeName={profile?.entity_name} /> },
        { label: 'Customers', render: () => <PatientsTab /> },
      ]
    : isAmbulance
      ? [
          { label: 'Fleet', render: () => <FleetTab operatorName={profile?.entity_name} /> },
          { label: 'Patients', render: () => <PatientsTab /> },
        ]
      : null;

  const tabs: { label: string; render: () => JSX.Element }[] = supplierTabs
    ? [...commonTabs, ...supplierTabs, profileTab]
    : [
        ...commonTabs,
        { label: 'Patients', render: () => <PatientsTab /> },
        { label: 'Reports', render: () => <ReportsTab /> },
        { label: 'Scan & Share', render: () => <ScanShareTab /> },
        { label: 'Billing', render: () => <BillingTab /> },
        profileTab,
      ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f1f5f9', position: 'relative' }}>
      {/* Faint MedEfix background watermark (app-style) */}
      <Box
        aria-hidden
        sx={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <img
          src={medEfixLogo}
          alt=""
          style={{ width: 460, maxWidth: '55%', opacity: 0.05, filter: 'blur(1px)' }}
        />
      </Box>
      <AppBar position="static" sx={{ bgcolor: '#fff', color: 'text.primary', boxShadow: 'none', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar sx={{ px: { xs: 2, sm: 4 }, py: 1.5, minHeight: { sm: 84 } }}>
          {/* Vendor's own logo — prominent (upload lives in the Profile tab) */}
          <Avatar
            src={logo || undefined}
            variant="rounded"
            sx={{
              width: 68,
              height: 68,
              fontSize: 28,
              fontWeight: 700,
              borderRadius: 2,
              p: logo ? 0.75 : 0,
              bgcolor: logo ? '#fff' : 'primary.main',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 1px 4px rgba(15,23,42,0.08)',
            }}
            imgProps={{ style: { objectFit: 'contain' } }}
          >
            {(profile?.entity_name || user?.full_name || 'V').charAt(0).toUpperCase()}
          </Avatar>

          <Box sx={{ ml: 2.5, flexGrow: 1 }}>
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.1 }}>
              {profile?.entity_name || user?.full_name || 'My Workspace'}
            </Typography>
            <Chip size="small" label={role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Vendor'} sx={{ height: 18, fontSize: 11 }} />
          </Box>
          <IconButton onClick={loadBookings} title="Refresh">
            <RefreshIcon />
          </IconButton>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0, ml: 1 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>{user?.email?.[0]?.toUpperCase() || 'V'}</Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem disabled>
              <Typography variant="body2">{user?.email}</Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ px: { xs: 1, sm: 3 }, borderTop: '1px solid', borderColor: 'divider' }}>
          {tabs.map((t) => (
            <Tab key={t.label} label={t.label} sx={{ textTransform: 'none', fontWeight: 600 }} />
          ))}
        </Tabs>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3, position: 'relative', zIndex: 1 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        ) : (
          tabs[tab].render()
        )}
      </Container>
    </Box>
  );
}
