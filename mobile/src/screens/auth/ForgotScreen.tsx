import AuthCard from "../../components/AuthCard";

type ForgotScreenProps = {
  onSendOtp: () => void;
  onBackToLogin: () => void;
};

export default function ForgotScreen({
  onSendOtp,
  onBackToLogin
}: ForgotScreenProps) {
  return (
    <AuthCard
      title="Forget Password"
      subtitle="Don't worry it happens. Please enter the address associated with your account"
      primaryLabel="Send OTP"
      switchText="You remember your password?"
      switchLinkText="Sign in"
      onPrimary={onSendOtp}
      onSwitchPress={onBackToLogin}
    />
  );
}
