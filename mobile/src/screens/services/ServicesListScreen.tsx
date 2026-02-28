import { Pressable, ScrollView, Text, View } from "react-native";
import { styles } from "../../styles";
import { type ServiceItem, type ServiceKey } from "../../data/services";

type ServicesListScreenProps = {
  services: ServiceItem[];
  onSelectService: (key: ServiceKey) => void;
  onBack: () => void;
};

export default function ServicesListScreen({
  services,
  onSelectService,
  onBack
}: ServicesListScreenProps) {
  return (
    <View style={styles.serviceScreenCard}>
      <View style={styles.serviceHeaderRow}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <View style={styles.backIcon} />
        </Pressable>
        <Text style={styles.serviceHeaderTitle}>Services</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {services.map((service) => (
          <Pressable
            key={service.key}
            style={styles.serviceListCard}
            onPress={() => onSelectService(service.key)}
          >
            <Text style={styles.serviceListTitle}>{service.title}</Text>
            <Text style={styles.serviceListSubtitle}>{service.summary}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
