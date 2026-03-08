import { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress
} from '@mui/material';
import {
  MedicalServices as DoctorsIcon,
  CalendarMonth as AppointmentsIcon,
  Science as LabIcon,
  Biotech as LabTestIcon,
  AirportShuttle as AmbulanceIcon,
  LocalShipping as AmbulanceBookingIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import axios from 'axios';

interface Stats {
  totalDoctors: number;
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  totalLabTests: number;
  totalLabBookings: number;
  pendingLabBookings: number;
  totalAmbulances: number;
  totalAmbulanceBookings: number;
  pendingAmbulanceBookings: number;
}

export default function DashboardHomePage() {
  const [stats, setStats] = useState<Stats>({
    totalDoctors: 0,
    totalAppointments: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0,
    totalLabTests: 0,
    totalLabBookings: 0,
    pendingLabBookings: 0,
    totalAmbulances: 0,
    totalAmbulanceBookings: 0,
    pendingAmbulanceBookings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { Authorization: `Bearer ${token}` };

      const [doctorsRes, appointmentsRes, labTestsRes, labBookingsRes, ambulancesRes, ambulanceBookingsRes] = await Promise.all([
        axios.get('http://localhost:8000/doctors', { headers }),
        axios.get('http://localhost:8000/doctors/appointments/all', { headers }),
        axios.get('http://localhost:8000/lab-tests?include_inactive=true', { headers }),
        axios.get('http://localhost:8000/lab-tests/bookings/all', { headers }),
        axios.get('http://localhost:8000/ambulances?include_inactive=true', { headers }),
        axios.get('http://localhost:8000/ambulances/bookings/all', { headers })
      ]);

      const appointments = appointmentsRes.data;
      const pendingAppts = appointments.filter((appt: any) => appt.status === 'pending').length;
      const confirmedAppts = appointments.filter((appt: any) => appt.status === 'confirmed').length;

      const labBookings = labBookingsRes.data;
      const pendingLabBookings = labBookings.filter((booking: any) => booking.status === 'pending').length;

      const ambulanceBookings = ambulanceBookingsRes.data;
      const pendingAmbulanceBookings = ambulanceBookings.filter((booking: any) => booking.status === 'pending').length;

      setStats({
        totalDoctors: doctorsRes.data.length,
        totalAppointments: appointments.length,
        pendingAppointments: pendingAppts,
        confirmedAppointments: confirmedAppts,
        totalLabTests: labTestsRes.data.length,
        totalLabBookings: labBookings.length,
        pendingLabBookings: pendingLabBookings,
        totalAmbulances: ambulancesRes.data.length,
        totalAmbulanceBookings: ambulanceBookings.length,
        pendingAmbulanceBookings: pendingAmbulanceBookings
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Doctors',
      value: stats.totalDoctors,
      icon: <DoctorsIcon sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
      bgColor: '#e8f5e9'
    },
    {
      title: 'Total Lab Tests',
      value: stats.totalLabTests,
      icon: <LabTestIcon sx={{ fontSize: 40 }} />,
      color: '#7b1fa2',
      bgColor: '#f3e5f5'
    },
    {
      title: 'Total Ambulances',
      value: stats.totalAmbulances,
      icon: <AmbulanceIcon sx={{ fontSize: 40 }} />,
      color: '#d32f2f',
      bgColor: '#ffebee'
    },
    {
      title: 'Total Appointments',
      value: stats.totalAppointments,
      icon: <AppointmentsIcon sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
      bgColor: '#fff3e0'
    },
    {
      title: 'Pending Appointments',
      value: stats.pendingAppointments,
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      color: '#f57c00',
      bgColor: '#fff3e0'
    },
    {
      title: 'Total Lab Bookings',
      value: stats.totalLabBookings,
      icon: <LabIcon sx={{ fontSize: 40 }} />,
      color: '#0288d1',
      bgColor: '#e1f5fe'
    },
    {
      title: 'Pending Lab Bookings',
      value: stats.pendingLabBookings,
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      color: '#f57c00',
      bgColor: '#fff3e0'
    },
    {
      title: 'Total Ambulance Bookings',
      value: stats.totalAmbulanceBookings,
      icon: <AmbulanceBookingIcon sx={{ fontSize: 40 }} />,
      color: '#d84315',
      bgColor: '#fbe9e7'
    },
    {
      title: 'Pending Ambulance Bookings',
      value: stats.pendingAmbulanceBookings,
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      color: '#f57c00',
      bgColor: '#fff3e0'
    }
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Dashboard Overview
      </Typography>

      <Grid container spacing={3}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card elevation={2}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="textSecondary" variant="body2" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {card.value}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      backgroundColor: card.bgColor,
                      borderRadius: 2,
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <Box sx={{ color: card.color }}>
                      {card.icon}
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Typography color="textSecondary">
              No recent activity to display
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Typography color="textSecondary">
              Use the sidebar to navigate to different management sections
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
