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
  LocalHospital as DentistIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 240;

const serviceItems = [
  { text: 'Users', icon: <UsersIcon />, path: '/admin/users' },
  { text: 'Doctors', icon: <DoctorsIcon />, path: '/admin/doctors' },
  { text: 'Dentists', icon: <DentistIcon />, path: '/admin/dentists' },
  { text: 'Lab Tests', icon: <LabTestIcon />, path: '/admin/lab-tests' },
  { text: 'Ambulances', icon: <AmbulanceIcon />, path: '/admin/ambulances' },
  { text: 'Nurses', icon: <NurseIcon />, path: '/admin/nurses' },
  { text: 'Physiotherapists', icon: <PhysiotherapistIcon />, path: '/admin/physiotherapists' },
  { text: 'Pharmacy', icon: <PharmacyIcon />, path: '/admin/pharmacy' }
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
  const isServicePath = location.pathname.match(/\/(users|doctors|dentists|lab-tests|ambulances|nurses|physiotherapists|pharmacy)$/);
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
          '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
          display: 'flex',
          justifyContent: 'center'
        }}
        onClick={() => navigate('/admin')}
      >
        <img 
          src={medEfixLogo} 
          alt="Medifix Logo" 
          style={{ height: '50px', width: 'auto' }}
        />
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.3)' }} />
      <List>
        <ListItem disablePadding>
          <ListItemButton
            selected={location.pathname === '/admin'}
            onClick={() => navigate('/admin')}
            sx={{
              bgcolor: location.pathname === '/admin' ? 'rgba(255,255,255,0.3)' : 'transparent',
              '&:hover': {
                bgcolor: location.pathname === '/admin' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)'
              },
              '&.Mui-selected': {
                bgcolor: 'rgba(255,255,255,0.3)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.4)'
                }
              }
            }}
          >
            <ListItemIcon>
              <HomeIcon sx={{ color: location.pathname === '/admin' ? '#fff' : 'rgba(0,0,0,0.7)' }} />
            </ListItemIcon>
            <ListItemText 
              primary="Dashboard Home" 
              sx={{ 
                '& .MuiTypography-root': { 
                  fontWeight: location.pathname === '/admin' ? 700 : 500,
                  color: location.pathname === '/admin' ? '#fff' : 'rgba(0,0,0,0.8)'
                } 
              }}
            />
          </ListItemButton>
        </ListItem>
      </List>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.3)' }} />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.2)'
                },
                '&.Mui-selected': {
                  bgcolor: 'rgba(255,255,255,0.3)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.4)'
                  }
                }
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? '#fff' : 'rgba(0,0,0,0.7)' }}>{item.icon}</ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{
                  '& .MuiTypography-root': {
                    fontWeight: location.pathname === item.path ? 600 : 500,
                    color: location.pathname === item.path ? '#fff' : 'rgba(0,0,0,0.8)'
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
      background: 'linear-gradient(135deg, #FFA07A 0%, #FFE4B5 100%)'
    }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          background: 'linear-gradient(90deg, #FFA07A 0%, #FFD700 100%)',
          boxShadow: 2
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
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Management Dashboard
          </Typography>
          <IconButton onClick={handleMenuClick} sx={{ p: 0 }}>
            <Avatar sx={{ bgcolor: 'secondary.main' }}>
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
              background: 'linear-gradient(180deg, #FFA07A 0%, #FFE4B5 100%)'
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
              background: 'linear-gradient(180deg, #FFA07A 0%, #FFE4B5 100%)',
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
