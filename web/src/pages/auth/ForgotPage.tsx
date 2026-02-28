import { Box, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import PageShell from "../../components/PageShell";

export default function ForgotPage() {
  return (
    <PageShell center maxWidth="sm">
      <Card sx={{ borderRadius: 4, boxShadow: "0 20px 40px rgba(15, 23, 42, 0.08)" }}>
        <CardContent>
          <Stack spacing={3}>
            <Box textAlign="center">
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Forgot Password
              </Typography>
              <Typography color="text.secondary">
                Enter the email associated with your account.
              </Typography>
            </Box>

            <Stack spacing={2}>
              <TextField label="Email address" fullWidth />
            </Stack>

            <Button 
              variant="contained" 
              size="large"
              sx={{
                backgroundColor: "#FF6B35",
                "&:hover": {
                  backgroundColor: "#E85A28"
                }
              }}
            >
              Send Reset Link
            </Button>

            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Remembered your password?
              </Typography>
              <Button 
                component={RouterLink} 
                to="/login" 
                variant="text"
                sx={{ color: "#FF6B35" }}
              >
                Back to login
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </PageShell>
  );
}
