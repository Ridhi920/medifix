import { Alert } from "react-native";
import AuthCard, { AuthFormData } from "../../components/AuthCard";
import { useAuth } from "../../context/AuthContext";

type LoginScreenProps = {
  onLoginSuccess: () => void;
  onSwitchToSignup: () => void;
  onForgot: () => void;
};

export default function LoginScreen({
  onLoginSuccess,
  onSwitchToSignup,
  onForgot
}: LoginScreenProps) {
  const { login, isLoading } = useAuth();

  const handleLogin = async (data: AuthFormData) => {
    // Validate inputs
    if (!data.email || !data.password) {
      Alert.alert("Validation Error", "Please enter both email and password");
      return;
    }

    try {
      await login({
        email: data.email,
        password: data.password,
      });
      onLoginSuccess();
    } catch (error) {
      // Error is already handled in AuthContext
      console.error("Login error:", error);
    }
  };

  return (
    <AuthCard
      title="Sign In"
      subtitle="Enter valid credentials to continue"
      showPassword
      showForgot
      primaryLabel="Login"
      switchText="Haven't any account?"
      switchLinkText="Sign up"
      isLoading={isLoading}
      onPrimary={handleLogin}
      onSwitchPress={onSwitchToSignup}
      onForgotPress={onForgot}
    />
  );
}
