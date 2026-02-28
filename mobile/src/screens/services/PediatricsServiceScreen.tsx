import ServiceScreenLayout from "../../components/ServiceScreenLayout";
import { SERVICES } from "../../data/services";

type PediatricsServiceScreenProps = {
  onBack: () => void;
};

export default function PediatricsServiceScreen({
  onBack
}: PediatricsServiceScreenProps) {
  const service = SERVICES.find((item) => item.key === "pediatrics");

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
