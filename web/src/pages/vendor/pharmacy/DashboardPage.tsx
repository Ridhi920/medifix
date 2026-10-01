import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  PointOfSale as PosIcon,
  Refresh as RefreshIcon,
  TrendingUp as RevenueIcon,
  Inventory as StockIcon,
  Warning as WarnIcon,
  EventBusy as ExpiryIcon,
  AccountBalanceWallet as CreditIcon,
  LocalShipping as OrdersIcon,
} from '@mui/icons-material';
import pharmacyPosAPI, { PosDashboard, Sale, apiError } from '../../../api/pharmacyPosApi';
import ReceiptDialog from './ReceiptDialog';
import { ExpiryChip } from './StockPage';
import { EmptyRow, PageHeader, dateTime, rs } from './shared';

function Tile({
  label,
  value,
  sub,
  icon,
  onClick,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon: ReactNode;
  onClick?: () => void;
}) {
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        p: 2.5,
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow .15s',
        '&:hover': onClick ? { boxShadow: '0 4px 12px rgba(0,0,0,0.10)' } : undefined,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography color="text.secondary" fontSize={14}>
          {label}
        </Typography>
        <Box sx={{ color: 'text.secondary', display: 'flex' }}>{icon}</Box>
      </Box>
      <Typography sx={{ fontSize: 28, fontWeight: 500, lineHeight: 1.2 }}>{value}</Typography>
      {sub && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {sub}
        </Typography>
      )}
    </Paper>
  );
}

function Card({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      <Box sx={{ px: 2.5, py: 1.75, display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
        <Typography fontWeight={600} sx={{ flex: 1 }}>
          {title}
        </Typography>
        {action}
      </Box>
      {children}
    </Paper>
  );
}

/** Last 7 days of counter revenue: one series, so no legend; hover for values. */
function SalesBars({ days }: { days: PosDashboard['daily_sales'] }) {
  const max = Math.max(1, ...days.map((d) => d.revenue));
  const label = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
  return (
    <Box sx={{ px: 2.5, pt: 3, pb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: { xs: 1, sm: 2 }, height: 180, borderBottom: 1, borderColor: 'divider' }}>
        {days.map((d) => (
          <Tooltip
            key={d.date}
            arrow
            placement="top"
            title={
              <Box sx={{ textAlign: 'center' }}>
                <div>{label(d.date)}</div>
                <b>{rs(d.revenue)}</b>
                <div>{d.orders} sale(s)</div>
              </Box>
            }
          >
            {/* Hit target spans the full column height, larger than the bar */}
            <Box sx={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end', cursor: 'default', '&:hover > div': { opacity: 0.8 } }}>
              <Box
                sx={{
                  width: '100%',
                  maxWidth: 44,
                  mx: 'auto',
                  height: `${(d.revenue / max) * 100}%`,
                  minHeight: d.revenue ? 3 : 0,
                  bgcolor: 'primary.main',
                  borderRadius: '4px 4px 0 0',
                }}
              />
            </Box>
          </Tooltip>
        ))}
      </Box>
      <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, mt: 1 }}>
        {days.map((d) => (
          <Typography key={d.date} variant="caption" color="text.secondary" sx={{ flex: 1, textAlign: 'center' }}>
            {label(d.date)}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<PosDashboard | null>(null);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<Sale | null>(null);
  const navigate = useNavigate();

  const load = () =>
    pharmacyPosAPI
      .dashboard()
      .then((d) => {
        setData(d);
        setError('');
      })
      .catch((e) => setError(apiError(e, 'Failed to load dashboard')));

  useEffect(() => {
    load();
  }, []);

  if (!data) {
    return error ? (
      <Alert severity="error">{error}</Alert>
    ) : (
      <Box sx={{ py: 10, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  const weekRevenue = data.daily_sales.reduce((s, d) => s + d.revenue, 0);

  return (
    <Box>
      <PageHeader
        title={`Dashboard · ${data.store_name}`}
        actions={
          <>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load} sx={{ bgcolor: 'background.paper' }}>
              Refresh
            </Button>
            <Button variant="contained" startIcon={<PosIcon />} onClick={() => navigate('pos')}>
              New Sale
            </Button>
          </>
        }
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2.5, mb: 3 }}>
        <Tile label="Today's Sales" value={rs(data.today_revenue)} sub={`${data.today_orders} order(s)`} icon={<RevenueIcon />} />
        <Tile label="This Month" value={rs(data.month_revenue)} sub={`${data.month_orders} order(s)`} icon={<RevenueIcon />} onClick={() => navigate('reports')} />
        <Tile label="Medicines" value={data.total_medicines} sub={`Stock value ${rs(data.stock_value)}`} icon={<StockIcon />} onClick={() => navigate('medicines')} />
        <Tile label="Low Stock" value={data.low_stock_count} sub="at or below min stock" icon={<WarnIcon />} onClick={() => navigate('stock')} />
        <Tile label="Expiring Soon" value={data.expiring_count} sub={`${data.expired_count} batch(es) already expired`} icon={<ExpiryIcon />} onClick={() => navigate('reports')} />
        <Tile label="Credit Outstanding" value={rs(data.credit_due)} sub="owed by customers" icon={<CreditIcon />} onClick={() => navigate('customers')} />
        <Tile label="Online Orders" value={data.pending_online_orders} sub="awaiting dispatch from the app" icon={<OrdersIcon />} onClick={() => navigate('orders')} />
        <Tile label="Last 7 Days" value={rs(weekRevenue)} sub={`${data.daily_sales.reduce((s, d) => s + d.orders, 0)} order(s)`} icon={<RevenueIcon />} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '3fr 2fr' }, gap: 2.5, mb: 2.5 }}>
        <Card title="Sales · last 7 days">
          <SalesBars days={data.daily_sales} />
        </Card>
        <Card title="Low Stock" action={<Button size="small" onClick={() => navigate('purchases')}>Restock</Button>}>
          <Table size="small">
            <TableBody>
              {data.low_stock.length === 0 ? (
                <EmptyRow colSpan={2} text="All medicines are above their minimum stock." />
              ) : (
                data.low_stock.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <Typography fontWeight={600} fontSize={14}>{m.name}</Typography>
                      <Typography variant="caption" color="text.secondary">min {m.min_stock}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip size="small" color={m.stock <= 0 ? 'error' : 'warning'} label={`${m.stock} left`} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '3fr 2fr' }, gap: 2.5 }}>
        <Card title="Recent Sales" action={<Button size="small" onClick={() => navigate('reports')}>View all</Button>}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Receipt #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.recent_sales.length === 0 ? (
                  <EmptyRow colSpan={4} text="No sales yet." />
                ) : (
                  data.recent_sales.map((s) => (
                    <TableRow key={s.id} hover sx={{ cursor: 'pointer' }} onClick={() => setReceipt(s)}>
                      <TableCell>{s.receipt_no}</TableCell>
                      <TableCell>{s.customer_name}</TableCell>
                      <TableCell>{dateTime(s.created_at)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{rs(s.total)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
        </Card>
        <Card title="Expiring Soon" action={<Button size="small" onClick={() => navigate('stock')}>Batches</Button>}>
          <Table size="small">
            <TableBody>
              {data.expiring_soon.length === 0 ? (
                <EmptyRow colSpan={2} text="No batches expiring in the next 90 days." />
              ) : (
                data.expiring_soon.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <Typography fontWeight={600} fontSize={14}>{b.medicine_name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Batch {b.batch_no} · {b.quantity} units
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <ExpiryChip batch={b} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </Box>
      <ReceiptDialog sale={receipt} onClose={() => setReceipt(null)} />
    </Box>
  );
}
