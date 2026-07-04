import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import DashboardHomePage from "./pages/admin/DashboardHomePage";
import FeeSettingsPage from "./pages/admin/FeeSettingsPage";
import DoctorsManagementPage from "./pages/admin/DoctorsManagementPage";
import DentistsManagementPage from "./pages/admin/DentistsManagementPage";
import AppointmentsManagementPage from "./pages/admin/AppointmentsManagementPage";
import DentistAppointmentsManagementPage from "./pages/admin/DentistAppointmentsManagementPage";
import LabBookingsManagementPage from "./pages/admin/LabBookingsManagementPage";
import LabTestsManagementPage from "./pages/admin/LabTestsManagementPage";
import AmbulancesManagementPage from "./pages/admin/AmbulancesManagementPage";
import AmbulanceBookingsManagementPage from "./pages/admin/AmbulanceBookingsManagementPage";
import NursesManagementPage from "./pages/admin/NursesManagementPage";
import NurseBookingsManagementPage from "./pages/admin/NurseBookingsManagementPage";
import PhysiotherapistsManagementPage from "./pages/admin/PhysiotherapistsManagementPage";
import PhysiotherapistBookingsManagementPage from "./pages/admin/PhysiotherapistBookingsManagementPage";
import PharmacyManagementPage from "./pages/admin/PharmacyManagementPage";
import PharmacyBookingsManagementPage from "./pages/admin/PharmacyBookingsManagementPage";
import PrescriptionsManagementPage from "./pages/admin/PrescriptionsManagementPage";
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

          {/* Admin Dashboard Home (protected, no sidebar) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <DashboardHomePage />
              </ProtectedRoute>
            }
          />

          {/* Admin Management Pages (protected, with sidebar) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="users" element={<UsersManagementPage />} />
            <Route path="doctors" element={<DoctorsManagementPage />} />
            <Route path="dentists" element={<DentistsManagementPage />} />
            <Route path="appointments" element={<AppointmentsManagementPage />} />
            <Route path="dentist-appointments" element={<DentistAppointmentsManagementPage />} />
            <Route path="lab-tests" element={<LabTestsManagementPage />} />
            <Route path="lab-bookings" element={<LabBookingsManagementPage />} />
            <Route path="ambulances" element={<AmbulancesManagementPage />} />
            <Route path="ambulance-bookings" element={<AmbulanceBookingsManagementPage />} />
            <Route path="nurses" element={<NursesManagementPage />} />
            <Route path="nurse-bookings" element={<NurseBookingsManagementPage />} />
            <Route path="physiotherapists" element={<PhysiotherapistsManagementPage />} />
            <Route path="physiotherapist-bookings" element={<PhysiotherapistBookingsManagementPage />} />
            <Route path="pharmacy" element={<PharmacyManagementPage />} />
            <Route path="pharmacy-orders" element={<PharmacyBookingsManagementPage />} />
            <Route path="prescriptions" element={<PrescriptionsManagementPage />} />
            <Route path="fee-settings" element={<FeeSettingsPage />} />
          </Route>

          {/* Catch all - redirect to admin login */}
          <Route path="*" element={<Navigate to="/admin/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
