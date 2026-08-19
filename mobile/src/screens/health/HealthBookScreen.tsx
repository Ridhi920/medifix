import { Pressable, ScrollView, Text, View } from "react-native";
import { styles } from "../../styles";

type HealthBookScreenProps = {
  readonly onBack: () => void;
};

const FEATURES = [
  {
    icon: "🆔",
    title: "Link your ABHA",
    text: "Create or link your Ayushman Bharat Health Account (14-digit ABHA number) to carry your health identity everywhere."
  },
  {
    icon: "📋",
    title: "All records in one place",
    text: "Prescriptions, lab reports, and visit history from MedEfix — stored securely in your personal Health Book."
  },
  {
    icon: "📷",
    title: "Scan & Share",
    text: "Share your records with any ABDM-linked hospital by scanning a QR code — no paperwork, no repeat tests."
  },
  {
    icon: "🔒",
    title: "You control consent",
    text: "Records are only shared when you approve. Grant or revoke access to any provider at any time."
  }
];

export default function HealthBookScreen({ onBack }: Readonly<HealthBookScreenProps>) {
  return (
    <View style={{ flex: 1, backgroundColor: "#F8F5F0" }}>
      <View style={styles.featureHeaderRow}>
        <Pressable
          onPress={onBack}
          style={styles.featureBackButton}
          hitSlop={12}
        >
          <View style={styles.backIcon} />
        </Pressable>
        <Text style={styles.serviceHeaderTitle}>MedEfix Health Book</Text>
      </View>

      <ScrollView contentContainerStyle={styles.featureScreenScroll}>
        <View style={[styles.featureHero, { backgroundColor: "#0f766e" }]}>
          <Text style={styles.featureHeroIcon}>📖</Text>
          <Text style={styles.featureHeroTitle}>Your Digital Health Book</Text>
          <Text style={styles.featureHeroSubtitle}>
            One secure home for your health records, powered by India's Ayushman
            Bharat Digital Mission (ABDM).
          </Text>
        </View>

        {FEATURES.map((f) => (
          <View key={f.title} style={styles.featureItemRow}>
            <Text style={styles.featureItemIcon}>{f.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureItemTitle}>{f.title}</Text>
              <Text style={styles.featureItemText}>{f.text}</Text>
            </View>
          </View>
        ))}

        <Pressable style={[styles.featureCta, { backgroundColor: "#0f766e" }]}>
          <Text style={styles.featureCtaText}>Link ABHA Number</Text>
        </Pressable>
        <Text style={styles.featureNote}>
          ABHA linking is coming soon. MedEfix will connect to the ABDM network
          so you can create your ABHA and sync records securely.
        </Text>
      </ScrollView>
    </View>
  );
}
