import { ReactNode } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';

// Shared pieces for the pharmacy workspace pages.

export const rs = (v: number | null | undefined): string =>
  `₹${Number(v ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const shortDate = (iso: string | null | undefined): string =>
  !iso ? '—' : new Date(iso).toLocaleDateString('en-IN');

export const dateTime = (iso: string | null | undefined): string =>
  !iso ? '—' : new Date(iso).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });

/** yyyy-mm-dd in local time, for <input type="date"> and API date params. */
export const isoDay = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export function PageHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
        pb: 2,
        mb: 3,
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 400, fontSize: { xs: 22, md: 26 }, flex: 1 }}>
        {title}
      </Typography>
      {actions && <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>{actions}</Box>}
    </Box>
  );
}

/** White card that holds a table, matching the workspace's flat look. */
export function TableCard({ children }: { children: ReactNode }) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'auto',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        // Roomy rows on the card's own table only (not nested detail tables);
        // `flush` cells (collapsible detail rows) opt out.
        '& > .MuiTable-root > * > tr > .MuiTableCell-root:not(.flush)': { py: 2 },
      }}
    >
      {children}
    </Paper>
  );
}

export function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} sx={{ borderBottom: 0 }}>
        <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
          {text}
        </Typography>
      </TableCell>
    </TableRow>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="contained" color="error" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Download rows as a CSV file. */
export function downloadCsv(filename: string, header: string[], rows: (string | number | null | undefined)[][]) {
  const esc = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [header, ...rows].map((r) => r.map(esc).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
