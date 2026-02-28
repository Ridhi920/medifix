import { Button, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import PageShell from "../../components/PageShell";

export default function PediatricsServicePage() {
  return (
    <PageShell maxWidth="md">
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h4" fontWeight={700}>
            Pediatrics
          </Typography>
          <Typography color="text.secondary">
            Child wellness visits, vaccinations, and growth tracking in one place.
          </Typography>
        </Stack>
        <Stack spacing={2}>
          <Typography>
            Book pediatric specialists and receive follow-up reminders for routine care.
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
