import { Button, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import PageShell from "../../components/PageShell";

export default function CardiologyServicePage() {
  return (
    <PageShell maxWidth="md">
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h4" fontWeight={700}>
            Cardiology
          </Typography>
          <Typography color="text.secondary">
            Book cardiologist consultations, diagnostics, and long-term monitoring.
          </Typography>
        </Stack>
        <Stack spacing={2}>
          <Typography>
            Access ECG, echo, and lab coordination with coordinated follow-up scheduling.
          </Typography>
          <Button 
            component={RouterLink} 
            to="/services" 
            variant="contained"
            sx={{
              backgroundColor: "#FF6B35",
              "&:hover": {
                backgroundColor: "#E85A28"
              }
            }}
          >
            Back to Services
          </Button>
        </Stack>
      </Stack>
    </PageShell>
  );
}
