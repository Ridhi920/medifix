import ServiceScreenLayout from "../../components/ServiceScreenLayout";
import { SERVICES } from "../../data/services";

type DentalServiceScreenProps = {
  onBack: () => void;
};

export default function DentalServiceScreen({ onBack }: DentalServiceScreenProps) {
  const service = SERVICES.find((item) => item.key === "dental");

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
