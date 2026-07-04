import { useState } from "react";
import { Pressable, ScrollView, Text, View, Linking } from "react-native";
import { styles } from "../../styles";
import CustomAlert from "../../components/CustomAlert";

type SupportScreenProps = {
  readonly onBack: () => void;
};

// ─────────────────────────────────────────────────────────────────────────────
// TODO: Fill these in once the WhatsApp business details are available.
//   WHATSAPP_NUMBER → country code + number, digits only (e.g. "919876543210")
//   Leave WHATSAPP_NUMBER empty ("") to show a "coming soon" message instead.
// ─────────────────────────────────────────────────────────────────────────────
const WHATSAPP_NUMBER = "";
const WHATSAPP_DEFAULT_MESSAGE = "Hi MedEfix team, I need some help.";

const QUICK_TOPICS: { icon: string; label: string; message: string }[] = [
  { icon: "📦", label: "Track my order",        message: "Hi, I'd like to track my pharmacy order." },
  { icon: "📅", label: "Booking help",          message: "Hi, I need help with one of my bookings." },
  { icon: "💳", label: "Payment & refunds",     message: "Hi, I have a question about a payment or refund." },
  { icon: "📋", label: "Prescription review",   message: "Hi, I'd like to check on my prescription review." },
  { icon: "❓", label: "Something else",         message: WHATSAPP_DEFAULT_MESSAGE },
];

type AlertState = { visible: boolean; type: "info" | "error"; title: string; message: string };

export default function SupportScreen({ onBack }: Readonly<SupportScreenProps>) {
  const [alert, setAlert] = useState<AlertState>({ visible: false, type: "info", title: "", message: "" });

  const openWhatsApp = async (prefill?: string) => {
    if (!WHATSAPP_NUMBER) {
      setAlert({
        visible: true,
        type: "info",
        title: "WhatsApp Support Coming Soon",
        message: "Our WhatsApp support line is being set up and will be available very shortly. Thanks for your patience!",
      });
      return;
    }
    const text = encodeURIComponent(prefill || WHATSAPP_DEFAULT_MESSAGE);
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        throw new Error("cannot open");
      }
    } catch {
      setAlert({
        visible: true,
        type: "error",
        title: "Couldn't open WhatsApp",
        message: "Please make sure WhatsApp is installed on your device and try again.",
      });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.homeScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.serviceScreenCard}>
        {/* Header */}
        <View style={styles.serviceHeaderRow}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <View style={styles.backIcon} />
          </Pressable>
          <Text style={styles.serviceHeaderTitle}>Support</Text>
        </View>

        <Text style={styles.serviceTitle}>How can we help?</Text>
        <Text style={styles.serviceDescription}>
          Chat with our support team on WhatsApp — quick replies, real people.
        </Text>

        {/* WhatsApp hero card */}
        <View style={{
          backgroundColor: "#25D366",
          borderRadius: 20,
          padding: 22,
          marginTop: 20,
          shadowColor: "#25D366",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 6,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
            <View style={{
              width: 56, height: 56, borderRadius: 28,
              backgroundColor: "rgba(255,255,255,0.2)",
              alignItems: "center", justifyContent: "center", marginRight: 14,
            }}>
              <Text style={{ fontSize: 30 }}>💬</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#ffffff" }}>WhatsApp Chat</Text>
              <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                Typically replies in a few minutes
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => openWhatsApp()}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "800", color: "#128C7E" }}>
              Start Chat on WhatsApp
            </Text>
          </Pressable>
        </View>

        {/* Quick topics */}
        <Text style={{ fontSize: 16, fontWeight: "700", color: "#0f172a", marginTop: 28, marginBottom: 12 }}>
          Quick Help
        </Text>
        <View style={{ gap: 10 }}>
          {QUICK_TOPICS.map((topic) => (
            <Pressable
              key={topic.label}
              onPress={() => openWhatsApp(topic.message)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#ffffff",
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: "#e2e8f0",
              }}
            >
              <View style={{
                width: 42, height: 42, borderRadius: 12,
                backgroundColor: "#f0fdf4",
                alignItems: "center", justifyContent: "center", marginRight: 12,
              }}>
                <Text style={{ fontSize: 20 }}>{topic.icon}</Text>
              </View>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: "#0f172a" }}>
                {topic.label}
              </Text>
              <Text style={{ fontSize: 18, color: "#cbd5e1" }}>›</Text>
            </Pressable>
          ))}
        </View>

        {/* Support hours */}
        <View style={{
          backgroundColor: "#f8fafc",
          borderRadius: 14,
          padding: 16,
          marginTop: 24,
          flexDirection: "row",
          alignItems: "center",
        }}>
          <Text style={{ fontSize: 22, marginRight: 12 }}>🕐</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#0f172a" }}>Support Hours</Text>
            <Text style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
              Available 24 / 7 for all your healthcare needs
            </Text>
          </View>
        </View>
      </View>

      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert({ ...alert, visible: false })}
        primaryButtonText="OK"
      />
    </ScrollView>
  );
}
