import { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import OutpatientPanel from './OutpatientPanel';
import InpatientPanel from './InpatientPanel';

export default function PatientsTab() {
  const [sub, setSub] = useState(0);

  return (
    <Box>
      <Tabs
        value={sub}
        onChange={(_, v) => setSub(v)}
        sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Tab label="Outpatient" sx={{ textTransform: 'none', fontWeight: 600 }} />
        <Tab label="Inpatient" sx={{ textTransform: 'none', fontWeight: 600 }} />
      </Tabs>
      {sub === 0 ? <OutpatientPanel /> : <InpatientPanel />}
    </Box>
  );
}
