import { Box, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import PageShell from "../../components/PageShell";

export default function LoginPage() {
  return (
    <PageShell center maxWidth="sm">
      <Card sx={{ borderRadius: 4, boxShadow: "0 20px 40px rgba(15, 23, 42, 0.08)" }}>
        <CardContent>
          <Stack spacing={3}>
            <Box textAlign="center">
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Welcome Back
              </Typography>
              <Typography color="text.secondary">
                Login to access your dashboard.
              </Typography>
            </Box>

            <Stack spacing={2}>
              <TextField label="Email address" fullWidth />
              <TextField label="Password" type="password" fullWidth />
            </Stack>

            <Button
              component={RouterLink}
              to="/forgot"
              variant="text"
              sx={{ 
                alignSelf: "flex-end",
                color: "#FF6B35"
              }}
            >
              Forgot password?
            </Button>

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
              Login
            </Button>

            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Don't have an account?
              </Typography>
              <Button 
                component={RouterLink} 
                to="/signup" 
                variant="text"
                sx={{ color: "#FF6B35" }}
              >
                Sign up
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </PageShell>
  );
}
