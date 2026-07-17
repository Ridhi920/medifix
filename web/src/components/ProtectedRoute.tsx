import { Navigate } from 'react-router-dom';
import { useAuth, isVendorRole } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  // Which roles may see this route: 'admin' and/or 'vendor'.
  // Defaults to admin-only so existing admin pages stay locked down.
  allow?: Array<'admin' | 'vendor'>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allow = ['admin'] }) => {
  const { token, user, isLoading } = useAuth();

  if (isLoading || (token && !user)) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!token || !user) {
    return <Navigate to="/admin/login" replace />;
  }

  const isAdmin = user.role === 'admin';
  const isVendor = isVendorRole(user.role);

  if (isAdmin && !allow.includes('admin')) {
    return <Navigate to="/admin" replace />;
  }

  if (isVendor && !allow.includes('vendor')) {
    // Vendors only ever see their own dashboard
    return <Navigate to="/vendor" replace />;
  }

  if (!isAdmin && !isVendor) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};
