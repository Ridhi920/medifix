import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Stack,
  CircularProgress,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import { Refresh as RefreshIcon, AccountTree as RequestIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import {
  serviceRequestAPI,
  STATUS_FLOW,
  type ServiceRequest,
  type ServiceRequestSummary,
} from '../../api/serviceRequestApi';

const STATUS_COLORS: Record<string, string> = {
  created: '#64748b',
  confirmed: '#0d9488',
  scheduled: '#2563eb',
  in_progress: '#ea580c',
  completed: '#16a34a',
  closed: '#334155',
  cancelled: '#dc2626',
};

const statusColor = (s: string) => STATUS_COLORS[s] ?? '#64748b';
const prettyStatus = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function money(v: number | null): string {
  if (v === null || v === undefined) return '—';
  return `₹${v.toLocaleString('en-IN')}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ServiceRequestsPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<ServiceRequest[]>([]);
  const [summary, setSummary] = useState<ServiceRequestSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [activeService, setActiveService] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [list, sum] = await Promise.all([
        serviceRequestAPI.list(token, {
          status: activeStatus ?? undefined,
          service: activeService ?? undefined,
          limit: 300,
        }),
        serviceRequestAPI.summary(token),
      ]);
      setRows(list);
      setSummary(sum);
    } catch {
      setToast({ msg: 'Failed to load service requests.', sev: 'error' });
    } finally {
      setLoading(false);
    }
  }, [token, activeStatus, activeService]);

  useEffect(() => {
    load();
  }, [load]);

  const advance = async (req: ServiceRequest, next: string) => {
    if (!token) return;
    setBusyId(req.id);
    try {
      await serviceRequestAPI.updateStatus(token, req.id, next);
      setToast({ msg: `Request #${req.id} → ${prettyStatus(next)}`, sev: 'success' });
      await load();
    } catch {
      setToast({ msg: 'Could not update status.', sev: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const services = summary ? Object.keys(summary.by_service).sort() : [];

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
        <RequestIcon sx={{ color: '#0d9488', fontSize: 32 }} />
        <Typography variant="h4" fontWeight={800}>
          Service Requests
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={load} size="small" sx={{ ml: 1 }}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        The unified transaction spine — every consultation, test, order, and booking as one
        record you can track through its lifecycle.
      </Typography>

      {/* Summary tiles */}
      {summary && (
        <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <SummaryTile label="Total" value={summary.total} color="#0f172a" />
          <SummaryTile label="Open" value={summary.open} color="#ea580c" />
          {['confirmed', 'in_progress', 'completed'].map((s) => (
            <SummaryTile
              key={s}
              label={prettyStatus(s)}
              value={summary.by_status[s] ?? 0}
              color={statusColor(s)}
            />
          ))}
        </Stack>
      )}

      {/* Filters */}
      <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="caption" sx={{ alignSelf: 'center', color: 'text.secondary', mr: 1 }}>
          Status:
        </Typography>
        <Chip
          label="All"
          size="small"
          onClick={() => setActiveStatus(null)}
          variant={activeStatus === null ? 'filled' : 'outlined'}
          color={activeStatus === null ? 'primary' : 'default'}
        />
        {(summary?.statuses ?? []).map((s) => (
          <Chip
            key={s}
            label={prettyStatus(s)}
            size="small"
            onClick={() => setActiveStatus(s)}
            variant={activeStatus === s ? 'filled' : 'outlined'}
            sx={
              activeStatus === s
                ? { bgcolor: statusColor(s), color: '#fff' }
                : { borderColor: statusColor(s), color: statusColor(s) }
            }
          />
        ))}
      </Stack>
      {services.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="caption" sx={{ alignSelf: 'center', color: 'text.secondary', mr: 1 }}>
            Service:
          </Typography>
          <Chip
            label="All"
            size="small"
            onClick={() => setActiveService(null)}
            variant={activeService === null ? 'filled' : 'outlined'}
            color={activeService === null ? 'primary' : 'default'}
          />
          {services.map((s) => (
            <Chip
              key={s}
              label={prettyStatus(s)}
              size="small"
              onClick={() => setActiveService(s)}
              variant={activeService === s ? 'filled' : 'outlined'}
            />
          ))}
        </Stack>
      )}

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : rows.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          No service requests match this filter.
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: '#f8fafc' } }}>
                <TableCell>#</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Provider</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => {
                const nextStates = STATUS_FLOW[r.status] ?? [];
                return (
                  <TableRow key={r.id} hover>
                    <TableCell>{r.id}</TableCell>
                    <TableCell>{r.patient_name}</TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{r.service}</TableCell>
                    <TableCell>{r.request_type}</TableCell>
                    <TableCell>{r.provider_name ?? '—'}</TableCell>
                    <TableCell align="right">{money(r.amount)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(r.created_at)}</TableCell>
                    <TableCell>
                      <Chip
                        label={prettyStatus(r.status)}
                        size="small"
                        sx={{ bgcolor: statusColor(r.status), color: '#fff', fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        {nextStates.length === 0 ? (
                          <Typography variant="caption" color="text.secondary">
                            —
                          </Typography>
                        ) : (
                          nextStates.map((ns) => (
                            <Button
                              key={ns}
                              size="small"
                              variant="outlined"
                              disabled={busyId === r.id}
                              onClick={() => advance(r, ns)}
                              sx={{
                                textTransform: 'none',
                                borderColor: statusColor(ns),
                                color: statusColor(ns),
                                minWidth: 0,
                                px: 1,
                              }}
                            >
                              {prettyStatus(ns)}
                            </Button>
                          ))
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast ? (
          <Alert severity={toast.sev} onClose={() => setToast(null)}>
            {toast.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}

function SummaryTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Paper variant="outlined" sx={{ px: 3, py: 1.5, minWidth: 110, borderTop: `3px solid ${color}` }}>
      <Typography variant="h5" fontWeight={800} sx={{ color }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Paper>
  );
}
