import { useState, useEffect } from "react";
import { Pressable, ScrollView, Text, View, TextInput } from "react-native";
import { styles } from "../../styles";
import { userAPI, type User } from "../../api/userApi";
import { parseBackendErrors, validators } from "../../utils/errorHandler";
import CustomAlert from "../../components/CustomAlert";
import LoadingScreen from "../../components/LoadingScreen";

type EditProfileScreenProps = {
  readonly onBack: () => void;
};

type AlertState = {
  visible: boolean;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  onConfirm?: () => void;
};

export default function EditProfileScreen({ onBack }: Readonly<EditProfileScreenProps>) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Profile form
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [alert, setAlert] = useState<AlertState>({
    visible: false,
    type: "info",
    title: "",
    message: "",
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [userData] = await Promise.all([
        userAPI.getProfile(),
        new Promise(resolve => setTimeout(resolve, 1000))
      ]);
      setUser(userData);
      setFullName(userData.full_name);
      setEmail(userData.email);
      setPhone(userData.phone || "");
    } catch (error: any) {
      console.error("Error loading profile data:", error);
      setAlert({
        visible: true,
        type: "error",
        title: "Loading Failed",
        message: parseBackendErrors(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    const nameError = validators.name(fullName);
    if (nameError) {
      setAlert({ visible: true, type: "error", title: "Invalid Name", message: nameError });
      return;
    }

    if (phone) {
      const phoneError = validators.phone(phone);
      if (phoneError) {
        setAlert({ visible: true, type: "error", title: "Invalid Phone", message: phoneError });
        return;
      }
    }

    try {
      setSaving(true);
      const updatedUser = await userAPI.updateProfile({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
      });

      setUser(updatedUser);
      setEditingProfile(false);
      setAlert({
        visible: true,
        type: "success",
        title: "Profile Updated",
        message: "Your profile has been updated successfully!",
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setAlert({ visible: true, type: "error", title: "Update Failed", message: parseBackendErrors(error) });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword) {
      setAlert({ visible: true, type: "warning", title: "Missing Information", message: "Please enter your current password" });
      return;
    }

    if (newPassword.length < 6) {
      setAlert({ visible: true, type: "error", title: "Invalid Password", message: "New password must be at least 6 characters" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setAlert({ visible: true, type: "error", title: "Passwords Don't Match", message: "New password and confirmation do not match" });
      return;
    }

    try {
      setSaving(true);
      await userAPI.updatePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      setChangingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setAlert({
        visible: true,
        type: "success",
        title: "Password Changed",
        message: "Your password has been changed successfully!",
      });
    } catch (error: any) {
      console.error("Error updating password:", error);
      setAlert({ visible: true, type: "error", title: "Update Failed", message: parseBackendErrors(error) });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Dr. Meddy is loading your information" />;
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.homeScroll}>
      <View style={styles.serviceScreenCard}>
        <View style={styles.serviceHeaderRow}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <View style={styles.backIcon} />
          </Pressable>
          <Text style={styles.serviceHeaderTitle}>Edit Profile</Text>
        </View>

        {/* Profile Info or Edit Form */}
        {!editingProfile && !changingPassword && user && (
          <View>
            <View style={{ backgroundColor: "#f8fafc", borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "#e2e8f0" }}>
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, color: "#64748b", marginBottom: 4 }}>Full Name</Text>
                <Text style={{ fontSize: 18, fontWeight: "600", color: "#0f172a" }}>{user.full_name}</Text>
              </View>
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, color: "#64748b", marginBottom: 4 }}>Email</Text>
                <Text style={{ fontSize: 18, fontWeight: "600", color: "#0f172a" }}>{user.email}</Text>
              </View>
              <View>
                <Text style={{ fontSize: 14, color: "#64748b", marginBottom: 4 }}>Phone</Text>
                <Text style={{ fontSize: 18, fontWeight: "600", color: "#0f172a" }}>{user.phone || "Not provided"}</Text>
              </View>
            </View>

            <Pressable onPress={() => setEditingProfile(true)} style={{ backgroundColor: "#FF6B35", paddingVertical: 14, borderRadius: 12, marginBottom: 12 }}>
              <Text style={{ textAlign: "center", fontSize: 16, fontWeight: "700", color: "#ffffff" }}>Edit Information</Text>
            </Pressable>

            <Pressable onPress={() => setChangingPassword(true)} style={{ backgroundColor: "#ffffff", borderWidth: 2, borderColor: "#FF6B35", paddingVertical: 14, borderRadius: 12 }}>
              <Text style={{ textAlign: "center", fontSize: 16, fontWeight: "700", color: "#FF6B35" }}>Change Password</Text>
            </Pressable>
          </View>
        )}

        {/* Edit Profile Form */}
        {editingProfile && (
          <View>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#0f172a", marginBottom: 16 }}>Edit Information</Text>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#334155", marginBottom: 8 }}>Full Name</Text>
              <TextInput style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, padding: 12, fontSize: 16, color: "#0f172a" }} value={fullName} onChangeText={setFullName} placeholder="Enter your full name" />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#334155", marginBottom: 8 }}>Email</Text>
              <TextInput style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, padding: 12, fontSize: 16, color: "#0f172a" }} value={email} onChangeText={setEmail} placeholder="Enter your email" keyboardType="email-address" autoCapitalize="none" />
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#334155", marginBottom: 8 }}>Phone Number</Text>
              <TextInput style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, padding: 12, fontSize: 16, color: "#0f172a" }} value={phone} onChangeText={setPhone} placeholder="Enter your phone number" keyboardType="phone-pad" />
            </View>

            <Pressable onPress={handleUpdateProfile} disabled={saving} style={{ backgroundColor: "#FF6B35", paddingVertical: 14, borderRadius: 12, marginBottom: 12 }}>
              <Text style={{ textAlign: "center", fontSize: 16, fontWeight: "700", color: "#ffffff" }}>{saving ? "Saving..." : "Save Changes"}</Text>
            </Pressable>

            <Pressable onPress={() => { setEditingProfile(false); setFullName(user?.full_name || ""); setEmail(user?.email || ""); setPhone(user?.phone || ""); }} style={{ backgroundColor: "#f1f5f9", paddingVertical: 14, borderRadius: 12 }}>
              <Text style={{ textAlign: "center", fontSize: 16, fontWeight: "700", color: "#64748b" }}>Cancel</Text>
            </Pressable>
          </View>
        )}

        {/* Change Password Form */}
        {changingPassword && (
          <View>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#0f172a", marginBottom: 16 }}>Change Password</Text>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#334155", marginBottom: 8 }}>Current Password</Text>
              <TextInput style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, padding: 12, fontSize: 16, color: "#0f172a" }} value={currentPassword} onChangeText={setCurrentPassword} placeholder="Enter current password" secureTextEntry />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#334155", marginBottom: 8 }}>New Password</Text>
              <TextInput style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, padding: 12, fontSize: 16, color: "#0f172a" }} value={newPassword} onChangeText={setNewPassword} placeholder="Enter new password" secureTextEntry />
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#334155", marginBottom: 8 }}>Confirm New Password</Text>
              <TextInput style={{ borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, padding: 12, fontSize: 16, color: "#0f172a" }} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm new password" secureTextEntry />
            </View>

            <Pressable onPress={handleUpdatePassword} disabled={saving} style={{ backgroundColor: "#FF6B35", paddingVertical: 14, borderRadius: 12, marginBottom: 12 }}>
              <Text style={{ textAlign: "center", fontSize: 16, fontWeight: "700", color: "#ffffff" }}>{saving ? "Updating..." : "Update Password"}</Text>
            </Pressable>

            <Pressable onPress={() => { setChangingPassword(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }} style={{ backgroundColor: "#f1f5f9", paddingVertical: 14, borderRadius: 12 }}>
              <Text style={{ textAlign: "center", fontSize: 16, fontWeight: "700", color: "#64748b" }}>Cancel</Text>
            </Pressable>
          </View>
        )}
      </View>

      <CustomAlert visible={alert.visible} type={alert.type} title={alert.title} message={alert.message} onClose={() => { if (alert.onConfirm) { alert.onConfirm(); } setAlert({ ...alert, visible: false }); }} primaryButtonText="OK" />
    </ScrollView>
  );
}
