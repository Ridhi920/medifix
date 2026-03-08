import { Alert, Pressable, ScrollView, Text, View, Image } from "react-native";
import { styles } from "../../styles";
import { type ServiceItem, type ServiceKey } from "../../data/services";
import { useAuth } from "../../context/AuthContext";

type HomeScreenProps = {
  readonly services: ServiceItem[];
  readonly menuOpen: boolean;
  readonly onToggleMenu: () => void;
  readonly onSelectService: (key: ServiceKey) => void;
  readonly onOpenServices: () => void;
  readonly onOpenAppointments: () => void;
  readonly onOpenAmbulance: () => void;
  readonly onOpenPharmacy: () => void;
  readonly onOpenLab: () => void;
  readonly onOpenDental: () => void;
  readonly onOpenCardiology: () => void;
  readonly onOpenPediatrics: () => void;
  readonly onOpenProfile: () => void;
  readonly onLogout: () => void;
};

export default function HomeScreen({
  services,
  menuOpen,
  onToggleMenu,
  onSelectService,
  onOpenServices,
  onOpenAppointments,
  onOpenAmbulance,
  onOpenPharmacy,
  onOpenLab,
  onOpenDental,
  onOpenCardiology,
  onOpenPediatrics,
  onOpenProfile,
  onLogout
}: Readonly<HomeScreenProps>) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await logout();
            onLogout();
          }
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }}
      >
        {/* White Header */}
        <View style={styles.newHeader}>
          <View>
            <Image
              source={require("../../../assets/medEfix.png")}
              style={{ width: 120, height: 40 }}
              resizeMode="contain"
            />
            {user && (
              <Text style={{ fontSize: 10, color: "#666", marginTop: 2 }}>
                Welcome, {user.full_name.split(' ')[0]}!
              </Text>
            )}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <Pressable style={styles.headerIcon}>
              <Text style={{ fontSize: 20 }}>🔔</Text>
            </Pressable>
            <Pressable style={styles.headerIcon} onPress={onOpenProfile}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.full_name.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Orange Hero Section */}
        <View style={styles.heroSection}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>30 Minutes to Care</Text>
            <Text style={styles.heroSubtitle}>
              Connect to doctors, pharmacy{'\n'}& ambulance instantly
            </Text>
            <Pressable style={styles.heroButton} onPress={onOpenAppointments}>
              <Text style={styles.heroButtonText}>Book a Consultation</Text>
            </Pressable>
          </View>
          <View style={styles.heroImageContainer}>
            <Image
              source={require("../../../assets/meddy.png")}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Service Cards Grid */}
        <View style={styles.servicesGrid}>
          <Pressable style={styles.serviceCard} onPress={onOpenAppointments}>
            <Image
              source={require("../../../assets/doctor.png")}
              style={styles.serviceCardIcon}
              resizeMode="contain"
            />
            <Text style={styles.serviceCardText}>Doctor Consultation</Text>
          </Pressable>

          <Pressable style={styles.serviceCard} onPress={onOpenPharmacy}>
            <Image
              source={require("../../../assets/pharmacy.png")}
              style={styles.serviceCardIcon}
              resizeMode="contain"
            />
            <Text style={styles.serviceCardText}>Pharmacy</Text>
          </Pressable>

          <Pressable style={styles.serviceCard} onPress={onOpenAmbulance}>
            <Image
              source={require("../../../assets/ambulance.png")}
              style={styles.serviceCardIcon}
              resizeMode="contain"
            />
            <Text style={styles.serviceCardText}>Ambulance</Text>
          </Pressable>

          <Pressable style={styles.serviceCard} onPress={onOpenLab}>
            <Image
              source={require("../../../assets/Lab.png")}
              style={styles.serviceCardIcon}
              resizeMode="contain"
            />
            <Text style={styles.serviceCardText}>Lab Tests</Text>
          </Pressable>

          <Pressable style={styles.serviceCard} onPress={onOpenDental}>
            <Image
              source={require("../../../assets/dental-checkup.png")}
              style={styles.serviceCardIcon}
              resizeMode="contain"
            />
            <Text style={styles.serviceCardText}>Dental Care</Text>
          </Pressable>

          <Pressable style={styles.serviceCard} onPress={onOpenCardiology}>
            <Image
              source={require("../../../assets/doctor.png")}
              style={styles.serviceCardIcon}
              resizeMode="contain"
            />
            <Text style={styles.serviceCardText}>Cardiology</Text>
          </Pressable>

          <Pressable style={styles.serviceCard} onPress={onOpenPediatrics}>
            <Image
              source={require("../../../assets/doctor.png")}
              style={styles.serviceCardIcon}
              resizeMode="contain"
            />
            <Text style={styles.serviceCardText}>Pediatrics</Text>
          </Pressable>

          <Pressable style={styles.serviceCard} onPress={onOpenServices}>
            <View style={[styles.serviceCardIcon, { backgroundColor: '#FF6B35', borderRadius: 50, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ fontSize: 32, color: '#fff' }}>+</Text>
            </View>
            <Text style={styles.serviceCardText}>More Services</Text>
          </Pressable>
        </View>

        {/* Emergency Ambulance Banner */}
        <View style={styles.emergencyBanner}>
          <Text style={styles.emergencyText}>Need Immediate Ambulance Support?</Text>
          <Pressable style={styles.callNowButton}>
            <Text style={styles.callNowText}>Call Now</Text>
          </Pressable>
        </View>

        {/* Why Choose MedEfix */}
        <View style={styles.whySection}>
          <Text style={styles.whySectionTitle}>
            Why Choose <Text style={{ color: "#FF6B35" }}>MedEfix</Text>
          </Text>
          <View style={styles.whyGrid}>
            <View style={styles.whyCard}>
              <View style={styles.whyIconCircle}>
                <Text style={{ fontSize: 28 }}>✓</Text>
              </View>
              <Text style={styles.whyCardText}>Verified Doctors</Text>
            </View>

            <View style={styles.whyCard}>
              <View style={styles.whyIconCircle}>
                <Text style={{ fontSize: 28 }}>✓</Text>
              </View>
              <Text style={styles.whyCardText}>Quick Response</Text>
            </View>

            <View style={styles.whyCard}>
              <View style={styles.whyIconCircle}>
                <Text style={{ fontSize: 28 }}>💰</Text>
              </View>
              <Text style={styles.whyCardText}>Affordable Pricing</Text>
            </View>
          </View>
        </View>

        {/* Testimonials */}
        <View style={styles.testimonialSection}>
          <Text style={styles.testimonialTitle}>What Our Users Say</Text>
          <View style={styles.testimonialCard}>
            <View style={styles.testimonialAvatar}>
              <Text style={{ fontSize: 32 }}>👨</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.testimonialQuote}>
                "Excellent service, got connected to a doctor within minutes!"
              </Text>
            </View>
          </View>
          <View style={styles.testimonialDots}>
            <View style={[styles.dot, styles.activeDot]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <Pressable style={styles.navItem}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={[styles.navLabel, { color: "#FF6B35" }]}>Home</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={onOpenServices}>
          <Text style={styles.navIcon}>⚙️</Text>
          <Text style={styles.navLabel}>Services</Text>
        </Pressable>
        <Pressable style={styles.navItem}>
          <Text style={styles.navIcon}>💬</Text>
          <Text style={styles.navLabel}>Support</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={onOpenProfile}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>Profile</Text>
        </Pressable>
      </View>
    </View>
  );
}
