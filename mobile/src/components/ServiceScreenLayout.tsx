import { Pressable, Text, View } from "react-native";
import { styles } from "../styles";

type ServiceScreenLayoutProps = {
  readonly title: string;
  readonly description: string;
  readonly onBack: () => void;
};

export default function ServiceScreenLayout({
  title,
  description,
  onBack
}: Readonly<ServiceScreenLayoutProps>) {
  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
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
    </View>
  );
}
