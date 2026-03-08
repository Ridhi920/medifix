import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import DashboardHomePage from "./pages/admin/DashboardHomePage";
import DoctorsManagementPage from "./pages/admin/DoctorsManagementPage";
import AppointmentsManagementPage from "./pages/admin/AppointmentsManagementPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Redirect root to admin login */}
          <Route path="/" element={<Navigate to="/admin/login" replace />} />

          {/* Admin Login (not protected) */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Admin Dashboard (protected) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardHomePage />} />
            <Route path="doctors" element={<DoctorsManagementPage />} />
            <Route path="appointments" element={<AppointmentsManagementPage />} />
          </Route>

          {/* Catch all - redirect to admin login */}
          <Route path="*" element={<Navigate to="/admin/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
