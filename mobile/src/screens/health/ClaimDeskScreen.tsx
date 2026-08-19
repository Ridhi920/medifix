import { Pressable, ScrollView, Text, View } from "react-native";
import { styles } from "../../styles";

type ClaimDeskScreenProps = {
  readonly onBack: () => void;
};

const FEATURES = [
  {
    icon: "🏥",
    title: "Cashless claims",
    text: "Raise insurance claims for hospital visits, lab tests, and pharmacy orders directly from MedEfix."
  },
  {
    icon: "🔗",
    title: "Powered by NHCX",
    text: "Claims flow through the National Health Claims Exchange (NHCX) — the standard network connecting insurers and providers."
  },
  {
    icon: "📤",
    title: "Submit in minutes",
    text: "Attach your MedEfix bills and reports and submit a claim without long forms or physical paperwork."
  },
  {
    icon: "📊",
    title: "Track every claim",
    text: "Follow each claim from submitted to approved, with status updates and settlement details in one place."
  }
];

export default function ClaimDeskScreen({ onBack }: Readonly<ClaimDeskScreenProps>) {
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
        <Text style={styles.serviceHeaderTitle}>MedEfix Claim Desk</Text>
      </View>

      <ScrollView contentContainerStyle={styles.featureScreenScroll}>
        <View style={[styles.featureHero, { backgroundColor: "#4338ca" }]}>
          <Text style={styles.featureHeroIcon}>🧾</Text>
          <Text style={styles.featureHeroTitle}>Insurance Claim Desk</Text>
          <Text style={styles.featureHeroSubtitle}>
            File and track health insurance claims from your phone, connected to
            the National Health Claims Exchange (NHCX).
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

        <Pressable style={[styles.featureCta, { backgroundColor: "#4338ca" }]}>
          <Text style={styles.featureCtaText}>Start a Claim</Text>
        </Pressable>
        <Text style={styles.featureNote}>
          Claim Desk is coming soon. MedEfix will integrate with NHCX so you can
          submit and track insurance claims end to end.
        </Text>
      </ScrollView>
    </View>
  );
}
