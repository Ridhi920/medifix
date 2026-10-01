import { Fragment, useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon, Delete as DeleteIcon } from '@mui/icons-material';
import vendorAPI, { VendorMedicine } from '../../../api/vendorApi';
import pharmacyPosAPI, { Purchase, PurchaseInput, apiError } from '../../../api/pharmacyPosApi';
import { EmptyRow, PageHeader, TableCard, isoDay, rs, shortDate } from './shared';

type Line = {
  medicine: VendorMedicine | null;
  batch_no: string;
  expiry_date: string;
  quantity: string;
  purchase_price: string;
  sale_price: string;
};

const emptyLine = (): Line => ({ medicine: null, batch_no: '', expiry_date: '', quantity: '', purchase_price: '', sale_price: '' });

function NewPurchaseDialog({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [medicines, setMedicines] = useState<VendorMedicine[]>([]);
  const [supplier, setSupplier] = useState('');
  const [invoice, setInvoice] = useState('');
  const [date, setDate] = useState(isoDay(new Date()));
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSupplier('');
    setInvoice('');
    setDate(isoDay(new Date()));
    setLines([emptyLine()]);
    setError('');
    vendorAPI.getMyMedicines().then(setMedicines).catch(() => setError('Failed to load medicines'));
  }, [open]);

  const setLine = (i: number, patch: Partial<Line>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const total = lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.purchase_price) || 0), 0);

  const save = async () => {
    const valid = lines.filter((l) => l.medicine);
    if (!supplier.trim()) return setError('Supplier is required');
    if (!valid.length) return setError('Add at least one medicine');
    if (valid.some((l) => !l.batch_no.trim() || !(Number(l.quantity) > 0) || l.purchase_price === '')) {
      return setError('Each line needs a batch no, quantity and purchase price');
    }
    const payload: PurchaseInput = {
      supplier_name: supplier.trim(),
      invoice_no: invoice.trim() || null,
      purchase_date: date || null,
      items: valid.map((l) => ({
        medicine_id: l.medicine!.id,
        batch_no: l.batch_no.trim(),
        expiry_date: l.expiry_date || null,
        quantity: Number(l.quantity),
        purchase_price: Number(l.purchase_price),
        sale_price: l.sale_price === '' ? null : Number(l.sale_price),
      })),
    };
    setSaving(true);
    try {
      await pharmacyPosAPI.createPurchase(payload);
      onSaved();
      onClose();
    } catch (e) {
      setError(apiError(e, 'Failed to save purchase'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>New Purchase</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <TextField label="Supplier *" value={supplier} onChange={(e) => setSupplier(e.target.value)} fullWidth />
          <TextField label="Invoice No" value={invoice} onChange={(e) => setInvoice(e.target.value)} fullWidth />
          <TextField label="Purchase Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
        </Stack>
        <Stack spacing={1.5}>
          {lines.map((l, i) => (
            <Stack key={i} direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
              <Autocomplete
                sx={{ flex: 2, minWidth: 220 }}
                options={medicines}
                value={l.medicine}
                getOptionLabel={(m) => `${m.name}${m.strength ? ` ${m.strength}` : ''}`}
                onChange={(_, m) => setLine(i, { medicine: m, sale_price: m ? String(m.price) : '' })}
                renderInput={(p) => <TextField {...p} label="Medicine" size="small" />}
              />
              <TextField size="small" label="Batch No" value={l.batch_no} onChange={(e) => setLine(i, { batch_no: e.target.value })} sx={{ flex: 1 }} />
              <TextField size="small" label="Expiry" type="date" value={l.expiry_date} onChange={(e) => setLine(i, { expiry_date: e.target.value })} InputLabelProps={{ shrink: true }} sx={{ flex: 1 }} />
              <TextField size="small" label="Qty" type="number" value={l.quantity} onChange={(e) => setLine(i, { quantity: e.target.value })} sx={{ width: { md: 90 } }} />
              <TextField size="small" label="Cost / unit" type="number" value={l.purchase_price} onChange={(e) => setLine(i, { purchase_price: e.target.value })} sx={{ width: { md: 120 } }} />
              <TextField size="small" label="MRP / unit" type="number" value={l.sale_price} onChange={(e) => setLine(i, { sale_price: e.target.value })} sx={{ width: { md: 120 } }} />
              <IconButton color="error" onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((_, j) => j !== i) : [emptyLine()]))} aria-label="Remove line">
                <DeleteIcon />
              </IconButton>
            </Stack>
          ))}
        </Stack>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Button startIcon={<AddIcon />} onClick={() => setLines((ls) => [...ls, emptyLine()])}>
            Add line
          </Button>
          <Typography variant="h6">Total: {rs(total)}</Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save Purchase'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setPurchases(await pharmacyPosAPI.getPurchases());
      setError('');
    } catch (e) {
      setError(apiError(e, 'Failed to load purchases'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Box>
      <PageHeader
        title="Purchase Management"
        actions={
          <>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load} sx={{ bgcolor: 'background.paper' }}>
              Refresh
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
              New Purchase
            </Button>
          </>
        }
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TableCard>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Invoice No</TableCell>
              <TableCell align="center">Items</TableCell>
              <TableCell align="right">Total Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : purchases.length === 0 ? (
              <EmptyRow colSpan={6} text="No purchases yet. Record your first supplier invoice." />
            ) : (
              purchases.map((p) => (
                <Fragment key={p.id}>
                  <TableRow hover sx={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                    <TableCell>#{p.id}</TableCell>
                    <TableCell>{shortDate(p.purchase_date)}</TableCell>
                    <TableCell>{p.supplier_name}</TableCell>
                    <TableCell>{p.invoice_no || '—'}</TableCell>
                    <TableCell align="center">
                      <Chip size="small" label={p.item_count} sx={{ minWidth: 28 }} />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{rs(p.total_amount)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={6} className="flush" sx={{ p: 0, borderBottom: expanded === p.id ? undefined : 0 }}>
                      <Collapse in={expanded === p.id} unmountOnExit>
                        <Box sx={{ px: 3, py: 2, bgcolor: 'action.hover' }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Medicine</TableCell>
                                <TableCell>Batch</TableCell>
                                <TableCell>Expiry</TableCell>
                                <TableCell align="right">Qty</TableCell>
                                <TableCell align="right">Cost</TableCell>
                                <TableCell align="right">MRP</TableCell>
                                <TableCell align="right">Amount</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {p.items.map((it, i) => (
                                <TableRow key={i}>
                                  <TableCell>{it.medicine_name}</TableCell>
                                  <TableCell>{it.batch_no}</TableCell>
                                  <TableCell>{shortDate(it.expiry_date)}</TableCell>
                                  <TableCell align="right">{it.quantity}</TableCell>
                                  <TableCell align="right">{rs(it.purchase_price)}</TableCell>
                                  <TableCell align="right">{rs(it.sale_price)}</TableCell>
                                  <TableCell align="right">{rs(it.amount)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          {p.notes && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              Note: {p.notes}
                            </Typography>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </TableCard>
      <NewPurchaseDialog open={open} onClose={() => setOpen(false)} onSaved={load} />
    </Box>
  );
}
