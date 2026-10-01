import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  MenuItem,
  Snackbar,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  DeleteSweep as WriteOffIcon,
  CheckCircle as OkIcon,
  Warning as WarnIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import vendorAPI, { VendorMedicine } from '../../../api/vendorApi';
import pharmacyPosAPI, { StockBatch, apiError } from '../../../api/pharmacyPosApi';
import { ConfirmDialog, EmptyRow, PageHeader, TableCard, rs, shortDate } from './shared';

type StockFilter = 'all' | 'low' | 'out';

export function StockStatus({ stock, min }: { stock: number; min: number }) {
  if (stock <= 0) return <Chip size="small" icon={<ErrorIcon />} color="error" label="Out of stock" />;
  if (stock <= min) return <Chip size="small" icon={<WarnIcon />} color="warning" label="Low stock" />;
  return <Chip size="small" icon={<OkIcon />} color="success" variant="outlined" label="In stock" />;
}

export function ExpiryChip({ batch }: { batch: Pick<StockBatch, 'expiry_status' | 'days_to_expiry'> }) {
  if (batch.expiry_status === null || batch.days_to_expiry === null) return <Typography variant="body2" color="text.secondary">—</Typography>;
  if (batch.expiry_status === 'expired') return <Chip size="small" icon={<ErrorIcon />} color="error" label="Expired" />;
  if (batch.expiry_status === 'expiring') return <Chip size="small" icon={<WarnIcon />} color="warning" label={`${batch.days_to_expiry} days left`} />;
  return <Chip size="small" variant="outlined" label={`${batch.days_to_expiry} days left`} />;
}

