import { useState } from "react";
import AuthCard, { AuthFormData } from "../../components/AuthCard";
import { useAuth } from "../../context/AuthContext";
import CustomAlert from "../../components/CustomAlert";

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
  const [alert, setAlert] = useState({ visible: false, title: "", message: "" });

  const handleLogin = async (data: AuthFormData) => {
    if (!data.email || !data.password) {
      setAlert({ visible: true, title: "Validation Error", message: "Please enter both email and password" });
      return;
    }

    try {
      await login({
        email: data.email,
        password: data.password,
      });
      onLoginSuccess();
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <>
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
