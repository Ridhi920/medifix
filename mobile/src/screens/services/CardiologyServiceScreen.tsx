import { useState, useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import ServiceScreenLayout from "../../components/ServiceScreenLayout";
import { SERVICES } from "../../data/services";

type CardiologyServiceScreenProps = {
  onBack: () => void;
};

export default function CardiologyServiceScreen({
  onBack
}: Readonly<CardiologyServiceScreenProps>) {
  const [loading, setLoading] = useState<boolean>(true);
  const service = SERVICES.find((item) => item.key === "cardiology");

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
          Loading Cardiology...
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
