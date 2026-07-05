import { useState } from 'react';
import { Button, Stack, Snackbar, Alert } from '@mui/material';
import { UploadFile, Download } from '@mui/icons-material';
import * as XLSX from 'xlsx';

// ── Shared helpers for per-entity row mapping ────────────────────────────────

// Case/space/underscore-insensitive column lookup: "Consultation Fee",
// "consultation_fee" and "CONSULTATIONFEE" all resolve the same.
const normalizeHeader = (h: string) => h.toLowerCase().replace(/[\s_]+/g, '');

export function makeGetter(row: Record<string, any>) {
  const keys = Object.keys(row);
  return (...aliases: string[]) => {
    for (const a of aliases) {
      const found = keys.find((k) => normalizeHeader(k) === a);
      if (found && row[found] !== '' && row[found] != null) return row[found];
    }
    return undefined;
  };
}

export const toNum = (v: any): number => Math.round(Number(v)) || 0;

// Float without rounding (ratings, latitude/longitude); undefined when blank.
export const toFloat = (v: any): number | undefined => {
  if (v === '' || v == null) return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
};

export const toBool = (v: any): boolean => {
  const s = String(v ?? '').trim().toLowerCase();
  return s === 'yes' || s === 'true' || s === '1' || s === 'required' || s === 'y';
};

// Split a cell like "Mon, Tue, Wed" or "Mon | Tue" into a trimmed list.
export const toList = (v: any): string[] =>
  String(v ?? '')
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean);

// ── Reusable Template + Import buttons ───────────────────────────────────────

interface Props<T> {
  entityLabel: string; // e.g. "doctor" — used in the result message
  fileBaseName: string; // e.g. "doctors" — template file name
  sample: Record<string, any>; // one example row shown in the template
  mapRow: (row: Record<string, any>) => T | null; // null → skip (missing required fields)
  createItem: (payload: T) => Promise<any>;
  onComplete: () => void; // refresh the list after import
}

export default function ImportExcelButton<T>({
  entityLabel,
  fileBaseName,
  sample,
  mapRow,
  createItem,
  onComplete,
}: Props<T>) {
  const [importing, setImporting] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([sample]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, `${fileBaseName}_template.xlsx`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    setImporting(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
      if (rows.length === 0) {
        setSnackbar({ open: true, message: 'The file has no rows', severity: 'error' });
        return;
      }
      let created = 0;
      let skipped = 0;
      for (const row of rows) {
        let payload: T | null = null;
        try {
          payload = mapRow(row);
        } catch {
          payload = null;
        }
        if (!payload) {
          skipped++;
          continue;
        }
        try {
          await createItem(payload);
          created++;
        } catch {
          skipped++;
        }
      }
      onComplete();
      setSnackbar({
        open: true,
        message:
          `Imported ${created} ${entityLabel}${created !== 1 ? 's' : ''}` +
          (skipped ? `, skipped ${skipped} invalid/duplicate row${skipped !== 1 ? 's' : ''}` : ''),
        severity: created > 0 ? 'success' : 'error',
      });
    } catch {
      setSnackbar({ open: true, message: 'Failed to read the Excel file', severity: 'error' });
    } finally {
      setImporting(false);
    }
  };

  const inputId = `import-excel-${fileBaseName}`;

  return (
    <>
      <Stack direction="row" spacing={1}>
        <Button variant="contained" startIcon={<Download />} onClick={handleDownloadTemplate}>
          Template
        </Button>
        <input
          accept=".xlsx,.xls,.csv"
          style={{ display: 'none' }}
          id={inputId}
          type="file"
          onChange={handleImport}
        />
        <label htmlFor={inputId}>
          <Button variant="contained" component="span" startIcon={<UploadFile />} disabled={importing}>
            {importing ? 'Importing…' : 'Import from Excel'}
          </Button>
        </label>
      </Stack>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
