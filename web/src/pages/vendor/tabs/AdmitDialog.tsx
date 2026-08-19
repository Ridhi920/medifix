import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  Stack,
  Alert,
} from '@mui/material';
import vendorAPI from '../../../api/vendorApi';

const GENDERS = ['Male', 'Female', 'Other'];

export interface AdmitInitial {
  patient_name?: string;
  age?: string;
  gender?: string;
  contact?: string;
  diagnosis?: string;
}

const blank = {
  patient_name: '', age: '', gender: 'Male', contact: '', ward: '', bed_number: '',
  diagnosis: '', attending_doctor: '', notes: '',
};

/**
 * Reusable "admit patient as inpatient" dialog. Used both from the Inpatient
 * panel (blank) and from an outpatient record (pre-filled + name locked).
 */
export default function AdmitDialog({
  open,
  onClose,
  onAdmitted,
  initial,
  lockName = false,
  title = 'Admit Patient',
}: {
  open: boolean;
  onClose: () => void;
  onAdmitted: () => void;
  initial?: AdmitInitial;
  lockName?: boolean;
  title?: string;
}) {
  const [form, setForm] = useState({ ...blank });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm({ ...blank, ...initial });
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const setField = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const admit = async () => {
    if (!form.patient_name.trim()) {
      setError('Patient name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await vendorAPI.createAdmission({
        patient_name: form.patient_name,
        age: form.age ? Number(form.age) : undefined,
        gender: form.gender,
        contact: form.contact || undefined,
        ward: form.ward || undefined,
        bed_number: form.bed_number || undefined,
        diagnosis: form.diagnosis || undefined,
        attending_doctor: form.attending_doctor || undefined,
        notes: form.notes || undefined,
      });
      onAdmitted();
      onClose();
    } catch {
      setError('Failed to admit patient.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Patient name" value={form.patient_name} onChange={setField('patient_name')} fullWidth disabled={lockName} />
          <Stack direction="row" spacing={2}>
            <TextField label="Age" type="number" value={form.age} onChange={setField('age')} sx={{ width: 100 }} />
            <TextField select label="Gender" value={form.gender} onChange={setField('gender')} sx={{ width: 130 }}>
              {GENDERS.map((g) => (
                <MenuItem key={g} value={g}>{g}</MenuItem>
              ))}
            </TextField>
            <TextField label="Contact" value={form.contact} onChange={setField('contact')} fullWidth />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField label="Ward" value={form.ward} onChange={setField('ward')} fullWidth />
            <TextField label="Bed number" value={form.bed_number} onChange={setField('bed_number')} fullWidth />
          </Stack>
          <TextField label="Diagnosis" value={form.diagnosis} onChange={setField('diagnosis')} fullWidth />
          <TextField label="Attending doctor" value={form.attending_doctor} onChange={setField('attending_doctor')} fullWidth />
          <TextField label="Notes" value={form.notes} onChange={setField('notes')} fullWidth multiline minRows={2} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={admit} disabled={saving}>
          {saving ? 'Admitting…' : 'Admit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
