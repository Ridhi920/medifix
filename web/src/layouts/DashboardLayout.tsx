import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import medEfixLogo from '../assets/medEfix.png';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Menu as MenuIcon,
  People as UsersIcon,
  MedicalServices as DoctorsIcon,
  CalendarMonth as AppointmentsIcon,
  Science as LabIcon,
  Biotech as LabTestIcon,
  AirportShuttle as AmbulanceIcon,
  LocalShipping as AmbulanceBookingIcon,
  HealthAndSafety as NurseIcon,
  FitnessCenter as PhysiotherapistIcon,
  LocalPharmacy as PharmacyIcon,
  ShoppingCart as PharmacyOrderIcon,
  Description as PrescriptionIcon,
  Logout as LogoutIcon,
  Home as HomeIcon,
  LocalHospital as DentistIcon,
  Settings as SettingsIcon,
  ToggleOn as AvailabilityIcon,
  RateReview as ReviewIcon,
  Stars as WhyChooseIcon,
  HowToReg as VendorApprovalIcon,
  Timeline as TimelineIcon,
  AccountTree as ServiceRequestIcon,
  LocalHospital as InpatientIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 240;

const SIDEBAR_BG = '#0F172A';
const SIDEBAR_HOVER = 'rgba(255,255,255,0.08)';
const SIDEBAR_SELECTED = 'rgba(13,148,136,0.35)';
const SIDEBAR_SELECTED_HOVER = 'rgba(13,148,136,0.45)';
const SIDEBAR_TEXT = 'rgba(255,255,255,0.75)';

const serviceItems = [
  { text: 'Service Requests', icon: <ServiceRequestIcon />, path: '/admin/service-requests' },
  { text: 'Inpatients', icon: <InpatientIcon />, path: '/admin/inpatients' },
  { text: 'Digital Logbook', icon: <TimelineIcon />, path: '/admin/logbook' },
  { text: 'Users', icon: <UsersIcon />, path: '/admin/users' },
  { text: 'Vendor Approvals', icon: <VendorApprovalIcon />, path: '/admin/vendor-approvals' },
  { text: 'Doctors', icon: <DoctorsIcon />, path: '/admin/doctors' },
  { text: 'Dentists', icon: <DentistIcon />, path: '/admin/dentists' },
  { text: 'Lab Tests', icon: <LabTestIcon />, path: '/admin/lab-tests' },
  { text: 'Ambulances', icon: <AmbulanceIcon />, path: '/admin/ambulances' },
  { text: 'Nurses', icon: <NurseIcon />, path: '/admin/nurses' },
  { text: 'Physiotherapists', icon: <PhysiotherapistIcon />, path: '/admin/physiotherapists' },
  { text: 'Pharmacy', icon: <PharmacyIcon />, path: '/admin/pharmacy' },
  { text: 'Fee Settings', icon: <SettingsIcon />, path: '/admin/fee-settings' },
  { text: 'Service Availability', icon: <AvailabilityIcon />, path: '/admin/service-availability' },
  { text: 'User Reviews', icon: <ReviewIcon />, path: '/admin/reviews' },
  { text: 'Why Choose MedEfix', icon: <WhyChooseIcon />, path: '/admin/why-choose' }
];

