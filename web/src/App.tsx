import { BrowserRouter, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import ForgotPage from "./pages/auth/ForgotPage";
import HomePage from "./pages/HomePage";
import ServicesIndexPage from "./pages/services/ServicesIndexPage";
import DentalServicePage from "./pages/services/DentalServicePage";
import CardiologyServicePage from "./pages/services/CardiologyServicePage";
import PediatricsServicePage from "./pages/services/PediatricsServicePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot" element={<ForgotPage />} />
        <Route path="/services" element={<ServicesIndexPage />} />
        <Route path="/services/dental" element={<DentalServicePage />} />
        <Route path="/services/cardiology" element={<CardiologyServicePage />} />
        <Route path="/services/pediatrics" element={<PediatricsServicePage />} />
      </Routes>
    </BrowserRouter>
  );
}
