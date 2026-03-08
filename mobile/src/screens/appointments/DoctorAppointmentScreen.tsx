import { useState, useEffect } from "react";
import { Pressable, ScrollView, Text, View, TextInput, ActivityIndicator, Alert } from "react-native";
import { styles } from "../../styles";
import { doctorAPI, type Doctor } from "../../services/api";

type DoctorAppointmentScreenProps = {
  readonly onBack: () => void;
};

export default function DoctorAppointmentScreen({ onBack }: Readonly<DoctorAppointmentScreenProps>) {
  const [loading, setLoading] = useState<boolean>(true);
  const [booking, setBooking] = useState<boolean>(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [patientName, setPatientName] = useState<string>("");
  const [patientAge, setPatientAge] = useState<string>("");
  const [symptoms, setSymptoms] = useState<string>("");
  const [showBookingForm, setShowBookingForm] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await doctorAPI.getDoctors();
      setDoctors(data);
    } catch (err: any) {
      console.error("Error fetching doctors:", err);
      setError(err.response?.data?.detail || "Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  const fetchBookedSlots = async (doctorId: number, day: string) => {
    try {
      setLoadingSlots(true);
      const slots = await doctorAPI.getBookedSlots(doctorId, day);
      setBookedSlots(slots);
    } catch (err: any) {
      console.error("Error fetching booked slots:", err);
      setBookedSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDaySelect = async (day: string) => {
    setSelectedDay(day);
    setSelectedSlot("");
    setShowBookingForm(false);
    
    if (selectedDoctor) {
      await fetchBookedSlots(selectedDoctor.id, day);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#ffffff" }}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={{ marginTop: 16, fontSize: 16, color: "#64748b" }}>Loading Doctors...</Text>
      </View>
    );
  }

  if (error && doctors.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#ffffff", padding: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: "600", color: "#ef4444", marginBottom: 12 }}>
          Error Loading Doctors
        </Text>
        <Text style={{ fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 24 }}>
          {error}
        </Text>
        <Pressable
          onPress={fetchDoctors}
          style={{
            backgroundColor: "#FF6B35",
            borderRadius: 12,
            paddingHorizontal: 24,
            paddingVertical: 12
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#ffffff" }}>
            Try Again
          </Text>
        </Pressable>
      </View>
    );
  }

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setSelectedDay("");
    setSelectedSlot("");
    setShowBookingForm(false);
    setBookedSlots([]);
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedDay || !selectedSlot || !patientName || !patientAge) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    const age = parseInt(patientAge, 10);
    if (isNaN(age) || age <= 0 || age >= 150) {
      Alert.alert("Error", "Please enter a valid age");
      return;
    }

    try {
      setBooking(true);
      await doctorAPI.bookAppointment({
        doctor_id: selectedDoctor.id,
        patient_name: patientName,
        patient_age: age,
        symptoms: symptoms || undefined,
        appointment_day: selectedDay,
        appointment_slot: selectedSlot,
      });

      Alert.alert(
        "Success!",
        `Appointment booked with ${selectedDoctor.name}\nDay: ${selectedDay}\nTime: ${selectedSlot}`,
        [{ text: "OK", onPress: () => {
          // Reset form
          setSelectedDoctor(null);
          setSelectedDay("");
          setSelectedSlot("");
          setPatientName("");
          setPatientAge("");
          setSymptoms("");
          setShowBookingForm(false);
        }}]
      );
    } catch (err: any) {
      console.error("Error booking appointment:", err);
      const errorMessage = err.response?.data?.detail || "Failed to book appointment";
      Alert.alert("Booking Failed", errorMessage);
    } finally {
      setBooking(false);
    }
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.homeScroll}
    >
      <View style={styles.serviceScreenCard}>
        {/* Header */}
        <View style={styles.serviceHeaderRow}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <View style={styles.backIcon} />
          </Pressable>
          <Text style={styles.serviceHeaderTitle}>Book Appointment</Text>
        </View>

        {/* Description */}
        <Text style={styles.serviceTitle}>Find Your Doctor</Text>
        <Text style={styles.serviceDescription}>
          Browse through our expert doctors and book an appointment that suits you best.
        </Text>

        {/* Doctors List */}
        {!selectedDoctor && (
          <View style={{ marginTop: 24 }}>
            <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Available Doctors</Text>
            {doctors.map((doctor) => (
              <Pressable
                key={doctor.id}
                onPress={() => handleDoctorSelect(doctor)}
                style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: "#e2e8f0"
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                  <Text style={{ fontSize: 40 }}>{doctor.image}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: "#0f172a" }}>
                      {doctor.name}
                    </Text>
                    <Text style={{ fontSize: 14, color: "#FF6B35", marginTop: 2 }}>
                      {doctor.specialty}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                      {doctor.qualification}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 12 }}>
                      <Text style={{ fontSize: 12, color: "#0f172a" }}>
                        ⭐ {doctor.rating}
                      </Text>
                      <Text style={{ fontSize: 12, color: "#64748b" }}>
                        {doctor.experience} years exp.
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
                      📍 {doctor.address}
                    </Text>
                    <View style={{ 
                      marginTop: 8,
                      backgroundColor: "#eef2ff",
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      alignSelf: "flex-start"
                    }}>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: "#1e3a8a" }}>
                        ₹{doctor.consultation_fee}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Selected Doctor & Booking */}
        {selectedDoctor && (
          <View style={{ marginTop: 24 }}>
            {/* Selected Doctor Card */}
            <View style={{
              backgroundColor: "#eef2ff",
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              borderWidth: 2,
              borderColor: "#1e3a8a"
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                  <Text style={{ fontSize: 36 }}>{selectedDoctor.image}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: "#0f172a" }}>
                      {selectedDoctor.name}
                    </Text>
                    <Text style={{ fontSize: 14, color: "#FF6B35" }}>
                      {selectedDoctor.specialty}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => setSelectedDoctor(null)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: "#ffffff",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Text style={{ color: "#0f172a", fontWeight: "700" }}>✕</Text>
                </Pressable>
              </View>
            </View>

            {/* Select Day */}
            <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Select Day</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {selectedDoctor.available_days.map((day) => (
                <Pressable
                  key={day}
                  onPress={() => handleDaySelect(day)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: selectedDay === day ? "#1e3a8a" : "#f1f5f9",
                    borderWidth: 1,
                    borderColor: selectedDay === day ? "#1e3a8a" : "#e2e8f0"
                  }}
                >
                  <Text style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: selectedDay === day ? "#ffffff" : "#0f172a"
                  }}>
                    {day}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Select Time Slot */}
            {Boolean(selectedDay) && (
              <>
                <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Select Time Slot</Text>
                {loadingSlots && (
                  <View style={{ paddingVertical: 20, alignItems: "center" }}>
                    <ActivityIndicator size="small" color="#FF6B35" />
                    <Text style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>Checking availability...</Text>
                  </View>
                )}
                {!loadingSlots && (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                    {selectedDoctor.available_slots.map((slot) => {
                      const isBooked = bookedSlots.includes(slot);
                      const isSelected = selectedSlot === slot;
                      return (
                        <Pressable
                          key={slot}
                          onPress={() => {
                            if (!isBooked) {
                              setSelectedSlot(slot);
                              setShowBookingForm(true);
                            }
                          }}
                          disabled={isBooked}
                          style={{
                            paddingHorizontal: 14,
                            paddingVertical: 10,
                            borderRadius: 12,
                            backgroundColor: isBooked ? "#fecaca" : (isSelected ? "#FF6B35" : "#f1f5f9"),
                            borderWidth: 1,
                            borderColor: isBooked ? "#ef4444" : (isSelected ? "#FF6B35" : "#e2e8f0"),
                            opacity: isBooked ? 0.6 : 1
                          }}
                        >
                          <Text style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color: isBooked ? "#991b1b" : (isSelected ? "#ffffff" : "#0f172a")
                          }}>
                            {slot} {isBooked ? "✕" : ""}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </>
            )}

            {/* Booking Form */}
            {Boolean(showBookingForm && selectedSlot) && (
              <View style={{
                backgroundColor: "#f8fafc",
                borderRadius: 16,
                padding: 16,
                marginTop: 8
              }}>
                <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Patient Details</Text>
                
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#0f172a", marginBottom: 6 }}>
                  Patient Name*
                </Text>
                <TextInput
                  value={patientName}
                  onChangeText={setPatientName}
                  placeholder="Enter patient name"
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                    fontSize: 14,
                    color: "#0f172a"
                  }}
                />

                <Text style={{ fontSize: 13, fontWeight: "600", color: "#0f172a", marginBottom: 6 }}>
                  Age*
                </Text>
                <TextInput
                  value={patientAge}
                  onChangeText={setPatientAge}
                  placeholder="Enter age"
                  keyboardType="numeric"
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                    fontSize: 14,
                    color: "#0f172a"
                  }}
                />

                <Text style={{ fontSize: 13, fontWeight: "600", color: "#0f172a", marginBottom: 6 }}>
                  Symptoms (Optional)
                </Text>
                <TextInput
                  value={symptoms}
                  onChangeText={setSymptoms}
                  placeholder="Describe your symptoms"
                  multiline
                  numberOfLines={4}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                    fontSize: 14,
                    color: "#0f172a",
                    textAlignVertical: "top",
                    minHeight: 80
                  }}
                />

                {/* Booking Summary */}
                <View style={{
                  backgroundColor: "#eef2ff",
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 16
                }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#0f172a", marginBottom: 8 }}>
                    Appointment Summary
                  </Text>
                  <Text style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                    Doctor: {selectedDoctor.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                    Day: {selectedDay}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                    Time: {selectedSlot}
                  </Text>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#1e3a8a", marginTop: 8 }}>
                    Consultation Fee: ₹{selectedDoctor.consultation_fee}
                  </Text>
                </View>

                {/* Book Button */}
                <Pressable
                  onPress={handleBookAppointment}
                  disabled={!patientName || !patientAge || booking}
                  style={{
                    backgroundColor: (patientName && patientAge && !booking) ? "#FF6B35" : "#cbd5e1",
                    borderRadius: 14,
                    paddingVertical: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 8
                  }}
                >
                  {booking && <ActivityIndicator size="small" color="#ffffff" />}
                  <Text style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: "#ffffff"
                  }}>
                    {booking ? "Booking..." : "Book Appointment"}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
