import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Autocomplete,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  LocalHospital as HospitalIcon,
  Add as AddIcon,
  Logout as DischargeIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { adminInpatientAPI, type AdmissionsSummary } from '../../api/adminInpatientApi';
import { doctorAPI, type Doctor } from '../../api/doctorApi';
import type { Admission } from '../../api/vendorApi';

const GENDERS = ['Male', 'Female', 'Other'];

function fmt(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function Tile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Paper variant="outlined" sx={{ px: 3, py: 1.5, minWidth: 120, borderTop: `3px solid ${color}` }}>
      <Typography variant="h5" fontWeight={800} sx={{ color }}>{value}</Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Paper>
  );
}

export default function InpatientManagementPage() {
  const [rows, setRows] = useState<Admission[]>([]);
  const [summary, setSummary] = useState<AdmissionsSummary | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'admitted' | 'discharged' | 'all'>('admitted');
  const [toast, setToast] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);

  // Admit dialog
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selDoctor, setSelDoctor] = useState<Doctor | null>(null);
  const [form, setForm] = useState({
    patient_name: '', age: '', gender: 'Male', contact: '', ward: '', bed_number: '', diagnosis: '', notes: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, sum] = await Promise.all([
        adminInpatientAPI.list(filter === 'all' ? undefined : { status: filter }),
        adminInpatientAPI.summary(),
      ]);
      setRows(list);
      setSummary(sum);
    } catch {
      setToast({ msg: 'Failed to load admissions.', sev: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    doctorAPI.getDoctors(undefined, true).then(setDoctors).catch(() => setDoctors([]));
  }, []);

  const openAdmit = () => {
    setForm({ patient_name: '', age: '', gender: 'Male', contact: '', ward: '', bed_number: '', diagnosis: '', notes: '' });
    setSelDoctor(null);
    setOpen(true);
  };

  const setField = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const admit = async () => {
    if (!form.patient_name.trim()) {
      setToast({ msg: 'Patient name is required.', sev: 'error' });
      return;
    }
    setSaving(true);
    try {
      await adminInpatientAPI.admit({
        patient_name: form.patient_name,
        vendor_role: 'doctor',
        provider_id: selDoctor?.id ?? null,
        provider_name: selDoctor?.name,
        age: form.age ? Number(form.age) : undefined,
        gender: form.gender,
        contact: form.contact || undefined,
        ward: form.ward || undefined,
        bed_number: form.bed_number || undefined,
        diagnosis: form.diagnosis || undefined,
        attending_doctor: selDoctor?.name,
        notes: form.notes || undefined,
      });
      setOpen(false);
      setToast({ msg: 'Patient admitted.', sev: 'success' });
      await load();
    } catch {
      setToast({ msg: 'Failed to admit patient.', sev: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const discharge = async (a: Admission) => {
    await adminInpatientAPI.discharge(a.id);
    setToast({ msg: `${a.patient_name} discharged.`, sev: 'success' });
    await load();
  };

  const remove = async (a: Admission) => {
    await adminInpatientAPI.remove(a.id);
    await load();
  };

  const doctorName = (id: number | null) => doctors.find((d) => d.id === id)?.name;

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
        <HospitalIcon sx={{ color: '#0d9488', fontSize: 32 }} />
        <Typography variant="h4" fontWeight={800}>Inpatients</Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={load} size="small" sx={{ ml: 1 }}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdmit} sx={{ textTransform: 'none' }}>
          Admit Patient
        </Button>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Hospitalised (inpatient) admissions across all providers. Everyone else is an outpatient.
      </Typography>

      {summary && (
        <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Tile label="Total" value={summary.total} color="#0f172a" />
          <Tile label="Currently Admitted" value={summary.admitted} color="#2563eb" />
          <Tile label="Discharged" value={summary.discharged} color="#16a34a" />
        </Stack>
      )}

      <ToggleButtonGroup size="small" exclusive value={filter} onChange={(_, v) => v && setFilter(v)} sx={{ mb: 2 }}>
        <ToggleButton value="admitted" sx={{ textTransform: 'none' }}>Admitted</ToggleButton>
        <ToggleButton value="discharged" sx={{ textTransform: 'none' }}>Discharged</ToggleButton>
        <ToggleButton value="all" sx={{ textTransform: 'none' }}>All</ToggleButton>
      </ToggleButtonGroup>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : rows.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          No {filter === 'all' ? '' : filter} inpatients.
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: '#f8fafc' } }}>
                <TableCell>Patient</TableCell>
                <TableCell>Provider</TableCell>
                <TableCell>Ward / Bed</TableCell>
                <TableCell>Diagnosis</TableCell>
                <TableCell>Tests</TableCell>
                <TableCell>Admitted</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((a) => (
                <TableRow key={a.id} hover>
                  <TableCell>{a.patient_name}{a.age ? `, ${a.age}` : ''}</TableCell>
                  <TableCell>{a.attending_doctor || doctorName(a.provider_id) || '—'}</TableCell>
                  <TableCell>{a.ward ? `${a.ward}${a.bed_number ? ` · ${a.bed_number}` : ''}` : '—'}</TableCell>
                  <TableCell>{a.diagnosis || '—'}</TableCell>
                  <TableCell>{a.tests.length}</TableCell>
                  <TableCell>{fmt(a.admission_date)}</TableCell>
                  <TableCell>
                    <Chip size="small" color={a.status === 'admitted' ? 'info' : 'default'} label={a.status === 'admitted' ? 'Admitted' : 'Discharged'} />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      {a.status === 'admitted' && (
                        <IconButton size="small" color="success" title="Discharge" onClick={() => discharge(a)}>
                          <DischargeIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton size="small" color="error" title="Delete" onClick={() => remove(a)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Admit dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Admit Patient (Inpatient)</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Patient name" value={form.patient_name} onChange={setField('patient_name')} fullWidth />
            <Autocomplete
              options={doctors}
              getOptionLabel={(d) => `${d.name}${d.specialty ? ` · ${d.specialty}` : ''}`}
              value={selDoctor}
              onChange={(_, v) => setSelDoctor(v)}
              renderInput={(params) => <TextField {...params} label="Attending doctor / provider (optional)" />}
            />
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
            <TextField label="Notes" value={form.notes} onChange={setField('notes')} fullWidth multiline minRows={2} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={admit} disabled={saving}>
            {saving ? 'Admitting…' : 'Admit'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {toast ? <Alert severity={toast.sev} onClose={() => setToast(null)}>{toast.msg}</Alert> : undefined}
      </Snackbar>
    </Box>
  );
}
