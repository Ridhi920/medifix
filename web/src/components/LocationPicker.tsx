import { useState } from 'react';
import { Box, TextField, Button, Typography, InputAdornment, CircularProgress } from '@mui/material';
import { MyLocation, LocationOn } from '@mui/icons-material';

interface LocationPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationChange: (lat?: number, lng?: number) => void;
  address?: string;
  onAddressChange?: (address: string) => void;
  label?: string;
}

// Structured for Google Maps Places Autocomplete — plug in the API key and
// replace the Nominatim reverse-geocode call when ready.
export default function LocationPicker({
  latitude,
  longitude,
  onLocationChange,
  address,
  onAddressChange,
  label = 'Location / Address',
}: LocationPickerProps) {
  const [internalAddress, setInternalAddress] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState('');

  const displayAddress = address !== undefined ? address : internalAddress;

  const handleAddressChange = (val: string) => {
    if (onAddressChange) onAddressChange(val);
    else setInternalAddress(val);
  };

  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Location not supported by this browser');
      return;
    }
    setDetecting(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        onLocationChange(lat, lng);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          if (data.display_name) handleAddressChange(data.display_name);
        } catch {
          // coordinates still saved even if reverse geocode fails
        }
        setDetecting(false);
      },
      () => {
        setDetecting(false);
        setError('Could not access location. Please allow location permission in your browser.');
      },
      { timeout: 10000 }
    );
  };

  return (
    <Box>
      <TextField
        fullWidth
        label={label}
        placeholder="Type an address or use current location"
        value={displayAddress}
        onChange={(e) => handleAddressChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LocationOn color={latitude && longitude ? 'primary' : 'action'} />
            </InputAdornment>
          ),
        }}
        helperText={
          latitude && longitude
            ? `Pinned: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
            : 'Enter address or tap "Use Current Location"'
        }
      />
      <Button
        variant="text"
        size="small"
        startIcon={detecting ? <CircularProgress size={14} /> : <MyLocation fontSize="small" />}
        onClick={detectCurrentLocation}
        disabled={detecting}
        sx={{ mt: 0.5, textTransform: 'none', pl: 0 }}
        color="primary"
      >
        {detecting ? 'Detecting location…' : 'Use Current Location'}
      </Button>
      {error && (
        <Typography variant="caption" color="error" display="block" sx={{ mt: 0.25 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}
