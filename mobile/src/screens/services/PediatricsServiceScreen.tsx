import { useState, useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import ServiceScreenLayout from "../../components/ServiceScreenLayout";
import { SERVICES } from "../../data/services";

type PediatricsServiceScreenProps = {
  onBack: () => void;
};

export default function PediatricsServiceScreen({
  onBack
}: Readonly<PediatricsServiceScreenProps>) {
  const [loading, setLoading] = useState<boolean>(true);
  const service = SERVICES.find((item) => item.key === "pediatrics");

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={{ marginTop: 16, fontSize: 16, color: "#64748b", fontWeight: "600" }}>
          Loading Pediatrics...
        </Text>
      </View>
    );
  }

  if (!service) {
    return null;
  }

  return (
    <ServiceScreenLayout
      title={service.title}
      description={service.description}
      onBack={onBack}
    />
  );
}
