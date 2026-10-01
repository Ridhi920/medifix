import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import vendorAPI from '../../../api/vendorApi';
import ProfileTab from '../tabs/ProfileTab';
import { clearStoreInfoCache } from './ReceiptDialog';
import { PageHeader } from './shared';

/** Store profile (name, address, phone shown on receipts), logo and account. */
export default function SettingsPage() {
  const [logo, setLogo] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    vendorAPI
      .getMyProfile()
      .then((p) => setLogo(p.logo ?? null))
      .catch(() => setLogo(null));
    // Receipts re-read the store header after any edit made here.
    return clearStoreInfoCache;
  }, []);

  return (
    <Box>
      <PageHeader title="Settings" />
      {logo !== undefined && <ProfileTab initialLogo={logo} />}
    </Box>
  );
}
