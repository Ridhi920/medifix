import { useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Typography } from '@mui/material';
import { Print as PrintIcon } from '@mui/icons-material';
import vendorAPI from '../../../api/vendorApi';
import type { Sale } from '../../../api/pharmacyPosApi';
import { rs } from './shared';

export type StoreInfo = { name: string; address: string; phone: string };

let storeCache: StoreInfo | null = null;

/** The vendor's store header for receipts, fetched once per session. */
export function useStoreInfo(): StoreInfo {
  const [info, setInfo] = useState<StoreInfo>(storeCache ?? { name: 'Pharmacy', address: '', phone: '' });
  useEffect(() => {
    if (storeCache) return;
    vendorAPI
      .getMyBusinessProfile()
      .then((p) => {
        storeCache = {
          name: p?.name ?? 'Pharmacy',
          address: [p?.address, p?.city].filter(Boolean).join(', '),
          phone: p?.phone ?? '',
        };
        setInfo(storeCache);
      })
      .catch(() => undefined);
  }, []);
  return info;
}

export const clearStoreInfoCache = () => {
  storeCache = null;
};

const receiptDate = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' });

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** Open a small print-only window with an 80mm-style receipt. */
function printReceipt(sale: Sale, store: StoreInfo) {
  const rows = sale.items
    .map((i) => `<tr><td>${escapeHtml(i.medicine_name)}</td><td class="c">${i.quantity}</td><td class="r">${rs(i.amount)}</td></tr>`)
    .join('');
  const line = (label: string, value: string, bold = false) =>
    `<div class="row${bold ? ' b' : ''}"><span>${label}</span><span>${value}</span></div>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${sale.receipt_no}</title><style>
    body{font-family:Arial,sans-serif;font-size:12px;width:300px;margin:12px auto;color:#000}
    h2{margin:0;font-size:16px;text-align:center}.ctr{text-align:center}
    .row{display:flex;justify-content:space-between;margin:3px 0}.b{font-weight:bold;font-size:14px}
    table{width:100%;border-collapse:collapse;margin:8px 0}th,td{padding:3px 0;text-align:left}
    th{border-bottom:1px dashed #000}.c{text-align:center}.r{text-align:right}hr{border:0;border-top:1px dashed #000}
  </style></head><body>
    <h2>${escapeHtml(store.name.toUpperCase())}</h2>
    <div class="ctr">${escapeHtml(store.address)}</div>
    ${store.phone ? `<div class="ctr">Phone: ${escapeHtml(store.phone)}</div>` : ''}<hr/>
    ${line('Receipt No:', sale.receipt_no)}${line('Date:', receiptDate(sale.created_at))}
    ${line('Customer:', escapeHtml(sale.customer_name))}${line('Type:', sale.sale_type.toUpperCase())}
    <table><tr><th>Item</th><th class="c">Qty</th><th class="r">Amount</th></tr>${rows}</table><hr/>
    ${line('Subtotal:', rs(sale.subtotal))}${sale.discount ? line('Discount:', '-' + rs(sale.discount)) : ''}
    ${line('Total:', rs(sale.total), true)}${line('Paid:', rs(sale.paid_amount))}
    ${sale.balance_due > 0 ? line('Balance Due:', rs(sale.balance_due)) : ''}
    <p class="ctr">Thank you for your visit!</p>
    <script>window.onload=function(){window.print();setTimeout(function(){window.close()},300)}</script>
  </body></html>`;
  const w = window.open('', '_blank', 'width=380,height=640');
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 0.5 }}>
      <Typography variant="body2" fontWeight={bold ? 700 : 400} fontSize={bold ? 16 : undefined}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={bold ? 700 : 500} fontSize={bold ? 16 : undefined}>
        {value}
      </Typography>
    </Box>
  );
}

export default function ReceiptDialog({ sale, onClose }: { sale: Sale | null; onClose: () => void }) {
  const store = useStoreInfo();
  return (
    <Dialog open={!!sale} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', borderBottom: 1, borderColor: 'divider', fontWeight: 400 }}>Receipt Preview</DialogTitle>
      {sale && (
        <DialogContent sx={{ px: 4 }}>
          <Box sx={{ textAlign: 'center', py: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography fontWeight={700} fontSize={18}>
              {store.name.toUpperCase()}
            </Typography>
            {store.address && <Typography variant="body2">{store.address}</Typography>}
            {store.phone && <Typography variant="body2">Phone: {store.phone}</Typography>}
          </Box>
          <Box sx={{ py: 2 }}>
            <Line label="Receipt No:" value={sale.receipt_no} />
            <Line label="Date:" value={receiptDate(sale.created_at)} />
            <Line label="Customer:" value={sale.customer_name} />
            <Line label="Type:" value={sale.sale_type.toUpperCase()} />
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 48px 96px', rowGap: 1, borderBottom: '1px dashed', borderColor: 'text.secondary', pb: 1 }}>
            <Typography variant="body2" fontWeight={600}>Item</Typography>
            <Typography variant="body2" fontWeight={600} align="center">Qty</Typography>
            <Typography variant="body2" fontWeight={600} align="right">Amount</Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 48px 96px', rowGap: 1, py: 1.5 }}>
            {sale.items.map((i, k) => (
              <Box key={k} sx={{ display: 'contents' }}>
                <Typography variant="body2">{i.medicine_name}</Typography>
                <Typography variant="body2" align="center">{i.quantity}</Typography>
                <Typography variant="body2" align="right">{rs(i.amount)}</Typography>
              </Box>
            ))}
          </Box>
          <Divider sx={{ mb: 1.5 }} />
          <Line label="Subtotal:" value={rs(sale.subtotal)} />
          {sale.discount > 0 && <Line label="Discount:" value={`-${rs(sale.discount)}`} />}
          <Line label="Total:" value={rs(sale.total)} bold />
          <Line label="Paid:" value={rs(sale.paid_amount)} />
          {sale.balance_due > 0 && <Line label="Balance Due:" value={rs(sale.balance_due)} />}
          <Typography variant="body2" align="center" sx={{ mt: 3 }}>
            Thank you for your visit!
          </Typography>
        </DialogContent>
      )}
      <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" startIcon={<PrintIcon />} onClick={() => sale && printReceipt(sale, store)}>
          Print
        </Button>
      </DialogActions>
    </Dialog>
  );
}
