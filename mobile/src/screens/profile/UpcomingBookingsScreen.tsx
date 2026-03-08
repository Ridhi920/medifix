import { useState, useEffect } from "react";
import { Pressable, ScrollView, Text, View, RefreshControl } from "react-native";
import { styles } from "../../styles";
import { userAPI } from "../../api/userApi";
import { parseBackendErrors } from "../../utils/errorHandler";
import CustomAlert from "../../components/CustomAlert";
import BookingDetailModal from "../../components/BookingDetailModal";
import LoadingScreen from "../../components/LoadingScreen";

type UpcomingBookingsScreenProps = {
  readonly onBack: () => void;
};

type Booking = {
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

type AlertState = {
  visible: boolean;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
};

export default function UpcomingBookingsScreen({ onBack }: Readonly<UpcomingBookingsScreenProps>) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [alert, setAlert] = useState<AlertState>({
    visible: false,
    type: "info",
    title: "",
    message: "",
  });

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const [allBookings] = await Promise.all([
        userAPI.getAllBookings(),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);
      
      // Transform bookings into a unified format
      const transformedBookings: Booking[] = [];

      // Add doctor appointments
      allBookings.appointments.forEach((apt) => {
        transformedBookings.push({
          id: apt.id,
          type: "doctor",
          service_name: apt.doctor_name,
          date: apt.appointment_day,
          time: apt.appointment_slot,
          status: apt.status,
          patient_name: apt.patient_name,
          patient_age: apt.patient_age,
          notes: apt.symptoms,
          created_at: apt.created_at,
        });
      });

      // Add lab bookings
      allBookings.labBookings.forEach((lab) => {
        transformedBookings.push({
          id: lab.id,
          type: "lab",
          service_name: lab.test_name,
          date: lab.collection_date,
          time: lab.collection_time,
          status: lab.status,
          patient_name: lab.patient_name,
          patient_age: lab.patient_age,
          patient_phone: lab.patient_phone,
          patient_address: lab.address,
          created_at: lab.created_at,
        });
      });

      // Add ambulance bookings
      allBookings.ambulanceBookings.forEach((amb) => {
        transformedBookings.push({
          id: amb.id,
          type: "ambulance",
          service_name: amb.ambulance_name,
          date: amb.scheduled_date || "",
          time: amb.scheduled_time,
          status: amb.status,
          patient_name: amb.patient_name,
          patient_phone: amb.contact_number,
          pickup_location: amb.pickup_address,
          destination: amb.dropoff_address,
          notes: amb.medical_condition,
          created_at: amb.created_at,
        });
      });

      // Filter upcoming bookings (pending, confirmed, scheduled, dispatched)
      const upcoming = transformedBookings.filter((booking) => {
        const status = booking.status.toLowerCase();
        return ["pending", "confirmed", "scheduled", "dispatched"].includes(status);
      });

      setBookings(upcoming);
    } catch (error: any) {
      console.error("Error loading bookings:", error);
      setAlert({
        visible: true,
        type: "error",
        title: "Loading Failed",
        message: parseBackendErrors(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "pending") return "#FF6B35";
    if (statusLower === "confirmed" || statusLower === "scheduled") return "#10b981";
    if (statusLower === "dispatched") return "#8b5cf6";
    return "#64748b";
  };

  const getTypeIcon = (type: string) => {
    if (type === "doctor") return "👨‍⚕️";
    if (type === "lab") return "🔬";
    if (type === "ambulance") return "🚑";
    return "📋";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <Pressable
      onPress={() => setSelectedBooking(booking)}
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        <Text style={{ fontSize: 32, marginRight: 12 }}>{getTypeIcon(booking.type)}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#0f172a", marginBottom: 2 }}>
            {booking.service_name}
          </Text>
          <Text style={{ fontSize: 13, color: "#64748b" }}>
            {formatDate(booking.date)} {booking.time && `• ${booking.time}`}
          </Text>
        </View>
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 12,
            backgroundColor: getStatusColor(booking.status) + "20",
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: getStatusColor(booking.status),
              textTransform: "capitalize",
            }}
          >
            {booking.status}
          </Text>
        </View>
      </View>

      {booking.patient_name && (
        <View style={{ backgroundColor: "#f8fafc", borderRadius: 8, padding: 10 }}>
          <Text style={{ fontSize: 13, color: "#64748b" }}>
            Patient: <Text style={{ fontWeight: "600", color: "#0f172a" }}>{booking.patient_name}</Text>
          </Text>
        </View>
      )}
    </Pressable>
  );

  if (loading) {
    return <LoadingScreen message="Dr. Meddy is checking your upcoming bookings" />;
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.homeScroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FF6B35"]} />}
    >
      <View style={styles.serviceScreenCard}>
        <View style={styles.serviceHeaderRow}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <View style={styles.backIcon} />
          </Pressable>
          <Text style={styles.serviceHeaderTitle}>Upcoming Bookings</Text>
        </View>

        {bookings.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>📅</Text>
            <Text style={{ fontSize: 18, fontWeight: "600", color: "#64748b", marginBottom: 8 }}>
              No Upcoming Bookings
            </Text>
            <Text style={{ fontSize: 14, color: "#94a3b8", textAlign: "center" }}>
              Your scheduled appointments will appear here
            </Text>
          </View>
        ) : (
          <View>
            <Text style={{ fontSize: 14, color: "#64748b", marginBottom: 16 }}>
              {bookings.length} {bookings.length === 1 ? "booking" : "bookings"} scheduled
            </Text>
            {bookings.map((booking) => (
              <BookingCard key={`${booking.type}-${booking.id}`} booking={booking} />
            ))}
          </View>
        )}
      </View>

      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert({ ...alert, visible: false })}
        primaryButtonText="OK"
      />

      {selectedBooking && (
        <BookingDetailModal
          visible={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          booking={selectedBooking}
        />
      )}
    </ScrollView>
  );
}
