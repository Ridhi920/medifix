import { useState, useEffect } from "react";
import { View, Text } from "react-native";
import ServiceScreenLayout from "../../components/ServiceScreenLayout";
import { SERVICES } from "../../data/services";
import LoadingScreen from "../../components/LoadingScreen";

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
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingScreen message="Dr. Meddy is preparing pediatric services" />;
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
