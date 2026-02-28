import AuthCard from "../../components/AuthCard";

type LoginScreenProps = {
  onLogin: () => void;
  onSwitchToSignup: () => void;
  onForgot: () => void;
};

export default function LoginScreen({
  onLogin,
  onSwitchToSignup,
  onForgot
}: LoginScreenProps) {
  return (
    <AuthCard
      title="Sign In"
      subtitle="Enter valid credentials to continue"
      showPassword
      showForgot
      primaryLabel="Login"
      switchText="Haven't any account?"
      switchLinkText="Sign up"
      onPrimary={onLogin}
      onSwitchPress={onSwitchToSignup}
      onForgotPress={onForgot}
    />
  );
}
