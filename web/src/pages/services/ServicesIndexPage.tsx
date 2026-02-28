import { Button, Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import PageShell from "../../components/PageShell";

const services = [
  {
    slug: "dental",
    title: "Dental Care",
    description: "Book dentist appointments, cleanings, and urgent dental care visits."
  },
  {
    slug: "cardiology",
    title: "Cardiology",
    description: "Specialist cardiac consultations, tests, and follow-up schedules."
  },
  {
    slug: "pediatrics",
    title: "Pediatrics",
    description: "Care plans, vaccinations, and wellness visits for children."
  }
];

export default function ServicesIndexPage() {
  return (
    <PageShell maxWidth="lg">
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h4" fontWeight={700}>
            Services
          </Typography>
          <Typography color="text.secondary">
            Explore MedEfix care offerings and book with confidence.
          </Typography>
        </Stack>

        <Grid container spacing={3}>
          {services.map((service) => (
            <Grid key={service.slug} item xs={12} md={4}>
              <Card sx={{ borderRadius: 4, height: "100%" }}>
                <CardContent>
                  <Stack spacing={2}>
                    <Typography variant="h6" fontWeight={700}>
                      {service.title}
                    </Typography>
                    <Typography color="text.secondary">
                      {service.description}
                    </Typography>
                    <Button
                      component={RouterLink}
                      to={`/services/${service.slug}`}
                      variant="contained"
                      sx={{
                        backgroundColor: "#FF6B35",
                        "&:hover": {
                          backgroundColor: "#E85A28"
                        }
                      }}
                    >
                      View Details
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Stack>
    </PageShell>
  );
}
