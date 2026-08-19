import { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Link,
  Alert,
} from '@mui/material';
import {
  UploadFile as UploadIcon,
  Delete as DeleteIcon,
  Description as FileIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import vendorAPI, { type VendorReport } from '../../../api/vendorApi';
import { formatDateTime, fileToDataUrl } from '../vendorUtils';

const REPORT_TYPES = ['General', 'Lab', 'Radiology', 'Prescription', 'Discharge Summary'];

export default function ReportsTab() {
  const [reports, setReports] = useState<VendorReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [patientName, setPatientName] = useState('');
  const [title, setTitle] = useState('');
  const [reportType, setReportType] = useState('General');
  const [file, setFile] = useState<{ data: string; name: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setReports(await vendorAPI.getReports());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openDialog = () => {
    setPatientName('');
    setTitle('');
    setReportType('General');
    setFile(null);
    setError('');
    setOpen(true);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile({ data: await fileToDataUrl(f), name: f.name });
  };

  const save = async () => {
    if (!patientName || !title) {
      setError('Patient name and title are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await vendorAPI.createReport({
        patient_name: patientName,
        title,
        report_type: reportType,
        file: file?.data,
        filename: file?.name,
      });
      setOpen(false);
      await load();
    } catch {
      setError('Failed to upload report.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    await vendorAPI.deleteReport(id);
    await load();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {reports.length} report{reports.length !== 1 ? 's' : ''}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openDialog} sx={{ textTransform: 'none' }}>
          Upload Report
        </Button>
      </Stack>

      {reports.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          No reports yet. Upload lab results, scans, or summaries for your patients.
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: '#f8fafc' } }}>
                <TableCell>Title</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Uploaded</TableCell>
                <TableCell>File</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.title}</TableCell>
                  <TableCell>{r.patient_name}</TableCell>
                  <TableCell>
                    <Chip size="small" label={r.report_type} />
                  </TableCell>
                  <TableCell>{formatDateTime(r.created_at)}</TableCell>
                  <TableCell>
                    {r.file ? (
                      <Link href={r.file} download={r.filename ?? 'report'} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                        <FileIcon fontSize="small" /> {r.filename ?? 'Download'}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" color="error" onClick={() => remove(r.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Report</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Patient name" value={patientName} onChange={(e) => setPatientName(e.target.value)} fullWidth />
            <TextField label="Report title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth />
            <TextField select label="Type" value={reportType} onChange={(e) => setReportType(e.target.value)} fullWidth>
              {REPORT_TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>
            <Button variant="outlined" component="label" startIcon={<UploadIcon />} sx={{ textTransform: 'none' }}>
              {file ? file.name : 'Attach file (PDF / image)'}
              <input hidden type="file" accept="image/*,application/pdf" onChange={handleFile} />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={saving}>
            {saving ? 'Uploading…' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
