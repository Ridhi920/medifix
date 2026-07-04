import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View, Image } from "react-native";
import { styles } from "../../styles";
import { type ServiceItem, type ServiceKey } from "../../data/services";
import { useAuth } from "../../context/AuthContext";
import { useLocation } from "../../hooks/useLocation";
import LocationBar from "../../components/LocationBar";
import WhyChooseCarousel from "../../components/WhyChooseCarousel";
import TestimonialsCarousel from "../../components/TestimonialsCarousel";

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
  readonly onOpenNurse: () => void;
  readonly onOpenPhysiotherapist: () => void;
  readonly onOpenDental: () => void;
  readonly onOpenProfile: () => void;
  readonly onOpenSearch: () => void;
  readonly onOpenSupport: () => void;
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
  onOpenNurse,
  onOpenPhysiotherapist,
  onOpenDental,
  onOpenProfile,
  onOpenSearch,
  onOpenSupport,
  onLogout
}: Readonly<HomeScreenProps>) {
  const { user, logout } = useAuth();
  const { locationName, locationLoading, requestLocation, setManualName } = useLocation();
  const [heroTextHeight, setHeroTextHeight] = useState(0);

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
          <View style={{ alignItems: "flex-start" }}>
            <Image
              source={require("../../../assets/medEfix.png")}
              style={{ width: 150, height: 50, left: -25
               }}
              resizeMode="contain"
            />
            {user && (
              <Text style={{ fontSize: 13, color: "#666", marginTop: 2, fontWeight: "700" }}>
                Welcome, {user.full_name.split(' ')[0]}!
              </Text>
            )}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <Pressable style={styles.headerIcon} onPress={onOpenSearch}>
              <Text style={{ fontSize: 20 }}>🔍</Text>
            </Pressable>
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

        {/* Location Bar */}
        <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
          <LocationBar
            locationName={locationName}
            loading={locationLoading}
            onRequestGPS={requestLocation}
            onSetManual={setManualName}
          />
        </View>

        {/* Orange Hero Section */}
        <View style={styles.heroSection}>
          <View
            style={{ flex: 1 }}
            onLayout={(e) => setHeroTextHeight(e.nativeEvent.layout.height)}
          >
            <Text style={styles.heroTitle}>27 Minutes to Care</Text>
            <Text style={styles.heroSubtitle}>
              Connect to doctors, pharmacy{'\n'}& ambulance instantly
            </Text>
            <Pressable style={styles.heroButton} onPress={onOpenAppointments}>
              <Text style={styles.heroButtonText}>Book a Consultation</Text>
            </Pressable>
          </View>
          <Image
            source={require("../../../assets/meddy.png")}
            style={{ width: 140, height: heroTextHeight || 140 }}
            resizeMode="contain"
          />
        </View>

        {/* Service Cards Grid */}
        <View style={styles.servicesGrid}>
          <Pressable style={styles.serviceCard} onPress={onOpenAppointments}>
            <Image
              source={require("../../../assets/doctor.png")}
              style={styles.serviceCardIcon}
              resizeMode="contain"
            />
            <Text style={styles.serviceCardText}>Consult Doctor</Text>
            <Text style={styles.serviceCardTagline}>Book Instant Appointment</Text>
          </Pressable>

          <Pressable style={styles.serviceCard} onPress={onOpenPharmacy}>
            <Image
              source={require("../../../assets/pharmacy.png")}
              style={styles.serviceCardIcon}
              resizeMode="contain"
            />
            <Text style={styles.serviceCardText}>Order Medicines</Text>
            <Text style={styles.serviceCardTagline}>Delivered in 27 Mins</Text>
          </Pressable>

          <Pressable style={styles.serviceCard} onPress={onOpenAmbulance}>
            <Image
              source={require("../../../assets/ambulance.png")}
              style={styles.serviceCardIcon}
              resizeMode="contain"
            />
            <Text style={styles.serviceCardText}>Book Ambulance</Text>
            <Text style={styles.serviceCardTagline}>Emergency and Scheduled</Text>
          </Pressable>

          <Pressable style={styles.serviceCard} onPress={onOpenLab}>
            <Image
              source={require("../../../assets/Lab.png")}
              style={styles.serviceCardIcon}
              resizeMode="contain"
            />
            <Text style={styles.serviceCardText}>Book Lab Test</Text>
            <Text style={styles.serviceCardTagline}>Sample Collection at Home</Text>
          </Pressable>

          <Pressable style={styles.serviceCard} onPress={onOpenNurse}>
            <Image
              source={require("../../../assets/home_nurse.png")}
              style={styles.serviceCardIcon}
              resizeMode="contain"
            />
            <Text style={styles.serviceCardText}>Book Nurse</Text>
            <Text style={styles.serviceCardTagline}>Care at Home</Text>
          </Pressable>

          <Pressable style={styles.serviceCard} onPress={onOpenPhysiotherapist}>
            <Image
              source={require("../../../assets/doctor.png")}
              style={styles.serviceCardIcon}
              resizeMode="contain"
            />
            <Text style={styles.serviceCardText}>Book Physiotherapy</Text>
            <Text style={styles.serviceCardTagline}>Recovery at Home</Text>
          </Pressable>

          <Pressable style={styles.serviceCard} onPress={onOpenDental}>
            <Image
              source={require("../../../assets/dental-checkup.png")}
              style={styles.serviceCardIcon}
              resizeMode="contain"
            />
            <Text style={styles.serviceCardText}>Book Dentist</Text>
            <Text style={styles.serviceCardTagline}>Dental Care Made Easy</Text>
          </Pressable>

          <Pressable style={styles.serviceCard} onPress={onOpenServices}>
            <View style={[styles.serviceCardIcon, { backgroundColor: '#FF6B35', borderRadius: 50, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ fontSize: 32, color: '#fff' }}>+</Text>
            </View>
            <Text style={styles.serviceCardText}>More Services</Text>
            <Text style={styles.serviceCardTagline}>More Healthcare Services</Text>
          </Pressable>
        </View>

        {/* Emergency Ambulance Banner */}
        <View style={styles.emergencyBanner}>
          <Text style={styles.emergencyText}>Need Immediate Ambulance Support???</Text>
          <Pressable style={styles.callNowButton}>
            <Text style={styles.callNowText}>Call Now</Text>
          </Pressable>

        </View>

        {/* Why Choose MedEfix — horizontal feature carousel */}
        <WhyChooseCarousel />

        {/* Testimonials — auto-advancing swipeable carousel */}
        <TestimonialsCarousel />
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
        <Pressable style={styles.navItem} onPress={onOpenSupport}>
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
