import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  MenuItem,
  Link,
  Divider
} from '@mui/material';
import { vendorAPI, VENDOR_ROLES, ENTITY_LINKED_ROLES } from '../../api/vendorApi';
import medEfixLogo from '../../assets/medEfix.png';

const DOCTOR_LIKE_ROLES = ['doctor', 'dentist'];
const CARE_ROLES = ['nurse', 'physiotherapist'];
const AMBULANCE_TYPES = ['BLS', 'ALS', 'Neonatal', 'Air'];
const GENDERS = ['Male', 'Female'];

export default function VendorSignupPage() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'doctor',
    password: '',
    confirmPassword: '',
    // doctor / dentist
    specialty: '',
    qualification: '',
    experience: '',
    consultation_fee: '',
    address: '',
    // ambulance
    ambulance_type: 'BLS',
    base_price: '',
    estimated_time: '',
    description: '',
    // nurse / physiotherapist
    specialization: '',
    hourly_rate: '',
    daily_rate: '',
    gender: 'Male',
    // pharmacy store
    city: '',
    delivery_time: '',
    opening_hours: '',
    // ambulance vehicle
    vehicle_number: '',
    driver_name: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const isDoctorLike = DOCTOR_LIKE_ROLES.includes(form.role);
  const isAmbulance = form.role === 'ambulance';
  const isCareRole = CARE_ROLES.includes(form.role);
  const isPharmacy = form.role === 'pharmacy';
  const needsProfile = ENTITY_LINKED_ROLES.includes(form.role);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await vendorAPI.signup({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        phone: form.phone || undefined,
        role: form.role,
        ...(isDoctorLike && {
          specialty: form.specialty,
          qualification: form.qualification,
          experience: Number(form.experience),
          consultation_fee: Number(form.consultation_fee),
          address: form.address
        }),
        ...(isAmbulance && {
          ambulance_type: form.ambulance_type,
          base_price: Number(form.base_price),
          estimated_time: form.estimated_time,
          description: form.description,
          vehicle_number: form.vehicle_number || undefined,
          driver_name: form.driver_name || undefined
        }),
        ...(isCareRole && {
          qualification: form.qualification,
          specialization: form.specialization,
          experience: Number(form.experience),
          hourly_rate: Number(form.hourly_rate),
          daily_rate: Number(form.daily_rate),
          gender: form.gender
        }),
        ...(isPharmacy && {
          address: form.address,
          city: form.city || undefined,
          delivery_time: form.delivery_time || undefined,
          opening_hours: form.opening_hours || undefined
        })
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FFA07A 0%, #FFE4B5 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={6} sx={{ p: 4, width: '100%', borderRadius: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <img
              src={medEfixLogo}
              alt="MedEfix Logo"
              style={{ height: '80px', width: 'auto' }}
            />
          </Box>
          <Typography variant="h4" gutterBottom align="center" sx={{ mb: 1, fontWeight: 600 }}>
            Vendor Registration
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Register as a doctor, dentist, lab, ambulance, nurse, physiotherapist or pharmacy.
            Your account and profile must be approved by an admin before you can log in.
          </Typography>

          {success ? (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>
                Registration submitted! An admin will review your account. You can log in once
                it is approved.
              </Alert>
              <Button
                component={RouterLink}
                to="/admin/login"
                variant="contained"
                fullWidth
                size="large"
                sx={{
                  background: 'linear-gradient(45deg, #FFA07A 30%, #FFD700 90%)',
                  color: '#fff',
                  fontWeight: 600
                }}
              >
                Go to Login
              </Button>
            </>
          ) : (
            <>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <TextField
                  label="Full Name / Business Name"
                  fullWidth
                  required
                  value={form.full_name}
                  onChange={handleChange('full_name')}
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Vendor Type"
                  select
                  fullWidth
                  required
                  value={form.role}
                  onChange={handleChange('role')}
                  sx={{ mb: 2 }}
                >
                  {VENDOR_ROLES.map((r) => (
                    <MenuItem key={r.value} value={r.value}>
                      {r.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  required
                  value={form.email}
                  onChange={handleChange('email')}
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Phone"
                  fullWidth
                  value={form.phone}
                  onChange={handleChange('phone')}
                  sx={{ mb: 2 }}
                />

                {needsProfile && (
                  <Divider sx={{ my: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Profile Details
                    </Typography>
                  </Divider>
                )}

                {isDoctorLike && (
                  <>
                    <TextField
                      label="Specialty"
                      fullWidth
                      required
                      value={form.specialty}
                      onChange={handleChange('specialty')}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      label="Qualification"
                      fullWidth
                      required
                      value={form.qualification}
                      onChange={handleChange('qualification')}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      label="Experience (years)"
                      type="number"
                      fullWidth
                      required
                      inputProps={{ min: 0 }}
                      value={form.experience}
                      onChange={handleChange('experience')}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      label="Consultation Fee (₹)"
                      type="number"
                      fullWidth
                      required
                      inputProps={{ min: 0 }}
                      value={form.consultation_fee}
                      onChange={handleChange('consultation_fee')}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      label="Clinic / Practice Address"
                      fullWidth
                      required
                      value={form.address}
                      onChange={handleChange('address')}
                      sx={{ mb: 2 }}
                    />
                  </>
                )}

                {isAmbulance && (
                  <>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      These details describe your first vehicle. Once approved you can add the
                      rest of your fleet from the Fleet tab in your dashboard.
                    </Alert>
                    <TextField
                      label="Vehicle Registration Number"
                      placeholder="e.g. MH-12-AB-1234"
                      fullWidth
                      value={form.vehicle_number}
                      onChange={handleChange('vehicle_number')}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      label="Driver / Crew Lead"
                      fullWidth
                      value={form.driver_name}
                      onChange={handleChange('driver_name')}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      label="Ambulance Type"
                      select
                      fullWidth
                      required
                      value={form.ambulance_type}
                      onChange={handleChange('ambulance_type')}
                      sx={{ mb: 2 }}
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
                      required
                      inputProps={{ min: 0 }}
                      value={form.base_price}
                      onChange={handleChange('base_price')}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      label="Estimated Response Time"
                      placeholder="e.g. 10-15 mins"
                      fullWidth
                      required
                      value={form.estimated_time}
                      onChange={handleChange('estimated_time')}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      label="Description"
                      fullWidth
                      required
                      multiline
                      rows={2}
                      value={form.description}
                      onChange={handleChange('description')}
                      sx={{ mb: 2 }}
                    />
                  </>
                )}

                {isCareRole && (
                  <>
                    <TextField
                      label="Qualification"
                      fullWidth
                      required
                      value={form.qualification}
                      onChange={handleChange('qualification')}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      label="Specialization"
                      fullWidth
                      required
                      value={form.specialization}
                      onChange={handleChange('specialization')}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      label="Experience (years)"
                      type="number"
                      fullWidth
                      required
                      inputProps={{ min: 0 }}
                      value={form.experience}
                      onChange={handleChange('experience')}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      label="Hourly Rate (₹)"
                      type="number"
                      fullWidth
                      required
                      inputProps={{ min: 0 }}
                      value={form.hourly_rate}
                      onChange={handleChange('hourly_rate')}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      label="Daily Rate (₹)"
                      type="number"
                      fullWidth
                      required
                      inputProps={{ min: 0 }}
                      value={form.daily_rate}
                      onChange={handleChange('daily_rate')}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      label="Gender"
                      select
                      fullWidth
                      required
                      value={form.gender}
                      onChange={handleChange('gender')}
                      sx={{ mb: 2 }}
                    >
                      {GENDERS.map((g) => (
                        <MenuItem key={g} value={g}>
                          {g}
                        </MenuItem>
                      ))}
                    </TextField>
                  </>
                )}

                {isPharmacy && (
                  <>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      These details become your store card in the MedEfix app. Customers pick a
                      store first, then browse the medicines you stock. You add those medicines
                      yourself from the Inventory tab once you're approved.
                    </Alert>
                    <TextField
                      label="Store Address"
                      fullWidth
                      required
                      value={form.address}
                      onChange={handleChange('address')}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      label="City"
                      fullWidth
                      value={form.city}
                      onChange={handleChange('city')}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      label="Delivery Time"
                      placeholder="e.g. 30-45 mins"
                      helperText="Shown on your store card. Defaults to 30-45 mins."
                      fullWidth
                      value={form.delivery_time}
                      onChange={handleChange('delivery_time')}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      label="Opening Hours"
                      placeholder="e.g. 8:00 AM - 10:00 PM"
                      fullWidth
                      value={form.opening_hours}
                      onChange={handleChange('opening_hours')}
                      sx={{ mb: 2 }}
                    />
                  </>
                )}

                {!needsProfile && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {form.role} accounts manage all {form.role} bookings — no extra profile
                    details are needed to register.
                  </Alert>
                )}

                <TextField
                  label="Password"
                  type="password"
                  fullWidth
                  required
                  inputProps={{ minLength: 6 }}
                  value={form.password}
                  onChange={handleChange('password')}
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Confirm Password"
                  type="password"
                  fullWidth
                  required
                  value={form.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  sx={{ mb: 3 }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading}
                  sx={{
                    background: 'linear-gradient(45deg, #FFA07A 30%, #FFD700 90%)',
                    color: '#fff',
                    fontWeight: 600,
                    '&:hover': {
                      background: 'linear-gradient(45deg, #FF8C69 30%, #FFC700 90%)'
                    }
                  }}
                >
                  {loading ? 'Submitting...' : 'Register'}
                </Button>
              </form>

              <Typography variant="body2" align="center" sx={{ mt: 2 }}>
                Already have an account?{' '}
                <Link component={RouterLink} to="/admin/login">
                  Log in
                </Link>
              </Typography>
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
