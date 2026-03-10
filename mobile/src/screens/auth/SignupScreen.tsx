import { useState } from "react";
import AuthCard, { AuthFormData } from "../../components/AuthCard";
import { useAuth } from "../../context/AuthContext";
import CustomAlert from "../../components/CustomAlert";

type SignupScreenProps = {
  onSignupSuccess: () => void;
  onSwitchToLogin: () => void;
};

export default function SignupScreen({
  onSignupSuccess,
  onSwitchToLogin
}: SignupScreenProps) {
  const { signup, isLoading } = useAuth();
  const [alert, setAlert] = useState({ visible: false, title: "", message: "" });

  const showAlert = (title: string, message: string) =>
    setAlert({ visible: true, title, message });

  const handleSignup = async (data: AuthFormData) => {
    if (!data.name || !data.email || !data.password) {
      showAlert("Validation Error", "Please fill in all required fields");
      return;
    }

    if (data.password.length < 6) {
      showAlert("Validation Error", "Password must be at least 6 characters");
      return;
    }

    if (data.password.length > 72) {
      showAlert("Validation Error", "Password must be less than 72 characters");
      return;
    }

    if (data.confirmPassword && data.password !== data.confirmPassword) {
      showAlert("Validation Error", "Passwords do not match");
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
      console.error("Signup error:", error);
    }
  };

  return (
    <>
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
      <CustomAlert
        visible={alert.visible}
        type="error"
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert({ ...alert, visible: false })}
      />
    </>
  );
}
