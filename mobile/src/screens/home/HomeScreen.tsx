import { Pressable, ScrollView, Text, View } from "react-native";
import { styles } from "../../styles";
import { type ServiceItem, type ServiceKey } from "../../data/services";

type HomeScreenProps = {
  services: ServiceItem[];
  menuOpen: boolean;
  onToggleMenu: () => void;
  onSelectService: (key: ServiceKey) => void;
  onOpenServices: () => void;
  onOpenAppointments: () => void;
};

export default function HomeScreen({
  services,
  menuOpen,
  onToggleMenu,
  onSelectService,
  onOpenServices,
  onOpenAppointments
}: HomeScreenProps) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.homeScroll}
    >
      <View style={styles.homeCard}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerGreeting}>Welcome Back</Text>
            <Text style={styles.headerName}>Ridhi</Text>
          </View>
          <View style={styles.headerActions}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>R</Text>
            </View>
            <View style={styles.menuWrapper}>
              <Pressable onPress={onToggleMenu} style={styles.hamburgerButton}>
                <View style={styles.hamburgerLine} />
                <View style={styles.hamburgerLine} />
                <View style={styles.hamburgerLine} />
              </Pressable>
              {menuOpen ? (
                <View style={styles.menuDropdown}>
                  {["Profile", "Settings", "Logout"].map((item) => (
                    <Text key={item} style={styles.menuItem}>
                      {item}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Text style={styles.searchPlaceholder}>Search</Text>
          <View style={styles.searchIcon} />
        </View>

        <View style={styles.bannerCard}>
          <View style={styles.bannerTextBlock}>
            <Text style={styles.bannerTitle}>Fast, Secure, and Easy Ordering</Text>
            <Text style={styles.bannerSubtitle}>Simplify your care needs</Text>
            <View style={styles.bannerButton}>
              <Text style={styles.bannerButtonText}>Book Now</Text>
            </View>
          </View>
          <View style={styles.bannerBadge}>
            <Text style={styles.bannerBadgeText}>MedEfix</Text>
          </View>
        </View>

        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Services</Text>
          <Pressable onPress={onOpenServices}>
            <Text style={styles.sectionLink}>View all</Text>
          </Pressable>
        </View>
        <View style={styles.servicesRow}>
          {services.map((service) => (
            <Pressable
              key={service.key}
              style={styles.servicePill}
              onPress={() => onSelectService(service.key)}
            >
              <Text style={styles.serviceText}>{service.title}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickRow}>
          {["Place Order", "Appointments", "My Orders", "Support"].map((item) => (
            <Pressable 
              key={item} 
              style={styles.quickCard}
              onPress={() => item === "Appointments" ? onOpenAppointments() : null}
            >
              <Text style={styles.quickText}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.promoRow}>
          <View style={styles.promoCardDark}>
            <Text style={styles.promoTitle}>New Discounts</Text>
            <Text style={styles.promoSubtitle}>Available now</Text>
          </View>
          <View style={styles.promoCardAccent}>
            <Text style={styles.promoTitle}>500+ Products</Text>
            <Text style={styles.promoSubtitle}>Added</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomNav}>
        {["Home", "Bookings", "Wishlist", "Profile"].map((item) => (
          <View key={item} style={styles.navItem}>
            <View style={styles.navIcon} />
            <Text style={styles.navLabel}>{item}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
