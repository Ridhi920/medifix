import { useState, useEffect } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { styles } from "../../styles";
import { userAPI, type User } from "../../api/userApi";
import { parseBackendErrors, validators } from "../../utils/errorHandler";
import CustomAlert from "../../components/CustomAlert";

type ProfileScreenProps = {
  readonly onBack: () => void;
  readonly onLogout: () => void;
};

type AlertState = {
  visible: boolean;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  onConfirm?: () => void;
};

type BookingItem = {
  id: number;
  type: "doctor" | "lab" | "ambulance";
  title: string;
  subtitle: string;
  status: string;
  date: string;
  price: number;
};

export default function ProfileScreen({ onBack, onLogout }: Readonly<ProfileScreenProps>) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const [activeTab, setActiveTab] = useState<"profile" | "bookings">("profile");

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [userData, bookingsData] = await Promise.all([
        userAPI.getProfile(),
        userAPI.getAllBookings(),
      ]);


      setUser(userData);
      setFullName(userData.full_name);
      setEmail(userData.email);
      setPhone(userData.phone || "");

      // Combine and format all bookings
      const allBookings: BookingItem[] = [
        ...bookingsData.appointments.map((apt) => {
          return {
            id: apt.id,
            type: "doctor" as const,
            title: `Dr. ${apt.doctor_name || "Unknown"}`,
            subtitle: `${apt.patient_name} - ${apt.doctor_specialty || ""}`,
            status: apt.status,
            date: apt.created_at,
            price: apt.consultation_fee,
          };
        }),
        ...bookingsData.labBookings.map((lab) => {
          return {
            id: lab.id,
            type: "lab" as const,
            title: lab.test_name || "Lab Test",
            subtitle: `${lab.patient_name} - ${lab.collection_date}`,
            status: lab.status,
            date: lab.created_at,
            price: lab.test_price,
          };
        }),
        ...bookingsData.ambulanceBookings.map((amb) => {
          return {
            id: amb.id,
            type: "ambulance" as const,
            title: amb.ambulance_name || "Ambulance",
            subtitle: `${amb.patient_name} - ${amb.ambulance_type || ""}`,
            status: amb.status,
            date: amb.created_at,
            price: amb.ambulance_price,
          };
        }),
      ];

      // Sort by date descending
      allBookings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setBookings(allBookings);
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
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadUserData();
  };

  const handleUpdateProfile = async () => {
    // Validate name
    const nameError = validators.name(fullName);
    if (nameError) {
      setAlert({
        visible: true,
        type: "error",
        title: "Invalid Name",
        message: nameError,
      });
      return;
    }

    // Validate phone if provided
    if (phone) {
      const phoneError = validators.phone(phone);
      if (phoneError) {
        setAlert({
          visible: true,
          type: "error",
          title: "Invalid Phone",
          message: phoneError,
        });
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
      setEditMode(false);
      setAlert({
        visible: true,
        type: "success",
        title: "Profile Updated",
        message: "Your profile has been updated successfully!",
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setAlert({
        visible: true,
        type: "error",
        title: "Update Failed",
        message: parseBackendErrors(error),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    // Validate passwords
    if (!currentPassword) {
      setAlert({
        visible: true,
        type: "warning",
        title: "Missing Information",
        message: "Please enter your current password",
      });
      return;
    }

    if (newPassword.length < 6) {
      setAlert({
        visible: true,
        type: "error",
        title: "Invalid Password",
        message: "New password must be at least 6 characters",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setAlert({
        visible: true,
        type: "error",
        title: "Passwords Don't Match",
        message: "New password and confirmation do not match",
      });
      return;
    }

    try {
      setSaving(true);
      await userAPI.updatePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      setPasswordMode(false);
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
      setAlert({
        visible: true,
        type: "error",
        title: "Update Failed",
        message: parseBackendErrors(error),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    setAlert({
      visible: true,
      type: "warning",
      title: "Confirm Logout",
      message: "Are you sure you want to logout?",
      onConfirm: async () => {
        try {
          await AsyncStorage.removeItem("access_token");
          onLogout();
        } catch (error) {
          console.error("Error during logout:", error);
        }
      },
    });
  };

  const getStatusColor = (status: string): string => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("pending")) return "#f59e0b";
    if (statusLower.includes("confirmed") || statusLower.includes("scheduled")) return "#10b981";
    if (statusLower.includes("completed")) return "#3b82f6";
    if (statusLower.includes("cancelled")) return "#ef4444";
    if (statusLower.includes("dispatched")) return "#8b5cf6";
    return "#6b7280";
  };

  const getStatusLabel = (status: string): string => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
  };

  const getBookingIcon = (type: string): string => {
    if (type === "doctor") return "👨‍⚕️";
    if (type === "lab") return "🔬";
    if (type === "ambulance") return "🚑";
    return "📋";
  };

  if (loading) {
    return (
      <View style={[styles.serviceScreenCard, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={{ marginTop: 16, fontSize: 16, color: "#64748b" }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.homeScroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#FF6B35"]} />}
    >
      <View style={styles.serviceScreenCard}>
        {/* Back Button */}
        <View style={styles.serviceHeaderRow}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <View style={styles.backIcon} />
          </Pressable>
          <Text style={styles.serviceHeaderTitle}>Profile</Text>
        </View>

        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 28, fontWeight: "800", color: "#0f172a", marginBottom: 4 }}>
            My Account
          </Text>
          <Text style={{ fontSize: 14, color: "#64748b" }}>
            Manage your profile and view bookings
          </Text>
          {user && (
            <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
              User ID: {user.id} • {user.email}
            </Text>
          )}
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: "row", marginBottom: 24, gap: 12 }}>
          <Pressable
            onPress={() => setActiveTab("profile")}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: activeTab === "profile" ? "#FF6B35" : "#f1f5f9",
            }}
          >
            <Text
              style={{
                textAlign: "center",
                fontSize: 16,
                fontWeight: "700",
                color: activeTab === "profile" ? "#ffffff" : "#64748b",
              }}
            >
              Profile
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("bookings")}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: activeTab === "bookings" ? "#FF6B35" : "#f1f5f9",
            }}
          >
            <Text
              style={{
                textAlign: "center",
                fontSize: 16,
                fontWeight: "700",
                color: activeTab === "bookings" ? "#ffffff" : "#64748b",
              }}
            >
              Bookings ({bookings.length})
            </Text>
          </Pressable>
        </View>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <View>
            {/* User Info Card */}
            {!editMode && !passwordMode && user && (
              <View>
                <View
                  style={{
                    backgroundColor: "#f8fafc",
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                  }}
                >
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 14, color: "#64748b", marginBottom: 4 }}>Full Name</Text>
                    <Text style={{ fontSize: 18, fontWeight: "600", color: "#0f172a" }}>
                      {user.full_name}
                    </Text>
                  </View>
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 14, color: "#64748b", marginBottom: 4 }}>Email</Text>
                    <Text style={{ fontSize: 18, fontWeight: "600", color: "#0f172a" }}>{user.email}</Text>
                  </View>
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 14, color: "#64748b", marginBottom: 4 }}>Phone</Text>
                    <Text style={{ fontSize: 18, fontWeight: "600", color: "#0f172a" }}>
                      {user.phone || "Not provided"}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 14, color: "#64748b", marginBottom: 4 }}>Member Since</Text>
                    <Text style={{ fontSize: 16, fontWeight: "600", color: "#0f172a" }}>
                      {new Date(user.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => setEditMode(true)}
                  style={{
                    backgroundColor: "#FF6B35",
                    paddingVertical: 14,
                    borderRadius: 12,
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ textAlign: "center", fontSize: 16, fontWeight: "700", color: "#ffffff" }}>
                    Edit Profile
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setPasswordMode(true)}
                  style={{
                    backgroundColor: "#ffffff",
                    borderWidth: 2,
                    borderColor: "#FF6B35",
                    paddingVertical: 14,
                    borderRadius: 12,
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ textAlign: "center", fontSize: 16, fontWeight: "700", color: "#FF6B35" }}>
                    Change Password
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleLogout}
                  style={{
                    backgroundColor: "#f1f5f9",
                    paddingVertical: 14,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ textAlign: "center", fontSize: 16, fontWeight: "700", color: "#ef4444" }}>
                    Logout
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Edit Profile Form */}
            {editMode && (
              <View>
                <Text style={{ fontSize: 20, fontWeight: "700", color: "#0f172a", marginBottom: 16 }}>
                  Edit Profile
                </Text>

                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#334155", marginBottom: 8 }}>
                    Full Name
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: "#cbd5e1",
                      borderRadius: 12,
                      padding: 12,
                      fontSize: 16,
                      color: "#0f172a",
                    }}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Enter your full name"
                  />
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#334155", marginBottom: 8 }}>
                    Email
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: "#cbd5e1",
                      borderRadius: 12,
                      padding: 12,
                      fontSize: 16,
                      color: "#0f172a",
                    }}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#334155", marginBottom: 8 }}>
                    Phone Number
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: "#cbd5e1",
                      borderRadius: 12,
                      padding: 12,
                      fontSize: 16,
                      color: "#0f172a",
                    }}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Enter your phone number"
                    keyboardType="phone-pad"
                  />
                </View>

                <Pressable
                  onPress={handleUpdateProfile}
                  disabled={saving}
                  style={{
                    backgroundColor: "#FF6B35",
                    paddingVertical: 14,
                    borderRadius: 12,
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ textAlign: "center", fontSize: 16, fontWeight: "700", color: "#ffffff" }}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setEditMode(false);
                    setFullName(user?.full_name || "");
                    setEmail(user?.email || "");
                    setPhone(user?.phone || "");
                  }}
                  style={{
                    backgroundColor: "#f1f5f9",
                    paddingVertical: 14,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ textAlign: "center", fontSize: 16, fontWeight: "700", color: "#64748b" }}>
                    Cancel
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Change Password Form */}
            {passwordMode && (
              <View>
                <Text style={{ fontSize: 20, fontWeight: "700", color: "#0f172a", marginBottom: 16 }}>
                  Change Password
                </Text>

                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#334155", marginBottom: 8 }}>
                    Current Password
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: "#cbd5e1",
                      borderRadius: 12,
                      padding: 12,
                      fontSize: 16,
                      color: "#0f172a",
                    }}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Enter current password"
                    secureTextEntry
                  />
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#334155", marginBottom: 8 }}>
                    New Password
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: "#cbd5e1",
                      borderRadius: 12,
                      padding: 12,
                      fontSize: 16,
                      color: "#0f172a",
                    }}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Enter new password"
                    secureTextEntry
                  />
                </View>

                <View style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#334155", marginBottom: 8 }}>
                    Confirm New Password
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: "#cbd5e1",
                      borderRadius: 12,
                      padding: 12,
                      fontSize: 16,
                      color: "#0f172a",
                    }}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm new password"
                    secureTextEntry
                  />
                </View>

                <Pressable
                  onPress={handleUpdatePassword}
                  disabled={saving}
                  style={{
                    backgroundColor: "#FF6B35",
                    paddingVertical: 14,
                    borderRadius: 12,
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ textAlign: "center", fontSize: 16, fontWeight: "700", color: "#ffffff" }}>
                    {saving ? "Updating..." : "Update Password"}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setPasswordMode(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  style={{
                    backgroundColor: "#f1f5f9",
                    paddingVertical: 14,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ textAlign: "center", fontSize: 16, fontWeight: "700", color: "#64748b" }}>
                    Cancel
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <View>
            {bookings.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: "center" }}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>📋</Text>
                <Text style={{ fontSize: 18, fontWeight: "600", color: "#334155", marginBottom: 8 }}>
                  No Bookings Yet
                </Text>
                <Text style={{ fontSize: 14, color: "#64748b", textAlign: "center" }}>
                  Your booking history will appear here
                </Text>
              </View>
            ) : (
              <View>
                {bookings.map((booking) => (
                  <View
                    key={`${booking.type}-${booking.id}`}
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: "#e2e8f0",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 12 }}>
                      <Text style={{ fontSize: 32, marginRight: 12 }}>{getBookingIcon(booking.type)}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: "700", color: "#0f172a", marginBottom: 4 }}>
                          {booking.title}
                        </Text>
                        <Text style={{ fontSize: 14, color: "#64748b", marginBottom: 6 }}>
                          {booking.subtitle}
                        </Text>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <View
                            style={{
                              backgroundColor: getStatusColor(booking.status) + "20",
                              paddingHorizontal: 10,
                              paddingVertical: 4,
                              borderRadius: 8,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: "700",
                                color: getStatusColor(booking.status),
                                textTransform: "uppercase",
                              }}
                            >
                              {getStatusLabel(booking.status)}
                            </Text>
                          </View>
                          <Text style={{ fontSize: 12, color: "#94a3b8" }}>
                            {new Date(booking.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 16, fontWeight: "700", color: "#FF6B35" }}>
                        ₹{booking.price}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={() => {
          if (alert.onConfirm) {
            alert.onConfirm();
          }
          setAlert({ ...alert, visible: false });
        }}
        primaryButtonText="OK"
      />
    </ScrollView>
  );
}
