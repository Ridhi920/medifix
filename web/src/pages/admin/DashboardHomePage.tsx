import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CardActionArea,
  Container,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  AddCircleOutline as AddIcon,
  BookmarkBorder as ManageIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

export default function DashboardHomePage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: 'background.default',
      py: 6
    }}>
      {/* Logout Button */}
      <Box sx={{ position: 'absolute', top: 20, right: 20 }}>
        <Tooltip title="Logout">
          <IconButton
            onClick={handleLogout}
            sx={{
              bgcolor: 'white',
              boxShadow: 3,
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.9)',
                boxShadow: 4
              }
            }}
          >
            <LogoutIcon sx={{ color: 'primary.main' }} />
          </IconButton>
        </Tooltip>
      </Box>

      <Container maxWidth="lg">
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 3 }}>
            {/* <img
              src={medEfixLogo}
              alt="MedEfix Logo"
              style={{ height: '140px', width: 'auto' }}
            /> */}
          </Box>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              color: 'text.primary'
            }}
          >
            Admin Dashboard
          </Typography>
        </Box>

        {/* Main Navigation Cards */}
        <Grid container spacing={4} justifyContent="center">
          {/* Add/Manage Services Card */}
          <Grid item xs={12} md={5}>
            <Card 
              elevation={3}
              sx={{ 
                height: '300px',
                background: 'linear-gradient(135deg, #0D9488 0%, #0F172A 100%)',
                color: 'white',
                cursor: 'pointer',
                transition: 'transform 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 6
                }
              }}
            >
              <CardActionArea 
                onClick={() => navigate('/admin/users')}
                sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <AddIcon sx={{ fontSize: 100, mb: 2 }} />
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Manage Services
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9, fontSize: '1.1rem' }}>
                    Add and manage healthcare providers and services
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>

          {/* Manage Bookings Card */}
          <Grid item xs={12} md={5}>
            <Card 
              elevation={3}
              sx={{ 
                height: '300px',
                background: 'linear-gradient(135deg, #3B82F6 0%, #0F172A 100%)',
                color: 'white',
                cursor: 'pointer',
                transition: 'transform 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 6
                }
              }}
            >
              <CardActionArea 
                onClick={() => navigate('/admin/appointments')}
                sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <ManageIcon sx={{ fontSize: 100, mb: 2 }} />
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Manage Bookings
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9, fontSize: '1.1rem' }}>
                    View and manage all service bookings and appointments
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
