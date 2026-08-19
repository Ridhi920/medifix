import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import DashboardHomePage from "./pages/admin/DashboardHomePage";
import FeeSettingsPage from "./pages/admin/FeeSettingsPage";
import ServiceAvailabilityPage from "./pages/admin/ServiceAvailabilityPage";
import ReviewsManagementPage from "./pages/admin/ReviewsManagementPage";
import WhyChooseManagementPage from "./pages/admin/WhyChooseManagementPage";
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
import VendorApprovalsPage from "./pages/admin/VendorApprovalsPage";
import DigitalLogbookPage from "./pages/admin/DigitalLogbookPage";
import ServiceRequestsPage from "./pages/admin/ServiceRequestsPage";
import InpatientManagementPage from "./pages/admin/InpatientManagementPage";
import VendorSignupPage from "./pages/vendor/VendorSignupPage";
import VendorDashboardPage from "./pages/vendor/VendorDashboardPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Redirect root to admin login */}
          <Route path="/" element={<Navigate to="/admin/login" replace />} />

          {/* Portal Login for admins and vendors (not protected) */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Vendor signup (not protected) */}
          <Route path="/vendor/signup" element={<VendorSignupPage />} />

          {/* Vendor dashboard - vendors only see their own bookings */}
          <Route
            path="/vendor"
            element={
              <ProtectedRoute allow={["vendor"]}>
                <VendorDashboardPage />
              </ProtectedRoute>
            }
          />

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
            <Route path="service-availability" element={<ServiceAvailabilityPage />} />
            <Route path="reviews" element={<ReviewsManagementPage />} />
            <Route path="why-choose" element={<WhyChooseManagementPage />} />
            <Route path="vendor-approvals" element={<VendorApprovalsPage />} />
            <Route path="logbook" element={<DigitalLogbookPage />} />
            <Route path="service-requests" element={<ServiceRequestsPage />} />
            <Route path="inpatients" element={<InpatientManagementPage />} />
          </Route>

          {/* Catch all - redirect to admin login */}
          <Route path="*" element={<Navigate to="/admin/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
