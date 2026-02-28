import { Box, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import PageShell from "../../components/PageShell";

export default function SignupPage() {
  return (
    <PageShell center maxWidth="sm">
      <Card sx={{ borderRadius: 4, boxShadow: "0 20px 40px rgba(15, 23, 42, 0.08)" }}>
        <CardContent>
          <Stack spacing={3}>
            <Box textAlign="center">
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Create Account
              </Typography>
              <Typography color="text.secondary">
                Sign up to get started with MedEfix.
              </Typography>
            </Box>

            <Stack spacing={2}>
              <TextField label="Full name" fullWidth />
              <TextField label="Email address" fullWidth />
              <TextField label="Password" type="password" fullWidth />
              <TextField label="Confirm password" type="password" fullWidth />
            </Stack>

            <Typography variant="body2" color="text.secondary" textAlign="center">
              By signing up, you agree to our Terms & Conditions.
            </Typography>

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
              Sign Up
            </Button>

            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Already have an account?
              </Typography>
              <Button 
                component={RouterLink} 
                to="/login" 
                variant="text"
                sx={{ color: "#FF6B35" }}
              >
                Login
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </PageShell>
  );
}
