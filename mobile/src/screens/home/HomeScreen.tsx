import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View, Image } from "react-native";
import { styles } from "../../styles";
import { type ServiceItem, type ServiceKey } from "../../data/services";
import { useAuth } from "../../context/AuthContext";
import { fetchServiceAvailability } from "../../api/settingsApi";
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
  readonly onOpenHealthBook: () => void;
  readonly onOpenClaimDesk: () => void;
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
  onOpenHealthBook,
  onOpenClaimDesk,
  onLogout
}: Readonly<HomeScreenProps>) {
  const { user, logout } = useAuth();
  const { locationName, locationLoading, requestLocation, setManualName } = useLocation();
  const [heroTextHeight, setHeroTextHeight] = useState(0);
  const [unavailableServices, setUnavailableServices] = useState<string[]>([]);
  const [returnDates, setReturnDates] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchServiceAvailability().then(({ unavailableServices, returnDates }) => {
      setUnavailableServices(unavailableServices);
      setReturnDates(returnDates);
    });
  }, []);

  const isUnavailable = (key: string) => unavailableServices.includes(key);

  const formatReturnDate = (iso: string) => {
    const date = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  };

  // Wrap a service card's press handler: block navigation and show a message
  // when the service has been turned off from the admin panel.
  const guardService = (
    key: string,
    name: string,
    handler: () => void,
  ) => () => {
    if (isUnavailable(key)) {
      const isStore = key === "pharmacy";
      const backOn = returnDates[key] ? formatReturnDate(returnDates[key]) : null;
      const baseMessage = isStore
        ? "Our pharmacy is currently unavailable."
        : `${name} is currently unavailable.`;
      Alert.alert(
        isStore ? "Store Unavailable" : "Service Unavailable",
        backOn ? `${baseMessage} Expected back on ${backOn}.` : `${baseMessage} Please check back later.`,
      );
      return;
    }
    handler();
  };

  const renderUnavailableBadge = (key: string) =>
    isUnavailable(key) ? (
      <View
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          backgroundColor: "#ef4444",
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 8,
          zIndex: 2,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 9, fontWeight: "700" }}>
          {key === "pharmacy" ? "Store Unavailable" : "Unavailable"}
        </Text>
      </View>
    ) : null;

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
          <Pressable
            style={[styles.serviceCard, isUnavailable("doctor") && { opacity: 0.6 }]}
            onPress={guardService("doctor", "Doctor consultation", onOpenAppointments)}
          >
            {renderUnavailableBadge("doctor")}
            <Image
              source={require("../../../assets/doctor.png")}
              style={styles.serviceCardIcon}
              resizeMode="contain"
            />
            <Text style={styles.serviceCardText}>Consult Doctor</Text>
            <Text style={styles.serviceCardTagline}>Book Instant Appointment</Text>
          </Pressable>

          <Pressable
            style={[styles.serviceCard, isUnavailable("pharmacy") && { opacity: 0.6 }]}
            onPress={guardService("pharmacy", "Pharmacy", onOpenPharmacy)}
          >
            {renderUnavailableBadge("pharmacy")}
            <Image
              source={require("../../../assets/pharmacy.png")}
              style={styles.serviceCardIcon}
              resizeMode="contain"
            />
            <Text style={styles.serviceCardText}>Order Medicines</Text>
            <Text style={styles.serviceCardTagline}>Delivered in 27 Mins</Text>
          </Pressable>

          <Pressable
            style={[styles.serviceCard, isUnavailable("ambulance") && { opacity: 0.6 }]}
            onPress={guardService("ambulance", "Ambulance booking", onOpenAmbulance)}
          >
            {renderUnavailableBadge("ambulance")}
            <Image
              source={require("../../../assets/ambulance.png")}
              style={styles.serviceCardIcon}
              resizeMode="contain"
            />
            <Text style={styles.serviceCardText}>Book Ambulance</Text>
            <Text style={styles.serviceCardTagline}>Emergency and Scheduled</Text>
          </Pressable>

          <Pressable
            style={[styles.serviceCard, isUnavailable("lab") && { opacity: 0.6 }]}
            onPress={guardService("lab", "Lab tests", onOpenLab)}
          >
            {renderUnavailableBadge("lab")}
            <Image
              source={require("../../../assets/Lab.png")}
              style={styles.serviceCardIcon}
              resizeMode="contain"
            />
            <Text style={styles.serviceCardText}>Book Lab Test</Text>
            <Text style={styles.serviceCardTagline}>Sample Collection at Home</Text>
          </Pressable>

          <Pressable
            style={[styles.serviceCard, isUnavailable("nurse") && { opacity: 0.6 }]}
            onPress={guardService("nurse", "Nurse booking", onOpenNurse)}
          >
            {renderUnavailableBadge("nurse")}
            <Image
              source={require("../../../assets/home_nurse.png")}
              style={styles.serviceCardIcon}
              resizeMode="contain"
            />
            <Text style={styles.serviceCardText}>Book Nurse</Text>
            <Text style={styles.serviceCardTagline}>Care at Home</Text>
          </Pressable>

          <Pressable
            style={[styles.serviceCard, isUnavailable("physiotherapist") && { opacity: 0.6 }]}
            onPress={guardService("physiotherapist", "Physiotherapy", onOpenPhysiotherapist)}
          >
            {renderUnavailableBadge("physiotherapist")}
            <Image
              source={require("../../../assets/doctor.png")}
              style={styles.serviceCardIcon}
              resizeMode="contain"
            />
            <Text style={styles.serviceCardText}>Book Physiotherapy</Text>
            <Text style={styles.serviceCardTagline}>Recovery at Home</Text>
          </Pressable>

          <Pressable
            style={[styles.serviceCard, isUnavailable("dentist") && { opacity: 0.6 }]}
            onPress={guardService("dentist", "Dentist booking", onOpenDental)}
          >
            {renderUnavailableBadge("dentist")}
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

        {/* MedEfix Digital Health Suite — ABDM-powered features */}
        <View style={styles.healthSuiteSection}>
          <Text style={styles.healthSuiteTitle}>MedEfix Digital Health Suite</Text>
          <Text style={styles.healthSuiteSubtitle}>
            Your health records & insurance, powered by ABDM
          </Text>
          <View style={styles.healthSuiteRow}>
            <Pressable
              style={[styles.healthSuiteCard, styles.healthBookCard]}
              onPress={onOpenHealthBook}
            >
              <View style={styles.healthSuiteIconWrap}>
                <Text style={styles.healthSuiteIcon}>📖</Text>
              </View>
              <View>
                <Text style={styles.healthSuiteCardTitle}>MedEfix Health Book</Text>
                <Text style={styles.healthSuiteCardText}>
                  Store & share your health records
                </Text>
                <View style={styles.healthSuiteTag}>
                  <Text style={styles.healthSuiteTagText}>ABHA</Text>
                </View>
              </View>
            </Pressable>

            <Pressable
              style={[styles.healthSuiteCard, styles.claimDeskCard]}
              onPress={onOpenClaimDesk}
            >
              <View style={styles.healthSuiteIconWrap}>
                <Text style={styles.healthSuiteIcon}>🧾</Text>
              </View>
              <View>
                <Text style={styles.healthSuiteCardTitle}>MedEfix Claim Desk</Text>
                <Text style={styles.healthSuiteCardText}>
                  File & track insurance claims
                </Text>
                <View style={styles.healthSuiteTag}>
                  <Text style={styles.healthSuiteTagText}>NHCX</Text>
                </View>
              </View>
            </Pressable>
          </View>
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
