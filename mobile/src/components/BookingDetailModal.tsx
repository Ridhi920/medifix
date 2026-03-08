import { Modal, View, Text, Pressable, ScrollView } from "react-native";

type BookingDetailModalProps = {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly booking: {
    id: number;
    type: "doctor" | "lab" | "ambulance";
    service_name: string;
    date: string;
    time?: string;
    status: string;
    patient_name?: string;
    patient_age?: number;
    patient_phone?: string;
    patient_address?: string;
    pickup_location?: string;
    destination?: string;
    notes?: string;
    created_at: string;
  };
};

export default function BookingDetailModal({ visible, onClose, booking }: Readonly<BookingDetailModalProps>) {
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "pending") return "#FF6B35";
    if (statusLower === "confirmed" || statusLower === "scheduled") return "#10b981";
    if (statusLower === "completed") return "#3b82f6";
    if (statusLower === "cancelled") return "#ef4444";
    if (statusLower === "dispatched") return "#8b5cf6";
    return "#64748b";
  };

  const getTypeIcon = (type: string) => {
    if (type === "doctor") return "👨‍⚕️";
    if (type === "lab") return "🔬";
    if (type === "ambulance") return "🚑";
    return "📋";
  };

  const getTypeLabel = (type: string) => {
    if (type === "doctor") return "Doctor Appointment";
    if (type === "lab") return "Lab Test";
    if (type === "ambulance") return "Ambulance Booking";
    return "Booking";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const DetailRow = ({ label, value }: { label: string; value: string | undefined }) => {
    if (!value) return null;
    return (
      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: "600" }}>
          {label}
        </Text>
        <Text style={{ fontSize: 16, color: "#0f172a" }}>{value}</Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <View
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 20,
            padding: 24,
            width: "100%",
            maxHeight: "85%",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
          }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={{ alignItems: "center", marginBottom: 24 }}>
              <Text style={{ fontSize: 48, marginBottom: 8 }}>{getTypeIcon(booking.type)}</Text>
              <Text style={{ fontSize: 22, fontWeight: "800", color: "#0f172a", marginBottom: 4, textAlign: "center" }}>
                {booking.service_name}
              </Text>
              <Text style={{ fontSize: 14, color: "#64748b", marginBottom: 12 }}>
                {getTypeLabel(booking.type)}
              </Text>
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: getStatusColor(booking.status) + "20",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: getStatusColor(booking.status),
                    textTransform: "capitalize",
                  }}
                >
                  {booking.status}
                </Text>
              </View>
            </View>

            {/* Booking Details */}
            <View
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: 16,
                padding: 16,
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: "#0f172a",
                  marginBottom: 16,
                }}
              >
                Booking Details
              </Text>

              <DetailRow label="Booking ID" value={`#${booking.id}`} />
              <DetailRow label="Date" value={formatDate(booking.date)} />
              {booking.time && <DetailRow label="Time" value={booking.time} />}
              {booking.patient_name && <DetailRow label="Patient Name" value={booking.patient_name} />}
              {booking.patient_age && <DetailRow label="Patient Age" value={`${booking.patient_age} years`} />}
              {booking.patient_phone && <DetailRow label="Phone" value={booking.patient_phone} />}
              {booking.patient_address && <DetailRow label="Address" value={booking.patient_address} />}
              {booking.pickup_location && <DetailRow label="Pickup Location" value={booking.pickup_location} />}
              {booking.destination && <DetailRow label="Destination" value={booking.destination} />}
              {booking.notes && <DetailRow label="Notes" value={booking.notes} />}
              <DetailRow label="Booked On" value={formatDate(booking.created_at)} />
            </View>

            {/* Close Button */}
            <Pressable
              onPress={onClose}
              style={{
                backgroundColor: "#FF6B35",
                paddingVertical: 14,
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 16,
                  fontWeight: "700",
                  color: "#ffffff",
                }}
              >
                Close
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
