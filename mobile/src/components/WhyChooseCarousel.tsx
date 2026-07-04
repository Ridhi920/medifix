import { View, Text, ScrollView } from "react-native";

type Feature = {
  icon: string;
  title: string;
  subtitle: string;
  bg: string;
  iconBg: string;
};

const FEATURES: Feature[] = [
  { icon: "✅", title: "Verified Doctors",   subtitle: "Certified & trusted experts",   bg: "#ecfdf5", iconBg: "#bbf7d0" },
  { icon: "⚡", title: "27-Min Response",    subtitle: "Care when you need it most",    bg: "#fff7ed", iconBg: "#fed7aa" },
  { icon: "💰", title: "Affordable Pricing", subtitle: "Transparent, no hidden fees",   bg: "#eff6ff", iconBg: "#bfdbfe" },
  { icon: "🔒", title: "Safe & Private",     subtitle: "Your data stays protected",     bg: "#f5f3ff", iconBg: "#ddd6fe" },
  { icon: "🏠", title: "Care at Home",       subtitle: "Services at your doorstep",     bg: "#fef2f2", iconBg: "#fecaca" },
];

export default function WhyChooseCarousel() {
  return (
    <View style={{ paddingVertical: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: "700", color: "#0f172a", textAlign: "center", marginBottom: 20 }}>
        Why Choose <Text style={{ color: "#FF6B35" }}>MedEfix</Text>
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 14, paddingHorizontal: 20 }}
      >
        {FEATURES.map((f, i) => (
          <View
            key={i}
            style={{
              width: 150,
              backgroundColor: f.bg,
              borderRadius: 18,
              padding: 18,
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.04)",
            }}
          >
            <View style={{
              width: 52, height: 52, borderRadius: 26,
              backgroundColor: f.iconBg,
              alignItems: "center", justifyContent: "center",
              marginBottom: 14,
            }}>
              <Text style={{ fontSize: 26 }}>{f.icon}</Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#0f172a", marginBottom: 4 }}>
              {f.title}
            </Text>
            <Text style={{ fontSize: 12, color: "#64748b", lineHeight: 16 }}>
              {f.subtitle}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
