import ServiceScreenLayout from "../../components/ServiceScreenLayout";
import { SERVICES } from "../../data/services";

type CardiologyServiceScreenProps = {
  onBack: () => void;
};

export default function CardiologyServiceScreen({
  onBack
}: CardiologyServiceScreenProps) {
  const service = SERVICES.find((item) => item.key === "cardiology");

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