const bookingItems = [
  { text: 'Appointments', icon: <AppointmentsIcon />, path: '/admin/appointments' },
  { text: 'Dentist Appointments', icon: <DentistIcon />, path: '/admin/dentist-appointments' },
  { text: 'Lab Bookings', icon: <LabIcon />, path: '/admin/lab-bookings' },
  { text: 'Ambulance Bookings', icon: <AmbulanceBookingIcon />, path: '/admin/ambulance-bookings' },
  { text: 'Nurse Bookings', icon: <NurseIcon />, path: '/admin/nurse-bookings' },
  { text: 'Physiotherapist Bookings', icon: <PhysiotherapistIcon />, path: '/admin/physiotherapist-bookings' },
  { text: 'Pharmacy Orders', icon: <PharmacyOrderIcon />, path: '/admin/pharmacy-orders' },
  { text: 'Prescriptions', icon: <PrescriptionIcon />, path: '/admin/prescriptions' }
];

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
    handleMenuClose();
  };

  // Determine which menu items to show based on current path
  const isServicePath = location.pathname.match(/\/(service-requests|inpatients|logbook|users|vendor-approvals|doctors|dentists|lab-tests|ambulances|nurses|physiotherapists|pharmacy|fee-settings|service-availability|reviews|why-choose)$/);
  const isBookingPath = location.pathname.match(/\/(appointments|dentist-appointments|lab-bookings|ambulance-bookings|nurse-bookings|physiotherapist-bookings|pharmacy-orders|prescriptions)$/);
  
  let menuItems = [];
  if (isServicePath) {
    menuItems = serviceItems;
  } else if (isBookingPath) {
    menuItems = bookingItems;
  } else {
    // Show all items if no specific category is detected
    menuItems = [...serviceItems, ...bookingItems];
  }

  const drawer = (
    <div>
      <Toolbar
        sx={{
          cursor: 'pointer',
          bgcolor: '#fff',
          '&:hover': { bgcolor: '#fff' },
          display: 'flex',
          justifyContent: 'center'
        }}
        onClick={() => navigate('/admin')}
      >
        <img
          src={medEfixLogo}
          alt="MedEfix Logo"
          style={{ height: '50px', width: 'auto' }}
        />
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
      <List>
        <ListItem disablePadding>
          <ListItemButton
            selected={location.pathname === '/admin'}
            onClick={() => navigate('/admin')}
            sx={{
              borderLeft: '3px solid transparent',
              bgcolor: location.pathname === '/admin' ? SIDEBAR_SELECTED : 'transparent',
              '&:hover': {
                bgcolor: location.pathname === '/admin' ? SIDEBAR_SELECTED_HOVER : SIDEBAR_HOVER
              },
              '&.Mui-selected': {
                borderLeft: '3px solid #2DD4BF',
                bgcolor: SIDEBAR_SELECTED,
                '&:hover': {
                  bgcolor: SIDEBAR_SELECTED_HOVER
                }
              }
            }}
          >
            <ListItemIcon>
              <HomeIcon sx={{ color: location.pathname === '/admin' ? '#fff' : SIDEBAR_TEXT }} />
            </ListItemIcon>
            <ListItemText
              primary="Dashboard Home"
              sx={{
                '& .MuiTypography-root': {
                  fontWeight: location.pathname === '/admin' ? 700 : 500,
                  color: location.pathname === '/admin' ? '#fff' : SIDEBAR_TEXT
                }
              }}
            />
          </ListItemButton>
        </ListItem>
      </List>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                borderLeft: '3px solid transparent',
                '&:hover': {
                  bgcolor: SIDEBAR_HOVER
                },
                '&.Mui-selected': {
                  borderLeft: '3px solid #2DD4BF',
                  bgcolor: SIDEBAR_SELECTED,
                  '&:hover': {
                    bgcolor: SIDEBAR_SELECTED_HOVER
                  }
                }
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? '#fff' : SIDEBAR_TEXT }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{
                  '& .MuiTypography-root': {
                    fontWeight: location.pathname === item.path ? 600 : 500,
                    color: location.pathname === item.path ? '#fff' : SIDEBAR_TEXT
                  }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{
      display: 'flex',
      minHeight: '100vh',
      bgcolor: 'background.default'
    }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: '#fff',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Management Dashboard
          </Typography>
          <IconButton onClick={handleMenuClick} sx={{ p: 0 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {user?.email?.[0]?.toUpperCase() || 'A'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
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
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: SIDEBAR_BG
            }
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: SIDEBAR_BG,
              borderRight: 'none'
            }
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh'
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
