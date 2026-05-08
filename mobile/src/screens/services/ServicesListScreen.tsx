import { Pressable, ScrollView, Text, View, Image } from "react-native";
import { styles } from "../../styles";
import { type ServiceItem, type ServiceKey } from "../../data/services";

type ServicesListScreenProps = {
  readonly services: ServiceItem[];
  readonly onSelectService: (key: ServiceKey) => void;
  readonly onBack: () => void;
};

const serviceIcons: Record<ServiceKey, any> = {
  doctor: require("../../../assets/doctor.png"),
  dental: require("../../../assets/dental-checkup.png"),
  cardiology: require("../../../assets/doctor.png"),
  pediatrics: require("../../../assets/doctor.png"),
  ambulance: require("../../../assets/ambulance.png"),
  lab: require("../../../assets/Lab.png"),
  nurse: require("../../../assets/nurse.png"),
  physiotherapist: require("../../../assets/physiotherapy.png"),
  pharmacy: require("../../../assets/pharmacy.png")
};

export default function ServicesListScreen({
  services,
  onSelectService,
  onBack
}: Readonly<ServicesListScreenProps>) {
  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Header */}
        <View style={{
          backgroundColor: "#ffffff",
          paddingHorizontal: 20,
          paddingTop: 50,
          paddingBottom: 20,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 }
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <Pressable onPress={onBack} style={styles.backButton}>
              <View style={styles.backIcon} />
            </Pressable>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#0f172a" }}>Our Services</Text>
          </View>
          <Text style={{ fontSize: 14, color: "#64748b", lineHeight: 20 }}>
            Explore our comprehensive healthcare services tailored to your needs
          </Text>
        </View>

        {/* Services List */}
        <View style={{ padding: 20, gap: 16 }}>
          {services.map((service) => (
            <Pressable
              key={service.key}
              onPress={() => onSelectService(service.key)}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 20,
                padding: 20,
                shadowColor: "#0f172a",
                shadowOpacity: 0.08,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 3
              }}
            >
              <View style={{ flexDirection: "row", gap: 16 }}>
                {/* Service Icon */}
                <View style={{
                  width: 72,
                  height: 72,
                  borderRadius: 16,
                  backgroundColor: "#eef2ff",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Image
                    source={serviceIcons[service.key]}
                    style={{ width: 48, height: 48 }}
                    resizeMode="contain"
                  />
                </View>

                {/* Service Content */}
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: "#0f172a",
                    marginBottom: 6
                  }}>
                    {service.title}
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: "#64748b",
                    lineHeight: 18,
                    marginBottom: 12
                  }}>
                    {service.summary}
                  </Text>

                  {/* Action Button */}
                  <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6
                  }}>
                    <Text style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: "#FF6B35"
                    }}>
                      Learn More
                    </Text>
                    <Text style={{ fontSize: 12, color: "#FF6B35" }}>→</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Bottom Info Section */}
        <View style={{
          backgroundColor: "#ffffff",
          marginHorizontal: 20,
          marginBottom: 24,
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: "#e2e8f0"
        }}>
          <Text style={{
            fontSize: 14,
            fontWeight: "700",
            color: "#0f172a",
            marginBottom: 8
          }}>
            Need Help Choosing?
          </Text>
          <Text style={{
            fontSize: 13,
            color: "#64748b",
            lineHeight: 18,
            marginBottom: 12
          }}>
            Our healthcare experts are available 24/7 to help you find the right service.
          </Text>
          <Pressable style={{
            backgroundColor: "#FF6B35",
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: "center"
          }}>
            <Text style={{
              fontSize: 14,
              fontWeight: "700",
              color: "#ffffff"
            }}>
              Contact Support
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
