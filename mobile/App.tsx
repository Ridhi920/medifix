import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";
import { SERVICES, type ServiceKey } from "./src/data/services";
import { styles } from "./src/styles";
import LoginScreen from "./src/screens/auth/LoginScreen";
import SignupScreen from "./src/screens/auth/SignupScreen";
import ForgotScreen from "./src/screens/auth/ForgotScreen";
import HomeScreen from "./src/screens/home/HomeScreen";
import ServicesListScreen from "./src/screens/services/ServicesListScreen";
import DentalServiceScreen from "./src/screens/services/DentalServiceScreen";
import CardiologyServiceScreen from "./src/screens/services/CardiologyServiceScreen";
import PediatricsServiceScreen from "./src/screens/services/PediatricsServiceScreen";
import DoctorAppointmentScreen from "./src/screens/appointments/DoctorAppointmentScreen";
import AmbulanceBookingScreen from "./src/screens/ambulance/AmbulanceBookingScreen";
import LabTestBookingScreen from "./src/screens/lab/LabTestBookingScreen";
import PharmacyScreen from "./src/screens/pharmacy/PharmacyScreen";

type Screen =
  | "login"
  | "signup"
  | "forgot"
  | "home"
  | "services"
  | "service-dental"
  | "service-cardiology"
  | "service-pediatrics"
  | "appointments"
  | "ambulance"
  | "lab"
  | "pharmacy";

const serviceScreenMap: Record<ServiceKey, Screen> = {
  dental: "appointments",
  cardiology: "service-cardiology",
  pediatrics: "service-pediatrics",
  ambulance: "ambulance",
  lab: "lab",
  pharmacy: "pharmacy"
};

function renderScreen(
  screen: Screen,
  menuOpen: boolean,
  setScreen: (screen: Screen) => void,
  setMenuOpen: (value: boolean) => void
) {
  switch (screen) {
    case "login":
      return (
        <LoginScreen
          onLogin={() => setScreen("home")}
          onSwitchToSignup={() => setScreen("signup")}
          onForgot={() => setScreen("forgot")}
        />
      );
    case "signup":
      return (
        <SignupScreen
          onSignup={() => setScreen("home")}
          onSwitchToLogin={() => setScreen("login")}
        />
      );
    case "forgot":
      return (
        <ForgotScreen
          onSendOtp={() => setScreen("login")}
          onBackToLogin={() => setScreen("login")}
        />
      );
    case "home":
      return (
        <HomeScreen
          services={SERVICES}
          menuOpen={menuOpen}
          onToggleMenu={() => setMenuOpen(!menuOpen)}
          onSelectService={(key: ServiceKey) => setScreen(serviceScreenMap[key])}
          onOpenServices={() => setScreen("services")}
          onOpenAppointments={() => setScreen("appointments")}
          onOpenAmbulance={() => setScreen("ambulance")}
          onOpenPharmacy={() => setScreen("pharmacy")}
        />
      );
    case "appointments":
      return <DoctorAppointmentScreen onBack={() => setScreen("services")} />;
    case "ambulance":
      return <AmbulanceBookingScreen onBack={() => setScreen("services")} />;
    case "services":
      return (
        <ServicesListScreen
          services={SERVICES}
          onSelectService={(key: ServiceKey) => setScreen(serviceScreenMap[key])}
          onBack={() => setScreen("home")}
        />
      );
    case "service-dental":
      return <DentalServiceScreen onBack={() => setScreen("services")} />;
    case "service-cardiology":
      return <CardiologyServiceScreen onBack={() => setScreen("services")} />;
    case "service-pediatrics":
      return <PediatricsServiceScreen onBack={() => setScreen("services")} />;
    case "lab":
      return <LabTestBookingScreen onBack={() => setScreen("services")} />;
    case "pharmacy":
      return <PharmacyScreen onBack={() => setScreen("services")} />;
    default:
      return null;
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [menuOpen, setMenuOpen] = useState(false);

  const isAuthScreen = screen === "login" || screen === "signup" || screen === "forgot";
  const containerStyle = screen === "home" || !isAuthScreen ? { flex: 1 } : styles.container;

  return (
    <LinearGradient
      colors={screen === "home" ? ["#f8fafc", "#ffffff", "#ffffff"] : ["#FFE8DD", "#FFF5F0", "#ffffff"]}
      locations={[0, 0.45, 1]}
      style={styles.gradient}
    >
      <View style={containerStyle}>
        <StatusBar style="dark" />
        {renderScreen(screen, menuOpen, setScreen, setMenuOpen)}
      </View>
    </LinearGradient>
  );
}
