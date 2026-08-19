import { Box, Paper, Typography, Stack, Chip, Divider } from '@mui/material';
import {
  QrCode2 as QrIcon,
  HealthAndSafety as AbhaIcon,
  Sync as SyncIcon,
  Lock as ConsentIcon,
} from '@mui/icons-material';

const STEPS = [
  {
    icon: <AbhaIcon />,
    title: 'Verify patient ABHA',
    text: 'Look up a patient by their 14-digit ABHA number or ABHA address to pull their verified identity.',
  },
  {
    icon: <QrIcon />,
    title: 'Scan & Share QR',
    text: 'Scan the patient’s ABHA QR at your front desk to auto-register their visit — no manual data entry.',
  },
  {
    icon: <SyncIcon />,
    title: 'Push records to their Health Locker',
    text: 'Share prescriptions and reports you create here straight to the patient’s ABDM Health Locker.',
  },
  {
    icon: <ConsentIcon />,
    title: 'Consent-gated access',
    text: 'Pull a patient’s past records from other providers — only with their explicit consent.',
  },
];

export default function ScanShareTab() {
  return (
    <Box>
      <Paper
        variant="outlined"
        sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)', color: '#fff' }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <QrIcon sx={{ fontSize: 44 }} />
          <Box>
            <Typography variant="h6" fontWeight={800}>
              ABDM Scan &amp; Share
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Connect your workspace to India’s Ayushman Bharat Digital Mission.
            </Typography>
          </Box>
          <Chip label="Coming soon" sx={{ ml: 'auto', bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700 }} />
        </Stack>
      </Paper>

      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
        What you’ll be able to do once ABDM integration is live:
      </Typography>

      <Stack spacing={1.5}>
        {STEPS.map((s) => (
          <Paper key={s.title} variant="outlined" sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Box sx={{ color: '#0d9488', mt: 0.5 }}>{s.icon}</Box>
            <Box>
              <Typography fontWeight={700}>{s.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {s.text}
              </Typography>
            </Box>
          </Paper>
        ))}
      </Stack>

      <Divider sx={{ my: 3 }} />
      <Typography variant="caption" color="text.secondary">
        This tab activates automatically once the platform’s ABDM connector (ABHA, HIP/HIU, Consent Manager) is
        enabled. The prescriptions and reports you already create in the Patients and Reports tabs will be the records
        shared through it.
      </Typography>
    </Box>
  );
}
