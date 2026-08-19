import { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  TextField,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  Avatar,
  Divider,
} from '@mui/material';
import { PhotoCamera as PhotoCameraIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useAuth } from '../../../context/AuthContext';
import vendorAPI, { ENTITY_LINKED_ROLES } from '../../../api/vendorApi';
import { fileToDataUrl } from '../vendorUtils';

const AMBULANCE_TYPES = ['BLS', 'ALS', 'Neonatal', 'Air'];
const GENDERS = ['Male', 'Female'];

const listToText = (v: any): string => (Array.isArray(v) ? v.join(', ') : '');
const textToList = (v: string): string[] => v.split(',').map((s) => s.trim()).filter(Boolean);

const EMPTY = {
  full_name: '', phone: '', name: '', specialty: '', qualification: '', experience: '',
  consultation_fee: '', address: '', available_days: '', available_slots: '',
  ambulance_type: 'BLS', base_price: '', estimated_time: '', description: '', features: '',
  specialization: '', hourly_rate: '', daily_rate: '', gender: 'Male', services: '',
  available_shifts: '', languages: '',
};

export default function ProfileTab({
  initialLogo = null,
  onLogoUpdated,
}: {
  initialLogo?: string | null;
  onLogoUpdated?: (logo: string | null) => void;
}) {
  const { user, refreshUser } = useAuth();
  const role: string = user?.role ?? '';
  const isDoctorLike = ['doctor', 'dentist'].includes(role);
  const isAmbulance = role === 'ambulance';
  const isCareRole = ['nurse', 'physiotherapist'].includes(role);
  const hasBusinessProfile = ENTITY_LINKED_ROLES.includes(role);

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [logo, setLogo] = useState<string | null>(initialLogo);
  const [logoBusy, setLogoBusy] = useState(false);

  const handleLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoBusy(true);
    try {
      const data = await fileToDataUrl(file);
      await vendorAPI.updateLogo(data);
      setLogo(data);
      onLogoUpdated?.(data);
    } catch {
      setError('Failed to upload logo.');
    } finally {
      setLogoBusy(false);
    }
  };

  const removeLogo = async () => {
    setLogoBusy(true);
    try {
      await vendorAPI.updateLogo(null);
      setLogo(null);
      onLogoUpdated?.(null);
    } catch {
      setError('Failed to remove logo.');
    } finally {
      setLogoBusy(false);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const base = { ...EMPTY, full_name: user?.full_name ?? '', phone: user?.phone ?? '' };
        if (hasBusinessProfile) {
          const p = await vendorAPI.getMyBusinessProfile();
          if (p) {
            Object.assign(base, {
              name: p.name ?? '',
              specialty: p.specialty ?? '',
              qualification: p.qualification ?? '',
              experience: p.experience?.toString() ?? '',
              consultation_fee: p.consultation_fee?.toString() ?? '',
              address: p.address ?? '',
              available_days: listToText(p.available_days),
              available_slots: listToText(p.available_slots),
              ambulance_type: p.ambulance_type ?? 'BLS',
              base_price: p.base_price?.toString() ?? '',
              estimated_time: p.estimated_time ?? '',
              description: p.description ?? '',
              features: listToText(p.features),
              specialization: p.specialization ?? '',
              hourly_rate: p.hourly_rate?.toString() ?? '',
              daily_rate: p.daily_rate?.toString() ?? '',
              gender: p.gender ?? 'Male',
              services: listToText(p.services),
              available_shifts: listToText(p.available_shifts),
              languages: listToText(p.languages),
            });
          }
        }
        setForm(base);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const set = (field: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const save = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await vendorAPI.updateMyAccount({ full_name: form.full_name, phone: form.phone || undefined });
      if (hasBusinessProfile) {
        await vendorAPI.updateMyBusinessProfile({
          name: form.name || undefined,
          ...(isDoctorLike && {
            specialty: form.specialty,
            qualification: form.qualification,
            experience: Number(form.experience),
            consultation_fee: Number(form.consultation_fee),
            address: form.address,
            available_days: textToList(form.available_days),
            available_slots: textToList(form.available_slots),
          }),
          ...(isAmbulance && {
            ambulance_type: form.ambulance_type,
            base_price: Number(form.base_price),
            estimated_time: form.estimated_time,
            description: form.description,
            features: textToList(form.features),
          }),
          ...(isCareRole && {
            qualification: form.qualification,
            specialization: form.specialization,
            experience: Number(form.experience),
            hourly_rate: Number(form.hourly_rate),
            daily_rate: Number(form.daily_rate),
            gender: form.gender,
            services: textToList(form.services),
            available_shifts: textToList(form.available_shifts),
            languages: textToList(form.languages),
          }),
        });
      }
      await refreshUser();
      setSaved(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save your profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 3, maxWidth: 720 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {saved && <Alert severity="success" sx={{ mb: 2 }}>Profile saved.</Alert>}

      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
        Business logo
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Avatar
          src={logo || undefined}
          variant="rounded"
          sx={{ width: 72, height: 72, bgcolor: logo ? '#fff' : 'primary.main', border: '1px solid', borderColor: 'divider', fontSize: 28, fontWeight: 700 }}
          imgProps={{ style: { objectFit: 'contain' } }}
        >
          {(form.name || user?.full_name || 'V').charAt(0).toUpperCase()}
        </Avatar>
        <Stack spacing={1}>
          <Button component="label" variant="outlined" size="small" startIcon={<PhotoCameraIcon />} disabled={logoBusy} sx={{ textTransform: 'none' }}>
            {logo ? 'Change logo' : 'Upload logo'}
            <input hidden type="file" accept="image/*" onChange={handleLogo} />
          </Button>
          {logo && (
            <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={removeLogo} disabled={logoBusy} sx={{ textTransform: 'none', justifyContent: 'flex-start' }}>
              Remove
            </Button>
          )}
          <Typography variant="caption" color="text.secondary">
            Shown in your dashboard header. PNG/JPG.
          </Typography>
        </Stack>
      </Stack>
      <Divider sx={{ mb: 3 }} />

      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
        Account
      </Typography>
      <Stack spacing={2} sx={{ mb: 3 }}>
        <TextField label="Full name" value={form.full_name} onChange={set('full_name')} fullWidth />
        <TextField label="Phone" value={form.phone} onChange={set('phone')} fullWidth />
      </Stack>

      {hasBusinessProfile && (
        <>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
            Business profile
          </Typography>
          <Stack spacing={2}>
            <TextField label="Display name" value={form.name} onChange={set('name')} fullWidth />

            {isDoctorLike && (
              <>
                <TextField label="Specialty" value={form.specialty} onChange={set('specialty')} fullWidth />
                <TextField label="Qualification" value={form.qualification} onChange={set('qualification')} fullWidth />
                <Stack direction="row" spacing={2}>
                  <TextField label="Experience (years)" type="number" value={form.experience} onChange={set('experience')} fullWidth />
                  <TextField label="Consultation fee (₹)" type="number" value={form.consultation_fee} onChange={set('consultation_fee')} fullWidth />
                </Stack>
                <TextField label="Address" value={form.address} onChange={set('address')} fullWidth />
                <TextField label="Available days (comma-separated)" value={form.available_days} onChange={set('available_days')} fullWidth />
                <TextField label="Available slots (comma-separated)" value={form.available_slots} onChange={set('available_slots')} fullWidth />
              </>
            )}

            {isAmbulance && (
              <>
                <TextField select label="Ambulance type" value={form.ambulance_type} onChange={set('ambulance_type')} fullWidth>
                  {AMBULANCE_TYPES.map((t) => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </TextField>
                <Stack direction="row" spacing={2}>
                  <TextField label="Base price (₹)" type="number" value={form.base_price} onChange={set('base_price')} fullWidth />
                  <TextField label="Estimated time" value={form.estimated_time} onChange={set('estimated_time')} fullWidth />
                </Stack>
                <TextField label="Description" value={form.description} onChange={set('description')} fullWidth />
                <TextField label="Features (comma-separated)" value={form.features} onChange={set('features')} fullWidth />
              </>
            )}

            {isCareRole && (
              <>
                <TextField label="Qualification" value={form.qualification} onChange={set('qualification')} fullWidth />
                <TextField label="Specialization" value={form.specialization} onChange={set('specialization')} fullWidth />
                <Stack direction="row" spacing={2}>
                  <TextField label="Experience (years)" type="number" value={form.experience} onChange={set('experience')} fullWidth />
                  <TextField select label="Gender" value={form.gender} onChange={set('gender')} sx={{ minWidth: 120 }}>
                    {GENDERS.map((g) => (
                      <MenuItem key={g} value={g}>{g}</MenuItem>
                    ))}
                  </TextField>
                </Stack>
                <Stack direction="row" spacing={2}>
                  <TextField label="Hourly rate (₹)" type="number" value={form.hourly_rate} onChange={set('hourly_rate')} fullWidth />
                  <TextField label="Daily rate (₹)" type="number" value={form.daily_rate} onChange={set('daily_rate')} fullWidth />
                </Stack>
                <TextField label="Services (comma-separated)" value={form.services} onChange={set('services')} fullWidth />
                <TextField label="Available shifts (comma-separated)" value={form.available_shifts} onChange={set('available_shifts')} fullWidth />
                <TextField label="Languages (comma-separated)" value={form.languages} onChange={set('languages')} fullWidth />
              </>
            )}
          </Stack>
        </>
      )}

      {!hasBusinessProfile && (
        <Typography variant="body2" color="text.secondary">
          {role === 'lab' || role === 'pharmacy'
            ? 'Your account operates the whole service, so there is no separate business profile to edit here.'
            : 'No editable business profile for this account.'}
        </Typography>
      )}

      <Button variant="contained" onClick={save} disabled={saving} sx={{ mt: 3, textTransform: 'none' }}>
        {saving ? 'Saving…' : 'Save Changes'}
      </Button>
    </Paper>
  );
}
