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
  Avatar,
} from '@mui/material';
import { Refresh as RefreshIcon, Timeline as TimelineIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { logbookAPI, type LogEntry } from '../../api/logbookApi';

// Distinct colour per module so the timeline is scannable at a glance.
const MODULE_COLORS: Record<string, string> = {
  Appointments: '#0d9488',
  Lab: '#2563eb',
  Pharmacy: '#7c3aed',
  Nurse: '#db2777',
  Physiotherapy: '#ea580c',
  Ambulance: '#dc2626',
  Registration: '#0891b2',
  Reports: '#65a30d',
  ABDM: '#4338ca',
  Claims: '#b45309',
};

const moduleColor = (m: string) => MODULE_COLORS[m] ?? '#475569';

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function renderMeta(meta: string): string {
  try {
    const obj = JSON.parse(meta);
    const parts = Object.entries(obj)
      .filter(([, v]) => v !== null && v !== '' && v !== undefined)
      .map(([k, v]) => `${k}: ${v}`);
    return parts.join('  ·  ');
  } catch {
    return '';
  }
}

export default function DigitalLogbookPage() {
  const { token } = useAuth();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await logbookAPI.list(token, {
        module: activeModule ?? undefined,
        limit: 200,
      });
      setEntries(data);
    } catch {
      setError('Failed to load the Digital Logbook.');
    } finally {
      setLoading(false);
    }
  }, [token, activeModule]);

  useEffect(() => {
    load();
  }, [load]);

  // Module chips derived from what's present, plus an "All" reset.
  const modules = Array.from(new Set(entries.map((e) => e.module))).sort();

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
        <TimelineIcon sx={{ color: '#0d9488', fontSize: 32 }} />
        <Typography variant="h4" fontWeight={800}>
          Digital Logbook
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={load} size="small" sx={{ ml: 1 }}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        A live timeline of every significant action across MedEfix — bookings, orders,
        reports, and more. Each row is written automatically as it happens.
      </Typography>

      {/* Module filter chips */}
      <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Chip
          label="All"
          onClick={() => setActiveModule(null)}
          color={activeModule === null ? 'primary' : 'default'}
          variant={activeModule === null ? 'filled' : 'outlined'}
        />
        {modules.map((m) => (
          <Chip
            key={m}
            label={m}
            onClick={() => setActiveModule(m)}
            variant={activeModule === m ? 'filled' : 'outlined'}
            sx={{
              ...(activeModule === m
                ? { bgcolor: moduleColor(m), color: '#fff' }
                : { borderColor: moduleColor(m), color: moduleColor(m) }),
            }}
          />
        ))}
      </Stack>

      {/* Body */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Paper sx={{ p: 3, bgcolor: '#fef2f2', color: '#b91c1c' }}>{error}</Paper>
      ) : entries.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          No activity yet. Actions like bookings and orders will appear here as they happen.
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {entries.map((e) => (
            <Paper
              key={e.id}
              elevation={0}
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderLeft: `4px solid ${moduleColor(e.module)}`,
              }}
            >
              <Avatar sx={{ bgcolor: moduleColor(e.module), width: 36, height: 36, fontSize: 15 }}>
                {e.actor?.[0]?.toUpperCase() ?? '•'}
              </Avatar>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: 'wrap' }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {e.action}
                  </Typography>
                  <Chip
                    label={e.module}
                    size="small"
                    sx={{
                      bgcolor: moduleColor(e.module),
                      color: '#fff',
                      height: 20,
                      fontSize: 11,
                    }}
                  />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {e.actor}
                  {e.entity_type ? ` · ${e.entity_type}${e.entity_id ? ` #${e.entity_id}` : ''}` : ''}
                </Typography>
                {renderMeta(e.meta) && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    {renderMeta(e.meta)}
                  </Typography>
                )}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                {formatTime(e.created_at)}
              </Typography>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}
