import { Button, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import PageShell from "../../components/PageShell";

export default function DentalServicePage() {
  return (
    <PageShell maxWidth="md">
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h4" fontWeight={700}>
            Dental Care
          </Typography>
          <Typography color="text.secondary">
            Schedule cleanings, fillings, and urgent care visits with certified dentists.
          </Typography>
        </Stack>
        <Stack spacing={2}>
          <Typography>
            Choose from in-clinic appointments or home follow-ups with our partner network.
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
