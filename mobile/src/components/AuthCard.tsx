import { useState } from "react";
import { ActivityIndicator, Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import { styles } from "../styles";

const logoImage = require("../../assets/medEfix.png");

export interface AuthFormData {
  name?: string;
  email: string;
  password: string;
  confirmPassword?: string;
  phone?: string;
}

type AuthCardProps = {
  title: string;
  subtitle: string;
  showName?: boolean;
  showPhone?: boolean;
  showPassword?: boolean;
  showConfirm?: boolean;
  showForgot?: boolean;
  helperText?: string;
  primaryLabel: string;
  switchText: string;
  switchLinkText: string;
  isLoading?: boolean;
  onPrimary: (data: AuthFormData) => void;
  onSwitchPress: () => void;
  onForgotPress?: () => void;
};

export default function AuthCard({
  title,
  subtitle,
  showName = false,
  showPhone = false,
  showPassword = false,
  showConfirm = false,
  showForgot = false,
  helperText,
  primaryLabel,
  switchText,
  switchLinkText,
  isLoading = false,
  onPrimary,
  onSwitchPress,
  onForgotPress
}: AuthCardProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = () => {
    const data: AuthFormData = {
      email: email.trim(),
      password,
    };

    if (showName) data.name = name.trim();
    if (showPhone) data.phone = phone.trim();
    if (showConfirm) data.confirmPassword = confirmPassword;

    onPrimary(data);
  };

  return (
    <View style={styles.card}>
      <View style={styles.heroBlock}>
        <Image source={logoImage} style={styles.authLogo} resizeMode="contain" />
        <Text style={styles.logoTagline}>your health, our priority</Text>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {showName ? (
        <TextInput
          placeholder="Full name"
          placeholderTextColor="#9ca3af"
          style={styles.input}
          value={name}
          onChangeText={setName}
          editable={!isLoading}
        />
      ) : null}

      <TextInput
        placeholder="Email address"
        placeholderTextColor="#9ca3af"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!isLoading}
      />

      {showPhone ? (
        <TextInput
          placeholder="Phone number (optional)"
          placeholderTextColor="#9ca3af"
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          editable={!isLoading}
        />
      ) : null}

      {showPassword ? (
        <TextInput
          placeholder="Password"
          placeholderTextColor="#9ca3af"
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!isLoading}
        />
      ) : null}

      {showConfirm ? (
        <TextInput
          placeholder="Confirm password"
          placeholderTextColor="#9ca3af"
          style={styles.input}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          editable={!isLoading}
        />
      ) : null}

      {showForgot ? (
        <TouchableOpacity onPress={onForgotPress} disabled={isLoading}>
          <Text style={styles.linkText}>Forgot password?</Text>
        </TouchableOpacity>
      ) : null}

      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}

      <TouchableOpacity 
        style={[styles.primaryButton, isLoading && { opacity: 0.6 }]} 
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
        )}
      </TouchableOpacity>

      <View style={styles.switchRow}>
        <Text style={styles.switchText}>{switchText}</Text>
        <TouchableOpacity onPress={onSwitchPress} disabled={isLoading}>
          <Text style={styles.switchLink}>{switchLinkText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
