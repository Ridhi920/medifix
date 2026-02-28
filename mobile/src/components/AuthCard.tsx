import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import { styles } from "../styles";

const heroImage = require("../../assets/agentregistration-img.png");

type AuthCardProps = {
  title: string;
  subtitle: string;
  showName?: boolean;
  showPassword?: boolean;
  showConfirm?: boolean;
  showForgot?: boolean;
  helperText?: string;
  primaryLabel: string;
  switchText: string;
  switchLinkText: string;
  onPrimary: () => void;
  onSwitchPress: () => void;
  onForgotPress?: () => void;
};

export default function AuthCard({
  title,
  subtitle,
  showName = false,
  showPassword = false,
  showConfirm = false,
  showForgot = false,
  helperText,
  primaryLabel,
  switchText,
  switchLinkText,
  onPrimary,
  onSwitchPress,
  onForgotPress
}: AuthCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.heroBlock}>
        <View style={styles.heroCircle}>
          <Image source={heroImage} style={styles.heroImage} />
        </View>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {showName ? (
        <TextInput
          placeholder="Full name"
          placeholderTextColor="#9ca3af"
          style={styles.input}
        />
      ) : null}

      <TextInput
        placeholder="Email address"
        placeholderTextColor="#9ca3af"
        style={styles.input}
      />

      {showPassword ? (
        <TextInput
          placeholder="Password"
          placeholderTextColor="#9ca3af"
          style={styles.input}
          secureTextEntry
        />
      ) : null}

      {showConfirm ? (
        <TextInput
          placeholder="Confirm password"
          placeholderTextColor="#9ca3af"
          style={styles.input}
          secureTextEntry
        />
      ) : null}

      {showForgot ? (
        <TouchableOpacity onPress={onForgotPress}>
          <Text style={styles.linkText}>Forgot password?</Text>
        </TouchableOpacity>
      ) : null}

      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}

      <TouchableOpacity style={styles.primaryButton} onPress={onPrimary}>
        <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
      </TouchableOpacity>

      <View style={styles.switchRow}>
        <Text style={styles.switchText}>{switchText}</Text>
        <TouchableOpacity onPress={onSwitchPress}>
          <Text style={styles.switchLink}>{switchLinkText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
