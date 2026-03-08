import { useState, useEffect } from "react";
import { View, Text } from "react-native";
import ServiceScreenLayout from "../../components/ServiceScreenLayout";
import { SERVICES } from "../../data/services";
import LoadingScreen from "../../components/LoadingScreen";

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
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingScreen message="Dr. Meddy is finding cardiology specialists" />;
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
