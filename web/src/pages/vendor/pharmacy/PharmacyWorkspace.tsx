import { useMemo, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import {
  Box,
  CssBaseline,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Tooltip,
  Typography,
  Drawer,
  useMediaQuery,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  Dashboard as DashboardIcon,
  PointOfSale as PosIcon,
  ShoppingCart as PurchasesIcon,
  MedicalServices as MedicinesIcon,
  Warehouse as StockIcon,
  People as CustomersIcon,
  BarChart as ReportsIcon,
  Settings as SettingsIcon,
  LocalShipping as OrdersIcon,
  Brightness6 as ThemeToggleIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  LocalPharmacy as BrandIcon,
} from '@mui/icons-material';
import { theme as baseTheme } from '../../../theme';
import { useAuth } from '../../../context/AuthContext';
import medEfixLogo from '../../../assets/medEfix.png';
import DashboardPage from './DashboardPage';
import PosPage from './PosPage';
import PurchasesPage from './PurchasesPage';
import MedicinesPage from './MedicinesPage';
import StockPage from './StockPage';
import CustomersPage from './CustomersPage';
import ReportsPage from './ReportsPage';
import SettingsPage from './SettingsPage';
import OnlineOrdersPage from './OnlineOrdersPage';

const SIDEBAR_WIDTH = 248;
const THEME_KEY = 'medefix.pharmacy.theme';

// Deep teal for primary actions; the lighter teal marks the active nav item.
const BRAND = { main: '#00695C', dark: '#004D40', light: '#4DB6AC' };
const FOOTER = '#F0A42B';

const NAV = [
  { path: '', label: 'Dashboard', icon: <DashboardIcon /> },
  { path: 'pos', label: 'Sales (POS)', icon: <PosIcon /> },
  { path: 'purchases', label: 'Purchases', icon: <PurchasesIcon /> },
  { path: 'medicines', label: 'Medicines', icon: <MedicinesIcon /> },
  { path: 'stock', label: 'Stock & Batches', icon: <StockIcon /> },
  { path: 'customers', label: 'Customers', icon: <CustomersIcon /> },
  { path: 'orders', label: 'Online Orders', icon: <OrdersIcon /> },
  { path: 'reports', label: 'Reports', icon: <ReportsIcon /> },
  { path: 'settings', label: 'Settings', icon: <SettingsIcon /> },
];

function readMode(): 'light' | 'dark' {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function buildTheme(mode: 'light' | 'dark') {
  return createTheme(baseTheme, {
    palette: {
      mode,
      primary: { ...BRAND, contrastText: '#fff' },
      background: mode === 'dark' ? { default: '#0f1716', paper: '#16211f' } : { default: '#f7f8f8', paper: '#ffffff' },
      text: mode === 'dark' ? { primary: '#e6edec', secondary: '#9fb1ae' } : { primary: '#1f2937', secondary: '#6b7280' },
      divider: mode === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.10)',
    },
    shape: { borderRadius: 6 },
    typography: { fontFamily: '"Roboto", "Inter", system-ui, sans-serif' },
    components: {
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 6, fontWeight: 600 },
          contained: { boxShadow: '0 2px 6px rgba(0,105,92,0.30)' },
        },
      },
      MuiTextField: { styleOverrides: { root: { '& .MuiOutlinedInput-root': { borderRadius: 6 } } } },
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiCard: { styleOverrides: { root: { borderRadius: 8 } } },
      MuiTableCell: { styleOverrides: { head: { fontWeight: 500 } } },
    },
  });
}

export default function PharmacyWorkspace() {
  const [mode, setMode] = useState<'light' | 'dark'>(readMode);
  const theme = useMemo(() => buildTheme(mode), [mode]);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isNarrow = useMediaQuery(theme.breakpoints.down('md'));

  const toggleMode = () => {
    const next = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* per-viewer preference only */
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const sidebar = (
    <Box sx={{ width: SIDEBAR_WIDTH, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      <Box sx={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
        <BrandIcon sx={{ color: 'primary.main', fontSize: 30 }} />
        <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 0.2 }}>
          MedEfix Pharma
        </Typography>
      </Box>
      <List sx={{ px: 1, pt: 1 }}>
        {NAV.map((item) => (
          <ListItemButton
            key={item.path}
            component={NavLink}
            to={item.path}
            end={item.path === ''}
            onClick={() => setMobileOpen(false)}
            sx={{
              borderRadius: 1.5,
              mb: 0.75,
              py: 1.1,
              color: 'text.primary',
              '& .MuiListItemIcon-root': { color: 'text.secondary', minWidth: 44 },
              '&.active': {
                bgcolor: 'primary.light',
                color: '#fff',
                boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                '& .MuiListItemIcon-root': { color: '#fff' },
              },
              '&.active:hover': { bgcolor: 'primary.light' },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 16 }} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
        <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {isNarrow ? (
            <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)}>
              {sidebar}
            </Drawer>
          ) : (
            <Box sx={{ borderRight: 1, borderColor: 'divider', flexShrink: 0 }}>{sidebar}</Box>
          )}

          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
            {/* Faint repeating logo watermark behind the content */}
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                backgroundImage: `url(${medEfixLogo})`,
                backgroundRepeat: 'repeat',
                backgroundSize: '210px auto',
                opacity: mode === 'dark' ? 0.03 : 0.045,
                filter: 'grayscale(1)',
              }}
            />
            <Box
              sx={{
                height: 72,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                px: { xs: 2, md: 3 },
                borderBottom: 2,
                borderColor: 'divider',
                position: 'relative',
                bgcolor: 'background.paper',
              }}
            >
              {isNarrow && (
                <IconButton onClick={() => setMobileOpen(true)} sx={{ mr: 1 }} aria-label="Open menu">
                  <MenuIcon />
                </IconButton>
              )}
              <Box sx={{ flex: 1 }} />
              <Tooltip title={mode === 'light' ? 'Dark mode' : 'Light mode'}>
                <IconButton onClick={toggleMode} sx={{ color: 'text.primary' }} aria-label="Toggle dark mode">
                  <ThemeToggleIcon />
                </IconButton>
              </Tooltip>
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ ml: 1, p: 0.5 }} aria-label="Account">
                <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 15 }}>
                  {(user?.full_name || user?.email || 'P').charAt(0).toUpperCase()}
                </Avatar>
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
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto', position: 'relative', px: { xs: 2, md: 3 }, py: 3 }}>
              <Routes>
                <Route index element={<DashboardPage />} />
                <Route path="pos" element={<PosPage />} />
                <Route path="purchases" element={<PurchasesPage />} />
                <Route path="medicines" element={<MedicinesPage />} />
                <Route path="stock" element={<StockPage />} />
                <Route path="customers" element={<CustomersPage />} />
                <Route path="orders" element={<OnlineOrdersPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="" replace />} />
              </Routes>
            </Box>
          </Box>
        </Box>

        <Box sx={{ bgcolor: FOOTER, color: '#3b2a06', textAlign: 'center', py: 1, flexShrink: 0 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 500 }}>
            © {new Date().getFullYear()} MedEfix | All Rights Reserved
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
