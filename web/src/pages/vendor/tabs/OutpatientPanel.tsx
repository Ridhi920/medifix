import { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Chip,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Link,
  IconButton,
  Alert,
  TextField as MuiTextField,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  NoteAdd as NoteAddIcon,
  UploadFile as UploadIcon,
  Delete as DeleteIcon,
  Description as FileIcon,
  LocalHospital as HospitalIcon,
} from '@mui/icons-material';
import vendorAPI, { type VendorPatient } from '../../../api/vendorApi';
import { formatDate, formatDateTime, money, prettyStatus, fileToDataUrl } from '../vendorUtils';
import PatientBilling from './PatientBilling';
import AdmitDialog from './AdmitDialog';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ minWidth: 160 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500}>
        {value ?? '—'}
      </Typography>
    </Box>
  );
}

export default function OutpatientPanel() {
  const [patients, setPatients] = useState<VendorPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Admit-as-inpatient dialog
  const [admitFor, setAdmitFor] = useState<VendorPatient | null>(null);

  // Add-note dialog state
  const [noteFor, setNoteFor] = useState<VendorPatient | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [remark, setRemark] = useState('');
  const [prescription, setPrescription] = useState<{ data: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setPatients(await vendorAPI.getPatients());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNote = (p: VendorPatient) => {
    setNoteFor(p);
    setDiagnosis('');
    setRemark('');
    setPrescription(null);
    setError('');
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = await fileToDataUrl(file);
    setPrescription({ data, name: file.name });
  };

  const saveNote = async () => {
    if (!noteFor) return;
    if (!diagnosis && !remark && !prescription) {
      setError('Add a diagnosis, remark, or prescription.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const latestBooking = noteFor.bookings[0];
      await vendorAPI.createClinicalNote({
        patient_name: noteFor.patient_name,
        source_type: latestBooking?.booking_kind ?? null,
        source_id: latestBooking?.id ?? null,
        diagnosis: diagnosis || undefined,
        remark: remark || undefined,
        prescription_file: prescription?.data,
        prescription_filename: prescription?.name,
      });
      setNoteFor(null);
      await load();
    } catch {
      setError('Failed to save the note.');
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (id: number) => {
    await vendorAPI.deleteClinicalNote(id);
    await load();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const filtered = patients.filter((p) =>
    p.patient_name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {patients.length} patient{patients.length !== 1 ? 's' : ''} from your bookings
        </Typography>
        <MuiTextField
          size="small"
          placeholder="Search patients…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 260 }}
        />
      </Stack>

      {filtered.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          No patients yet. They appear here once they book with you.
        </Paper>
      ) : (
        filtered.map((p) => (
          <Accordion key={p.patient_name} disableGutters sx={{ mb: 1, '&:before': { display: 'none' } }} variant="outlined">
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%', pr: 2 }}>
                <Typography fontWeight={700} sx={{ flexGrow: 1 }}>
                  {p.patient_name}
                </Typography>
                {p.condition && (
                  <Chip size="small" label={p.condition} sx={{ maxWidth: 240 }} color="warning" variant="outlined" />
                )}
                <Chip size="small" label={`${p.total_bookings} visit${p.total_bookings > 1 ? 's' : ''}`} />
                {p.notes_count > 0 && <Chip size="small" color="info" label={`${p.notes_count} note${p.notes_count > 1 ? 's' : ''}`} />}
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              {/* Patient details */}
              <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', gap: 2, mb: 2 }}>
                <Field label="Contact" value={p.contact} />
                <Field label="Disease / Condition" value={p.condition} />
                <Field label="Last visit" value={formatDate(p.last_visit)} />
                <Field label="Total bookings" value={p.total_bookings} />
              </Stack>

              <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Button size="small" variant="contained" startIcon={<NoteAddIcon />} onClick={() => openNote(p)} sx={{ textTransform: 'none' }}>
                  Add Clinical Note / Prescription
                </Button>
                <Button size="small" variant="outlined" color="secondary" startIcon={<HospitalIcon />} onClick={() => setAdmitFor(p)} sx={{ textTransform: 'none' }}>
                  Admit as Inpatient
                </Button>
              </Stack>

              <Divider sx={{ mb: 2 }} />

              {/* Booking history */}
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Visit history
              </Typography>
              <Stack spacing={0.5} sx={{ mb: 2 }}>
                {p.bookings.map((b) => (
                  <Stack key={b.id} direction="row" spacing={2} alignItems="center">
                    <Typography variant="body2" sx={{ minWidth: 150 }}>
                      {formatDateTime(b.created_at)}
                    </Typography>
                    <Chip size="small" label={prettyStatus(b.status)} />
                    <Typography variant="body2" color="text.secondary">
                      {money(b.price)}
                    </Typography>
                  </Stack>
                ))}
              </Stack>

              {/* Clinical notes */}
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Clinical notes
              </Typography>
              {p.clinical_notes.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No notes yet.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {p.clinical_notes.map((n) => (
                    <Paper key={n.id} variant="outlined" sx={{ p: 1.5 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {formatDateTime(n.created_at)}
                          </Typography>
                          {n.diagnosis && (
                            <Typography variant="body2">
                              <strong>Diagnosis:</strong> {n.diagnosis}
                            </Typography>
                          )}
                          {n.remark && (
                            <Typography variant="body2">
                              <strong>Remark:</strong> {n.remark}
                            </Typography>
                          )}
                          {n.prescription_file && (
                            <Link
                              href={n.prescription_file}
                              download={n.prescription_filename ?? 'prescription'}
                              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}
                            >
                              <FileIcon fontSize="small" /> {n.prescription_filename ?? 'Prescription'}
                            </Link>
                          )}
                        </Box>
                        <IconButton size="small" color="error" onClick={() => deleteNote(n.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              )}

              <Divider sx={{ my: 2 }} />
              <PatientBilling patientName={p.patient_name} />
            </AccordionDetails>
          </Accordion>
        ))
      )}

      {/* Admit as inpatient (pre-filled from this outpatient) */}
      <AdmitDialog
        open={!!admitFor}
        onClose={() => setAdmitFor(null)}
        onAdmitted={load}
        lockName
        title={`Admit as Inpatient — ${admitFor?.patient_name ?? ''}`}
        initial={
          admitFor
            ? {
                patient_name: admitFor.patient_name,
                contact: admitFor.contact ?? undefined,
                diagnosis: admitFor.condition ?? undefined,
              }
            : undefined
        }
      />

      {/* Add-note dialog */}
      <Dialog open={!!noteFor} onClose={() => setNoteFor(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Clinical Note — {noteFor?.patient_name}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Diagnosis / Disease details"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
            <TextField
              label="Doctor's remark / advice"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
            <Button variant="outlined" component="label" startIcon={<UploadIcon />} sx={{ textTransform: 'none' }}>
              {prescription ? prescription.name : 'Upload prescription (PDF / image)'}
              <input hidden type="file" accept="image/*,application/pdf" onChange={handleFile} />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteFor(null)}>Cancel</Button>
          <Button variant="contained" onClick={saveNote} disabled={saving}>
            {saving ? 'Saving…' : 'Save Note'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
