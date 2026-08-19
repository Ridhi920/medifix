import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { View, Image, StyleSheet, ImageBackground } from "react-native";
import { AuthProvider } from "./src/context/AuthContext";
import { SERVICES, type ServiceKey } from "./src/data/services";
import { styles } from "./src/styles";
import LoginScreen from "./src/screens/auth/LoginScreen";
import SignupScreen from "./src/screens/auth/SignupScreen";
import ForgotScreen from "./src/screens/auth/ForgotScreen";
import HomeScreen from "./src/screens/home/HomeScreen";
import SupportScreen from "./src/screens/support/SupportScreen";
import ServicesListScreen from "./src/screens/services/ServicesListScreen";
import DentalServiceScreen from "./src/screens/services/DentalServiceScreen";

import DoctorAppointmentScreen from "./src/screens/appointments/DoctorAppointmentScreen";
import DentistAppointmentScreen from "./src/screens/appointments/DentistAppointmentScreen";
import AmbulanceBookingScreen from "./src/screens/ambulance/AmbulanceBookingScreen";
import LabTestBookingScreen from "./src/screens/lab/LabTestBookingScreen";
import NurseBookingScreen from "./src/screens/nurse/NurseBookingScreen";
import PhysiotherapistBookingScreen from "./src/screens/physiotherapist/PhysiotherapistBookingScreen";
import PharmacyScreen from "./src/screens/pharmacy/PharmacyScreen";
import ProfileMenuScreen from "./src/screens/profile/ProfileMenuScreen";
import EditProfileScreen from "./src/screens/profile/EditProfileScreen";
import UpcomingBookingsScreen from "./src/screens/profile/UpcomingBookingsScreen";
import CompletedBookingsScreen from "./src/screens/profile/CompletedBookingsScreen";
import OrderHistoryScreen from "./src/screens/profile/OrderHistoryScreen";
import GlobalSearchScreen from "./src/screens/search/GlobalSearchScreen";
import HealthBookScreen from "./src/screens/health/HealthBookScreen";
import ClaimDeskScreen from "./src/screens/health/ClaimDeskScreen";

type Screen =
  | "login"
  | "signup"
  | "forgot"
  | "home"
  | "search"
  | "services"
  | "service-dental"
  | "appointments"
  | "dentist-appointments"
  | "ambulance"
  | "lab"
  | "nurse"
  | "physiotherapist"
  | "pharmacy"
  | "profile"
  | "edit-profile"
  | "upcoming-bookings"
  | "completed-bookings"
  | "order-history"
  | "health-book"
  | "claim-desk"
  | "support";

const serviceScreenMap: Record<ServiceKey, Screen> = {
  doctor: "appointments",
  dental: "dentist-appointments",
  ambulance: "ambulance",
  lab: "lab",
  nurse: "nurse",
  physiotherapist: "physiotherapist",
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
          onLoginSuccess={() => setScreen("home")}
          onSwitchToSignup={() => setScreen("signup")}
          onForgot={() => setScreen("forgot")}
        />
      );
    case "signup":
      return (
        <SignupScreen
          onSignupSuccess={() => setScreen("home")}
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
    case "search":
      return (
        <GlobalSearchScreen
          onBack={() => setScreen("home")}
          onOpenAppointments={() => setScreen("appointments")}
          onOpenDental={() => setScreen("dentist-appointments")}
          onOpenPharmacy={() => setScreen("pharmacy")}
          onOpenLab={() => setScreen("lab")}
          onOpenNurse={() => setScreen("nurse")}
          onOpenPhysiotherapist={() => setScreen("physiotherapist")}
          onOpenAmbulance={() => setScreen("ambulance")}
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
          onOpenLab={() => setScreen("lab")}
          onOpenNurse={() => setScreen("nurse")}
          onOpenPhysiotherapist={() => setScreen("physiotherapist")}
          onOpenDental={() => setScreen("dentist-appointments")}
          onOpenProfile={() => setScreen("profile")}
          onOpenSearch={() => setScreen("search")}
          onOpenSupport={() => setScreen("support")}
          onOpenHealthBook={() => setScreen("health-book")}
          onOpenClaimDesk={() => setScreen("claim-desk")}
          onLogout={() => setScreen("login")}
        />
      );
    case "appointments":
      return <DoctorAppointmentScreen onBack={() => setScreen("services")} />;
    case "dentist-appointments":
      return <DentistAppointmentScreen onBack={() => setScreen("services")} />;
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

    case "lab":
      return <LabTestBookingScreen onBack={() => setScreen("services")} />;
    case "nurse":
      return <NurseBookingScreen onBack={() => setScreen("services")} />;
    case "physiotherapist":
      return <PhysiotherapistBookingScreen onBack={() => setScreen("services")} />;
    case "pharmacy":
      return <PharmacyScreen onBack={() => setScreen("services")} />;
    case "profile":
      return (
        <ProfileMenuScreen
          onBack={() => setScreen("home")}
          onOpenEditProfile={() => setScreen("edit-profile")}
          onOpenUpcomingBookings={() => setScreen("upcoming-bookings")}
          onOpenCompletedBookings={() => setScreen("completed-bookings")}
          onOpenOrderHistory={() => setScreen("order-history")}
          onLogout={() => setScreen("login")}
        />
      );
    case "edit-profile":
      return <EditProfileScreen onBack={() => setScreen("profile")} />;
    case "upcoming-bookings":
      return <UpcomingBookingsScreen onBack={() => setScreen("profile")} />;
    case "completed-bookings":
      return <CompletedBookingsScreen onBack={() => setScreen("profile")} />;
    case "order-history":
      return <OrderHistoryScreen onBack={() => setScreen("profile")} />;
    case "health-book":
      return <HealthBookScreen onBack={() => setScreen("home")} />;
    case "claim-desk":
      return <ClaimDeskScreen onBack={() => setScreen("home")} />;
    case "support":
      return <SupportScreen onBack={() => setScreen("home")} />;
    default:
      return null;
  }
}

function AppContent() {
  const [screen, setScreen] = useState<Screen>("login");
  const [menuOpen, setMenuOpen] = useState(false);

  const isAuthScreen = screen === "login" || screen === "signup" || screen === "forgot";
  const containerStyle = { flex: 1 };

  if (isAuthScreen) {
    return (
      <ImageBackground
        source={require("./assets/medefix background.jpeg")}
        style={{ flex: 1 }}
        blurRadius={18}
        resizeMode="cover"
      >
        <View style={{ flex: 1, backgroundColor: "rgba(248, 245, 240, 0.72)" }}>
          <View style={styles.container}>
            <StatusBar style="dark" />
            {renderScreen(screen, menuOpen, setScreen, setMenuOpen)}
          </View>
        </View>
      </ImageBackground>
    );
  }

  return (
    <LinearGradient
      colors={["#F8F5F0", "#F8F5F0", "#F8F5F0"]}
      locations={[0, 0.45, 1]}
      style={styles.gradient}
    >
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Image
            source={require("./assets/medefix background.jpeg")}
            style={{ width: 300, height: 300, opacity: 0.07 }}
            resizeMode="contain"
          />
        </View>
      </View>
      <View style={containerStyle}>
        <StatusBar style="dark" />
        {renderScreen(screen, menuOpen, setScreen, setMenuOpen)}
      </View>
    </LinearGradient>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
