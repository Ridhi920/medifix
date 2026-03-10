import { useState, useEffect } from "react";
import { View, Text } from "react-native";
import ServiceScreenLayout from "../../components/ServiceScreenLayout";
import { SERVICES } from "../../data/services";
import LoadingScreen from "../../components/LoadingScreen";

type DentalServiceScreenProps = {
  onBack: () => void;
};

export default function DentalServiceScreen({ onBack }: Readonly<DentalServiceScreenProps>) {
  const [loading, setLoading] = useState<boolean>(true);
  const service = SERVICES.find((item) => item.key === "dental");

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingScreen message="Dr. Meddy is finding dental services for you" />;
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
