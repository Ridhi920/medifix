import AuthCard from "../../components/AuthCard";

type SignupScreenProps = {
  onSignup: () => void;
  onSwitchToLogin: () => void;
};

export default function SignupScreen({
  onSignup,
  onSwitchToLogin
}: SignupScreenProps) {
  return (
    <AuthCard
      title="Sign Up"
      subtitle="Use proper information to continue"
      showName
      showPassword
      showConfirm
      helperText="By signing up, you agree to our Terms & Conditions"
      primaryLabel="Create Account"
      switchText="Already have an account?"
      switchLinkText="Sign in"
      onPrimary={onSignup}
      onSwitchPress={onSwitchToLogin}
    />
  );
}
