import { useState, useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { styles } from "../../styles";
import { userAPI, type User } from "../../api/userApi";
import { parseBackendErrors } from "../../utils/errorHandler";
import CustomAlert from "../../components/CustomAlert";
import LoadingScreen from "../../components/LoadingScreen";

type ProfileMenuScreenProps = {
  readonly onBack: () => void;
  readonly onOpenEditProfile: () => void;
  readonly onOpenUpcomingBookings: () => void;
  readonly onOpenCompletedBookings: () => void;
  readonly onLogout: () => void;
};

type AlertState = {
  visible: boolean;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  onConfirm?: () => void;
};

export default function ProfileMenuScreen({
  onBack,
  onOpenEditProfile,
  onOpenUpcomingBookings,
  onOpenCompletedBookings,
  onLogout,
}: Readonly<ProfileMenuScreenProps>) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
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

  const MenuItem = ({
    icon,
    title,
    subtitle,
    onPress,
    color = "#FF6B35",
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    color?: string;
  }) => (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: color + "20",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 16,
        }}
      >
        <Text style={{ fontSize: 24 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: "700", color: "#0f172a", marginBottom: 2 }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: 13, color: "#64748b" }}>
            {subtitle}
          </Text>
        )}
      </View>
      <Text style={{ fontSize: 20, color: "#94a3b8" }}>›</Text>
    </Pressable>
  );

  if (loading) {
    return <LoadingScreen message="Dr. Meddy is fetching your profile" />;
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.homeScroll}
    >
      <View style={styles.serviceScreenCard}>
        {/* Back Button */}
        <View style={styles.serviceHeaderRow}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <View style={styles.backIcon} />
          </Pressable>
          <Text style={styles.serviceHeaderTitle}>Profile</Text>
        </View>

        {/* User Info Card */}
        {user && (
          <View
            style={{
              backgroundColor: "#FF6B35",
              borderRadius: 20,
              padding: 24,
              marginBottom: 24,
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: "#ffffff",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 32, fontWeight: "700", color: "#FF6B35" }}>
                {user.full_name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={{ fontSize: 24, fontWeight: "800", color: "#ffffff", marginBottom: 4 }}>
              {user.full_name}
            </Text>
            <Text style={{ fontSize: 14, color: "#ffffff", opacity: 0.9, marginBottom: 2 }}>
              {user.email}
            </Text>
            {user.phone && (
              <Text style={{ fontSize: 14, color: "#ffffff", opacity: 0.9 }}>
                {user.phone}
              </Text>
            )}
          </View>
        )}

        {/* Menu Options */}
        <View>
          <MenuItem
            icon="👤"
            title="My Profile"
            subtitle="Edit your personal information"
            onPress={onOpenEditProfile}
            color="#3b82f6"
          />

          <MenuItem
            icon="📅"
            title="Upcoming Bookings"
            subtitle="View your scheduled appointments"
            onPress={onOpenUpcomingBookings}
            color="#10b981"
          />

          <MenuItem
            icon="✓"
            title="Completed Bookings"
            subtitle="View your booking history"
            onPress={onOpenCompletedBookings}
            color="#8b5cf6"
          />

          <Pressable
            onPress={handleLogout}
            style={{
              backgroundColor: "#fee2e2",
              borderRadius: 16,
              padding: 16,
              marginTop: 12,
              borderWidth: 1,
              borderColor: "#fecaca",
            }}
          >
            <Text style={{ textAlign: "center", fontSize: 16, fontWeight: "700", color: "#dc2626" }}>
              Logout
            </Text>
          </Pressable>
        </View>
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
