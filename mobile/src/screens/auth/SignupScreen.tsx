import { Alert } from "react-native";
import AuthCard, { AuthFormData } from "../../components/AuthCard";
import { useAuth } from "../../context/AuthContext";

type SignupScreenProps = {
  onSignupSuccess: () => void;
  onSwitchToLogin: () => void;
};

export default function SignupScreen({
  onSignupSuccess,
  onSwitchToLogin
}: SignupScreenProps) {
  const { signup, isLoading } = useAuth();

  const handleSignup = async (data: AuthFormData) => {
    // Validate inputs
    if (!data.name || !data.email || !data.password) {
      Alert.alert("Validation Error", "Please fill in all required fields");
      return;
    }

    if (data.password.length < 6) {
      Alert.alert("Validation Error", "Password must be at least 6 characters");
      return;
    }

    if (data.password.length > 72) {
      Alert.alert("Validation Error", "Password must be less than 72 characters");
      return;
    }

    if (data.confirmPassword && data.password !== data.confirmPassword) {
      Alert.alert("Validation Error", "Passwords do not match");
      return;
    }

    try {
      await signup({
        email: data.email,
        password: data.password,
        full_name: data.name,
        phone: data.phone,
      });
      onSignupSuccess();
    } catch (error) {
      // Error is already handled in AuthContext
      console.error("Signup error:", error);
    }
  };

  return (
    <AuthCard
      title="Sign Up"
      subtitle="Use proper information to continue"
      showName
      showPhone
      showPassword
      showConfirm
      helperText="By signing up, you agree to our Terms & Conditions"
      primaryLabel="Create Account"
      switchText="Already have an account?"
      switchLinkText="Sign in"
      isLoading={isLoading}
      onPrimary={handleSignup}
      onSwitchPress={onSwitchToLogin}
    />
  );
}