export default function StockPage() {
  const [tab, setTab] = useState(0);
  const [medicines, setMedicines] = useState<VendorMedicine[]>([]);
  const [batches, setBatches] = useState<StockBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StockFilter>('all');
  const [writingOff, setWritingOff] = useState<StockBatch | null>(null);
  const [toast, setToast] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [m, b] = await Promise.all([vendorAPI.getMyMedicines(), pharmacyPosAPI.getBatches()]);
      setMedicines(m);
      setBatches(b);
      setError('');
    } catch (e) {
      setError(apiError(e, 'Failed to load stock'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const batchesByMedicine = useMemo(() => {
    const map = new Map<number, StockBatch[]>();
    batches.forEach((b) => map.set(b.medicine_id, [...(map.get(b.medicine_id) ?? []), b]));
    return map;
  }, [batches]);

  const q = search.trim().toLowerCase();
  const stockRows = medicines.filter((m) => {
    if (q && ![m.name, m.generic_name, m.barcode ?? ''].some((v) => v.toLowerCase().includes(q))) return false;
    if (filter === 'low') return m.stock > 0 && m.stock <= m.min_stock;
    if (filter === 'out') return m.stock <= 0;
    return true;
  });
  const batchRows = batches.filter((b) => !q || b.medicine_name.toLowerCase().includes(q) || b.batch_no.toLowerCase().includes(q));

  const totalValue = medicines.reduce((s, m) => s + m.stock * m.price, 0);
  const lowCount = medicines.filter((m) => m.stock > 0 && m.stock <= m.min_stock).length;
  const outCount = medicines.filter((m) => m.stock <= 0).length;

  const confirmWriteOff = async () => {
    if (!writingOff) return;
    try {
      await pharmacyPosAPI.writeOffBatch(writingOff.id);
      setToast(`Batch ${writingOff.batch_no} written off`);
      load();
    } catch (e) {
      setError(apiError(e, 'Failed to write off batch'));
    } finally {
      setWritingOff(null);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Stock & Batches"
        actions={
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load} sx={{ bgcolor: 'background.paper' }}>
            Refresh
          </Button>
        }
      />
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
        <Chip label={`Stock value (MRP): ${rs(totalValue)}`} color="primary" variant="outlined" />
        <Chip label={`${lowCount} low stock`} color="warning" variant="outlined" onClick={() => { setTab(0); setFilter('low'); }} />
        <Chip label={`${outCount} out of stock`} color="error" variant="outlined" onClick={() => { setTab(0); setFilter('out'); }} />
      </Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Stock Levels" />
        <Tab label={`Batches (${batches.length})`} />
      </Tabs>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <TextField
          placeholder={tab === 0 ? 'Search medicine...' : 'Search medicine or batch no...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: { xs: '100%', sm: 380 }, bgcolor: 'background.paper' }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
        />
        {tab === 0 && (
          <TextField select label="Show" value={filter} onChange={(e) => setFilter(e.target.value as StockFilter)} sx={{ width: 180, bgcolor: 'background.paper' }}>
            <MenuItem value="all">All medicines</MenuItem>
            <MenuItem value="low">Low stock</MenuItem>
            <MenuItem value="out">Out of stock</MenuItem>
          </TextField>
        )}
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableCard>
        {loading ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <CircularProgress size={28} />
          </Box>
        ) : tab === 0 ? (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Medicine</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell align="right">In Stock</TableCell>
                <TableCell align="right">Min Stock</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Batches</TableCell>
                <TableCell>Nearest Expiry</TableCell>
                <TableCell align="right">Value (MRP)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stockRows.length === 0 ? (
                <EmptyRow colSpan={8} text="Nothing to show." />
              ) : (
                stockRows.map((m) => {
                  const mb = batchesByMedicine.get(m.id) ?? [];
                  const nearest = mb.filter((b) => b.expiry_date).sort((a, b) => a.expiry_date!.localeCompare(b.expiry_date!))[0];
                  return (
                    <TableRow key={m.id} hover>
                      <TableCell>
                        <Typography fontWeight={700}>{m.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{m.generic_name}</Typography>
                      </TableCell>
                      <TableCell>{m.dosage_form || '—'}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{m.stock}</TableCell>
                      <TableCell align="right">{m.min_stock}</TableCell>
                      <TableCell><StockStatus stock={m.stock} min={m.min_stock} /></TableCell>
                      <TableCell align="center">{mb.length}</TableCell>
                      <TableCell>
                        {nearest ? (
                          <Box>
                            <Typography variant="body2">{shortDate(nearest.expiry_date)}</Typography>
                            <ExpiryChip batch={nearest} />
                          </Box>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell align="right">{rs(m.stock * m.price)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Batch No</TableCell>
                <TableCell>Medicine</TableCell>
                <TableCell>Expiry Date</TableCell>
                <TableCell>Expiry</TableCell>
                <TableCell align="right">Qty Left</TableCell>
                <TableCell align="right">Cost</TableCell>
                <TableCell align="right">MRP</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {batchRows.length === 0 ? (
                <EmptyRow colSpan={8} text="No batches. Stock arrives in batches when you record a purchase." />
              ) : (
                batchRows.map((b) => (
                  <TableRow key={b.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{b.batch_no}</TableCell>
                    <TableCell>{b.medicine_name}</TableCell>
                    <TableCell>{shortDate(b.expiry_date)}</TableCell>
                    <TableCell><ExpiryChip batch={b} /></TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{b.quantity}</TableCell>
                    <TableCell align="right">{rs(b.purchase_price)}</TableCell>
                    <TableCell align="right">{rs(b.sale_price)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Write off batch (expired / damaged)">
                        <IconButton color="error" onClick={() => setWritingOff(b)}>
                          <WriteOffIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </TableCard>

      <ConfirmDialog
        open={!!writingOff}
        title="Write off batch?"
        message={`${writingOff?.quantity ?? 0} unit(s) of ${writingOff?.medicine_name ?? ''} (batch ${writingOff?.batch_no ?? ''}) will be removed from stock.`}
        confirmLabel="Write off"
        onCancel={() => setWritingOff(null)}
        onConfirm={confirmWriteOff}
      />
      <Snackbar open={!!toast} autoHideDuration={2500} onClose={() => setToast('')} message={toast} />
    </Box>
  );
}
