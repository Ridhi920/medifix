import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import DoctorsManagementPage from "./pages/admin/DoctorsManagementPage";
import AppointmentsManagementPage from "./pages/admin/AppointmentsManagementPage";
import LabBookingsManagementPage from "./pages/admin/LabBookingsManagementPage";
import LabTestsManagementPage from "./pages/admin/LabTestsManagementPage";
import AmbulancesManagementPage from "./pages/admin/AmbulancesManagementPage";
import AmbulanceBookingsManagementPage from "./pages/admin/AmbulanceBookingsManagementPage";
import UsersManagementPage from "./pages/admin/UsersManagementPage";

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
            <Route index element={<Navigate to="/admin/users" replace />} />
            <Route path="users" element={<UsersManagementPage />} />
            <Route path="doctors" element={<DoctorsManagementPage />} />
            <Route path="appointments" element={<AppointmentsManagementPage />} />
            <Route path="lab-tests" element={<LabTestsManagementPage />} />
            <Route path="lab-bookings" element={<LabBookingsManagementPage />} />
            <Route path="ambulances" element={<AmbulancesManagementPage />} />
            <Route path="ambulance-bookings" element={<AmbulanceBookingsManagementPage />} />
          </Route>

          {/* Catch all - redirect to admin login */}
          <Route path="*" element={<Navigate to="/admin/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
