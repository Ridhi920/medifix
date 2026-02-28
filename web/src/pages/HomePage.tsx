import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Stack,
  Typography,
  IconButton,
  Avatar
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import {
  LocalHospital,
  LocalPharmacy,
  AirportShuttle,
  Assignment,
  VerifiedUser,
  Speed,
  AttachMoney,
  NotificationsOutlined,
  AccountCircleOutlined,
  Home,
  MedicalServices,
  SupportAgent,
  Person,
  NavigateBefore,
  NavigateNext
} from "@mui/icons-material";

const testimonials = [
  {
    text: "Excellent service, got connected to a doctor within minutes!",
    avatar: "👨‍⚕️"
  },
  {
    text: "Quick response and very professional healthcare team",
    avatar: "🧑‍⚕️"  
  },
  {
    text: "Amazing experience! The ambulance arrived so fast",
    avatar: "👨‍💼"
  },
  {
    text: "Best medical app I've used. Highly recommended!",
    avatar: "👩‍💼"
  }
];

export default function HomePage() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#F5F7FA" }}>
      {/* Header */}
      <Box sx={{ 
        background: "linear-gradient(135deg, #FF6B35 0%, #FF8A5C 100%)",
        py: 2
      }}>
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box sx={{ 
                backgroundColor: "white", 
                borderRadius: 1, 
                p: 0.5,
                display: "flex",
                alignItems: "center"
              }}>
                <LocalHospital sx={{ color: "#FF6B35", fontSize: 28 }} />
              </Box>
              <Typography variant="h5" fontWeight={700} color="white">
                MedEFix
              </Typography>
            </Stack>
            <Stack direction="row" spacing={2}>
              <IconButton sx={{ color: "white" }}>
                <NotificationsOutlined />
              </IconButton>
              <IconButton sx={{ color: "white" }}>
                <AccountCircleOutlined />
              </IconButton>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box sx={{ 
        background: "linear-gradient(135deg, #FF6B35 0%, #FF8A5C 100%)",
        py: 8,
        position: "relative",
        overflow: "hidden"
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography 
                variant="h2" 
                fontWeight={700} 
                color="white"
                sx={{ mb: 2 }}
              >
                30 Minutes to Care
              </Typography>
              <Typography 
                variant="h6" 
                color="white"
                sx={{ mb: 4, opacity: 0.95 }}
              >
                Connect to doctors, pharmacy
                <br />
                & ambulance instantly
              </Typography>
              <Button 
                variant="contained"
                size="large"
                component={RouterLink}
                to="/services"
                sx={{ 
                  backgroundColor: "white",
                  color: "#FF6B35",
                  fontWeight: 700,
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  "&:hover": {
                    backgroundColor: "#f5f5f5"
                  }
                }}
              >
                Book a Consultation
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                position: "relative",
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
              }}>
                {/* Decorative elements representing the healthcare items */}
                <Box sx={{
                  width: 300,
                  height: 300,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative"
                }}>
                  <LocalHospital sx={{ fontSize: 120, color: "white", opacity: 0.3 }} />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Services Section */}
      <Container maxWidth="lg" sx={{ mt: -4, mb: 6 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              borderRadius: 4, 
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              transition: "transform 0.2s",
              "&:hover": {
                transform: "translateY(-4px)"
              }
            }}>
              <CardContent sx={{ p: 4 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{
                    backgroundColor: "#E3F2FD",
                    borderRadius: 2,
                    p: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <LocalHospital sx={{ fontSize: 40, color: "#2196F3" }} />
                  </Box>
                  <Typography variant="h6" fontWeight={700} color="#1E3A5F">
                    Doctor Consultation
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              borderRadius: 4, 
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              transition: "transform 0.2s",
              "&:hover": {
                transform: "translateY(-4px)"
              }
            }}>
              <CardContent sx={{ p: 4 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{
                    backgroundColor: "#FFF3E0",
                    borderRadius: 2,
                    p: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <LocalPharmacy sx={{ fontSize: 40, color: "#FF6B35" }} />
                  </Box>
                  <Typography variant="h6" fontWeight={700} color="#1E3A5F">
                    Pharmacy
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              borderRadius: 4, 
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              transition: "transform 0.2s",
              "&:hover": {
                transform: "translateY(-4px)"
              }
            }}>
              <CardContent sx={{ p: 4 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{
                    backgroundColor: "#FFEBEE",
                    borderRadius: 2,
                    p: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <AirportShuttle sx={{ fontSize: 40, color: "#F44336" }} />
                  </Box>
                  <Typography variant="h6" fontWeight={700} color="#1E3A5F">
                    Ambulance
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              borderRadius: 4, 
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              transition: "transform 0.2s",
              "&:hover": {
                transform: "translateY(-4px)"
              }
            }}>
              <CardContent sx={{ p: 4 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{
                    backgroundColor: "#F3E5F5",
                    borderRadius: 2,
                    p: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <Assignment sx={{ fontSize: 40, color: "#9C27B0" }} />
                  </Box>
                  <Typography variant="h6" fontWeight={700} color="#1E3A5F">
                    Health Records
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Emergency Call Section */}
      <Box sx={{ 
        background: "linear-gradient(135deg, #FF6B35 0%, #FF8A5C 100%)",
        py: 2
      }}>
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={2}>
            <Typography variant="h6" color="white" fontWeight={600}>
              Need Immediate Ambulance Support?
            </Typography>
            <Button 
              variant="contained"
              sx={{ 
                backgroundColor: "white",
                color: "#FF6B35",
                fontWeight: 700,
                px: 4,
                "&:hover": {
                  backgroundColor: "#f5f5f5"
                }
              }}
            >
              Call Now
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Why Choose MedEfix */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography 
          variant="h4" 
          fontWeight={700} 
          textAlign="center"
          color="#1E3A5F"
          sx={{ mb: 6 }}
        >
          Why Choose <span style={{ color: "#2196F3" }}>MedEfix</span>
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Stack alignItems="center" spacing={2}>
              <Box sx={{
                backgroundColor: "#E3F2FD",
                borderRadius: "50%",
                width: 100,
                height: 100,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <VerifiedUser sx={{ fontSize: 50, color: "#2196F3" }} />
              </Box>
              <Typography variant="h6" fontWeight={700} color="#1E3A5F">
                Verified Doctors
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack alignItems="center" spacing={2}>
              <Box sx={{
                backgroundColor: "#E3F2FD",
                borderRadius: "50%",
                width: 100,
                height: 100,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Speed sx={{ fontSize: 50, color: "#2196F3" }} />
              </Box>
              <Typography variant="h6" fontWeight={700} color="#1E3A5F">
                Quick Response
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack alignItems="center" spacing={2}>
              <Box sx={{
                backgroundColor: "#E3F2FD",
                borderRadius: "50%",
                width: 100,
                height: 100,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <AttachMoney sx={{ fontSize: 50, color: "#2196F3" }} />
              </Box>
              <Typography variant="h6" fontWeight={700} color="#1E3A5F">
                Affordable Pricing
              </Typography>
            </Stack>
          </Grid>
        </Grid>
      </Container>

      {/* Testimonials */}
      <Container maxWidth="lg" sx={{ pb: 8 }}>
        <Typography 
          variant="h4" 
          fontWeight={700} 
          textAlign="center"
          color="#1E3A5F"
          sx={{ mb: 6 }}
        >
          What Our Users Say
        </Typography>
        <Box sx={{ position: "relative", maxWidth: 800, mx: "auto" }}>
          <Card sx={{ 
            backgroundColor: "#E3F2FD",
            borderRadius: 4,
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)"
          }}>
            <CardContent sx={{ p: 6 }}>
              <Stack direction="row" spacing={3} alignItems="center">
                <Avatar sx={{ 
                  width: 80, 
                  height: 80,
                  fontSize: 40,
                  backgroundColor: "white"
                }}>
                  {testimonials[currentTestimonial].avatar}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    variant="h6" 
                    color="#1E3A5F"
                    fontStyle="italic"
                    sx={{ mb: 2 }}
                  >
                    "{testimonials[currentTestimonial].text}"
                  </Typography>
                  <Stack direction="row" spacing={1} justifyContent="center">
                    {testimonials.map((_, index) => (
                      <Box
                        key={index}
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          backgroundColor: index === currentTestimonial ? "#2196F3" : "#CBD5E0",
                          cursor: "pointer"
                        }}
                        onClick={() => setCurrentTestimonial(index)}
                      />
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
          <IconButton
            sx={{
              position: "absolute",
              left: -20,
              top: "50%",
              transform: "translateY(-50%)",
              backgroundColor: "white",
              "&:hover": { backgroundColor: "#f5f5f5" }
            }}
            onClick={prevTestimonial}
          >
            <NavigateBefore />
          </IconButton>
          <IconButton
            sx={{
              position: "absolute",
              right: -20,
              top: "50%",
              transform: "translateY(-50%)",
              backgroundColor: "white",
              "&:hover": { backgroundColor: "#f5f5f5" }
            }}
            onClick={nextTestimonial}
          >
            <NavigateNext />
          </IconButton>
        </Box>
      </Container>

      {/* Bottom Navigation */}
      <Box sx={{ 
        background: "linear-gradient(135deg, #FF6B35 0%, #FF8A5C 100%)",
        py: 2,
        position: "sticky",
        bottom: 0,
        boxShadow: "0 -4px 12px rgba(0,0,0,0.15)"
      }}>
        <Container maxWidth="sm">
          <Stack 
            direction="row" 
            justifyContent="space-around" 
            alignItems="center"
          >
            <Stack alignItems="center" spacing={0.5}>
              <Box sx={{
                backgroundColor: "white",
                borderRadius: 2,
                p: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Home sx={{ color: "#FF6B35", fontSize: 28 }} />
              </Box>
              <Typography variant="caption" color="white" fontWeight={600}>
                Home
              </Typography>
            </Stack>
            <Stack alignItems="center" spacing={0.5}>
              <IconButton 
                component={RouterLink} 
                to="/services"
                sx={{ color: "white" }}
              >
                <MedicalServices sx={{ fontSize: 28 }} />
              </IconButton>
              <Typography variant="caption" color="white" fontWeight={600}>
                Services
              </Typography>
            </Stack>
            <Stack alignItems="center" spacing={0.5}>
              <IconButton sx={{ color: "white" }}>
                <SupportAgent sx={{ fontSize: 28 }} />
              </IconButton>
              <Typography variant="caption" color="white" fontWeight={600}>
                Support
              </Typography>
            </Stack>
            <Stack alignItems="center" spacing={0.5}>
              <IconButton 
                component={RouterLink}
                to="/login"
                sx={{ color: "white" }}
              >
                <Person sx={{ fontSize: 28 }} />
              </IconButton>
              <Typography variant="caption" color="white" fontWeight={600}>
                Profile
              </Typography>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
