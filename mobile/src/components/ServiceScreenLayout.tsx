import { Pressable, Text, View } from "react-native";
import { styles } from "../styles";

type ServiceScreenLayoutProps = {
  title: string;
  description: string;
  onBack: () => void;
};

export default function ServiceScreenLayout({
  title,
  description,
  onBack
}: ServiceScreenLayoutProps) {
  return (
    <View style={styles.serviceScreenCard}>
      <View style={styles.serviceHeaderRow}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <View style={styles.backIcon} />
        </Pressable>
        <Text style={styles.serviceHeaderTitle}>Service</Text>
      </View>
      <Text style={styles.serviceTitle}>{title}</Text>
      <Text style={styles.serviceDescription}>{description}</Text>
    </View>
  );
}
