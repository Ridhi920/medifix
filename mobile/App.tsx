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

type Screen =
  | "login"
  | "signup"
  | "forgot"
  | "home"
  | "services"
  | "service-dental"
  | "service-cardiology"
  | "service-pediatrics";

const serviceScreenMap: Record<ServiceKey, Screen> = {
  dental: "service-dental",
  cardiology: "service-cardiology",
  pediatrics: "service-pediatrics"
};

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSelectService = (key: ServiceKey) => {
    setScreen(serviceScreenMap[key]);
  };

  return (
    <LinearGradient
      colors={["#FFE8DD", "#FFF5F0", "#ffffff"]}
      locations={[0, 0.45, 1]}
      style={styles.gradient}
    >
      <View style={styles.container}>
        <StatusBar style="dark" />

        {screen === "login" ? (
          <LoginScreen
            onLogin={() => setScreen("home")}
            onSwitchToSignup={() => setScreen("signup")}
            onForgot={() => setScreen("forgot")}
          />
        ) : screen === "signup" ? (
          <SignupScreen
            onSignup={() => setScreen("home")}
            onSwitchToLogin={() => setScreen("login")}
          />
        ) : screen === "forgot" ? (
          <ForgotScreen
            onSendOtp={() => setScreen("login")}
            onBackToLogin={() => setScreen("login")}
          />
        ) : screen === "home" ? (
          <HomeScreen
            services={SERVICES}
            menuOpen={menuOpen}
            onToggleMenu={() => setMenuOpen((prev) => !prev)}
            onSelectService={handleSelectService}
            onOpenServices={() => setScreen("services")}
          />
        ) : screen === "services" ? (
          <ServicesListScreen
            services={SERVICES}
            onSelectService={handleSelectService}
            onBack={() => setScreen("home")}
          />
        ) : screen === "service-dental" ? (
          <DentalServiceScreen onBack={() => setScreen("services")} />
        ) : screen === "service-cardiology" ? (
          <CardiologyServiceScreen onBack={() => setScreen("services")} />
        ) : (
          <PediatricsServiceScreen onBack={() => setScreen("services")} />
        )}
      </View>
    </LinearGradient>
  );
}
