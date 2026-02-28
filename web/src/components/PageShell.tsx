import { type ReactNode } from "react";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

type PageShellProps = {
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
  center?: boolean;
};

export default function PageShell({
  children,
  maxWidth = "lg",
  center = false
}: PageShellProps) {
  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#F5F7FA" }}>
      <Box sx={{ 
        background: "linear-gradient(135deg, #FF6B35 0%, #FF8A5C 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.1)" 
      }}>
        <Container maxWidth="lg">
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ py: 2 }}
          >
            <Typography variant="h6" fontWeight={700} color="white">
              MedEfix
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Button 
                component={RouterLink} 
                to="/" 
                sx={{ color: "white" }}
              >
                Home
              </Button>
              <Button 
                component={RouterLink} 
                to="/services" 
                sx={{ color: "white" }}
              >
                Services
              </Button>
              <Button 
                component={RouterLink} 
                to="/login" 
                sx={{ color: "white" }}
              >
                Login
              </Button>
              <Button 
                component={RouterLink} 
                to="/signup" 
                variant="contained"
                sx={{
                  backgroundColor: "white",
                  color: "#FF6B35",
                  fontWeight: 700,
                  "&:hover": {
                    backgroundColor: "#f5f5f5"
                  }
                }}
              >
                Sign up
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container
        maxWidth={maxWidth}
        sx={{
          py: center ? 8 : 4,
          display: center ? "grid" : "block",
          placeItems: center ? "center" : "initial"
        }}
      >
        {children}
      </Container>
    </Box>
  );
}
