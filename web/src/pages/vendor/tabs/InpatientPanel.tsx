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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Science as TestIcon,
  Logout as DischargeIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import vendorAPI, { type Admission, type TestEntry } from '../../../api/vendorApi';
import { formatDate, formatDateTime } from '../vendorUtils';
import PatientBilling from './PatientBilling';
import AdmitDialog from './AdmitDialog';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ minWidth: 140 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500}>
        {value ?? '—'}
      </Typography>
    </Box>
  );
}

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function InpatientPanel() {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'admitted' | 'discharged' | 'all'>('admitted');

  const [admitOpen, setAdmitOpen] = useState(false);

  // Add-test dialog
  const [testFor, setTestFor] = useState<Admission | null>(null);
  const [test, setTest] = useState<TestEntry>({ name: '', result: '', date: todayStr(), notes: '' });

  const load = async () => {
    setLoading(true);
    try {
      setAdmissions(await vendorAPI.getAdmissions(filter === 'all' ? undefined : filter));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const openTest = (a: Admission) => {
    setTestFor(a);
    setTest({ name: '', result: '', date: todayStr(), notes: '' });
  };

  const saveTest = async () => {
    if (!testFor || !test.name.trim()) return;
    await vendorAPI.addAdmissionTest(testFor.id, test);
    setTestFor(null);
    await load();
  };

  const discharge = async (a: Admission) => {
    await vendorAPI.dischargeAdmission(a.id);
    await load();
  };

  const remove = async (a: Admission) => {
    await vendorAPI.deleteAdmission(a.id);
    await load();
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <ToggleButtonGroup size="small" exclusive value={filter} onChange={(_, v) => v && setFilter(v)}>
          <ToggleButton value="admitted" sx={{ textTransform: 'none' }}>Admitted</ToggleButton>
          <ToggleButton value="discharged" sx={{ textTransform: 'none' }}>Discharged</ToggleButton>
          <ToggleButton value="all" sx={{ textTransform: 'none' }}>All</ToggleButton>
        </ToggleButtonGroup>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAdmitOpen(true)} sx={{ textTransform: 'none' }}>
          Admit Patient
        </Button>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : admissions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          No {filter === 'all' ? '' : filter} inpatients. Use “Admit Patient” to register a hospitalisation.
        </Paper>
      ) : (
        admissions.map((a) => (
          <Accordion key={a.id} disableGutters variant="outlined" sx={{ mb: 1, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%', pr: 2 }}>
                <Typography fontWeight={700} sx={{ flexGrow: 1 }}>
                  {a.patient_name}
                </Typography>
                {a.ward && <Chip size="small" label={`${a.ward}${a.bed_number ? ` · ${a.bed_number}` : ''}`} variant="outlined" />}
                {a.diagnosis && <Chip size="small" color="warning" variant="outlined" label={a.diagnosis} sx={{ maxWidth: 220 }} />}
                <Chip
                  size="small"
                  color={a.status === 'admitted' ? 'info' : 'default'}
                  label={a.status === 'admitted' ? 'Admitted' : 'Discharged'}
                />
                {a.tests.length > 0 && <Chip size="small" label={`${a.tests.length} test${a.tests.length > 1 ? 's' : ''}`} />}
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', gap: 2, mb: 2 }}>
                <Field label="Age" value={a.age} />
                <Field label="Gender" value={a.gender} />
                <Field label="Contact" value={a.contact} />
                <Field label="Ward / Bed" value={a.ward ? `${a.ward}${a.bed_number ? ` · ${a.bed_number}` : ''}` : null} />
                <Field label="Attending" value={a.attending_doctor} />
                <Field label="Admitted" value={formatDateTime(a.admission_date)} />
                <Field label="Discharged" value={a.discharge_date ? formatDateTime(a.discharge_date) : null} />
              </Stack>
              {a.diagnosis && <Field label="Diagnosis" value={a.diagnosis} />}
              {a.notes && (
                <Box sx={{ mt: 1 }}>
                  <Field label="Notes" value={a.notes} />
                </Box>
              )}

              <Stack direction="row" spacing={1} sx={{ my: 2 }}>
                <Button size="small" variant="outlined" startIcon={<TestIcon />} onClick={() => openTest(a)} sx={{ textTransform: 'none' }}>
                  Add Test
                </Button>
                {a.status === 'admitted' && (
                  <Button size="small" variant="contained" color="success" startIcon={<DischargeIcon />} onClick={() => discharge(a)} sx={{ textTransform: 'none' }}>
                    Discharge
                  </Button>
                )}
                <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => remove(a)} sx={{ textTransform: 'none' }}>
                  Delete
                </Button>
              </Stack>

              <Divider sx={{ mb: 1 }} />
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Tests &amp; investigations
              </Typography>
              {a.tests.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No tests recorded yet.
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 700 } }}>
                      <TableCell>Test</TableCell>
                      <TableCell>Result</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {a.tests.map((t, i) => (
                      <TableRow key={i}>
                        <TableCell>{t.name}</TableCell>
                        <TableCell>{t.result || '—'}</TableCell>
                        <TableCell>{t.date ? formatDate(t.date) : '—'}</TableCell>
                        <TableCell>{t.notes || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              <Divider sx={{ my: 2 }} />
              <PatientBilling patientName={a.patient_name} />
            </AccordionDetails>
          </Accordion>
        ))
      )}

      {/* Admit dialog (shared) */}
      <AdmitDialog open={admitOpen} onClose={() => setAdmitOpen(false)} onAdmitted={load} />

      {/* Add-test dialog */}
      <Dialog open={!!testFor} onClose={() => setTestFor(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Test — {testFor?.patient_name}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Test name" value={test.name} onChange={(e) => setTest((t) => ({ ...t, name: e.target.value }))} fullWidth />
            <TextField label="Result" value={test.result ?? ''} onChange={(e) => setTest((t) => ({ ...t, result: e.target.value }))} fullWidth />
            <TextField label="Date" type="date" value={test.date ?? ''} onChange={(e) => setTest((t) => ({ ...t, date: e.target.value }))} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="Notes" value={test.notes ?? ''} onChange={(e) => setTest((t) => ({ ...t, notes: e.target.value }))} fullWidth multiline minRows={2} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestFor(null)}>Cancel</Button>
          <Button variant="contained" onClick={saveTest} disabled={!test.name.trim()}>
            Add Test
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
