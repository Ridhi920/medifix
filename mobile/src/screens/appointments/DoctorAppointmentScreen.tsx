import { useState } from "react";
import { Pressable, ScrollView, Text, View, TextInput } from "react-native";
import { styles } from "../../styles";
import { DOCTORS, type Doctor } from "../../data/doctors";

type DoctorAppointmentScreenProps = {
  onBack: () => void;
};

export default function DoctorAppointmentScreen({ onBack }: DoctorAppointmentScreenProps) {
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [patientName, setPatientName] = useState<string>("");
  const [patientAge, setPatientAge] = useState<string>("");
  const [symptoms, setSymptoms] = useState<string>("");
  const [showBookingForm, setShowBookingForm] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Filter doctors based on search query
  const filteredDoctors = DOCTORS.filter((doctor) => {
    const query = searchQuery.toLowerCase();
    return (
      doctor.name.toLowerCase().includes(query) ||
      doctor.specialty.toLowerCase().includes(query)
    );
  });

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setSelectedDay("");
    setSelectedSlot("");
    setShowBookingForm(false);
  };

  const handleBookAppointment = () => {
    if (selectedDoctor && selectedDay && selectedSlot && patientName && patientAge) {
      // In a real app, this would make an API call
      alert(`Appointment booked with ${selectedDoctor.name}\nDay: ${selectedDay}\nTime: ${selectedSlot}\nPatient: ${patientName}`);
      // Reset form
      setSelectedDoctor(null);
      setSelectedDay("");
      setSelectedSlot("");
      setPatientName("");
      setPatientAge("");
      setSymptoms("");
      setShowBookingForm(false);
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

        {/* Search Bar */}
        {!selectedDoctor && (
          <View style={{
            backgroundColor: "#f1f5f9",
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: "row",
            alignItems: "center",
            marginTop: 16,
            borderWidth: 1,
            borderColor: "#e2e8f0"
          }}>
            <Text style={{ fontSize: 16, color: "#94a3b8", marginRight: 8 }}>🔍</Text>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name or specialty"
              placeholderTextColor="#94a3b8"
              style={{
                flex: 1,
                fontSize: 14,
                color: "#0f172a",
                paddingVertical: 0
              }}
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery("")}>
                <Text style={{ fontSize: 16, color: "#64748b", fontWeight: "700" }}>✕</Text>
              </Pressable>
            ) : null}
          </View>
        )}

        {/* Doctors List */}
        {!selectedDoctor && (
          <View style={{ marginTop: 24 }}>
            <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>
              Available Doctors {searchQuery ? `(${filteredDoctors.length})` : ""}
            </Text>
            {filteredDoctors.length === 0 ? (
              <View style={{
                backgroundColor: "#f8fafc",
                borderRadius: 16,
                padding: 24,
                alignItems: "center"
              }}>
                <Text style={{ fontSize: 16, color: "#64748b", textAlign: "center" }}>
                  No doctors found matching "{searchQuery}"
                </Text>
              </View>
            ) : (
              filteredDoctors.map((doctor) => (
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
                        ₹{doctor.consultationFee}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))
            )}
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
              {selectedDoctor.availableDays.map((day) => (
                <Pressable
                  key={day}
                  onPress={() => setSelectedDay(day)}
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
            {selectedDay && (
              <>
                <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Select Time Slot</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                  {selectedDoctor.availableSlots.map((slot) => (
                    <Pressable
                      key={slot}
                      onPress={() => {
                        setSelectedSlot(slot);
                        setShowBookingForm(true);
                      }}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: 12,
                        backgroundColor: selectedSlot === slot ? "#FF6B35" : "#f1f5f9",
                        borderWidth: 1,
                        borderColor: selectedSlot === slot ? "#FF6B35" : "#e2e8f0"
                      }}
                    >
                      <Text style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: selectedSlot === slot ? "#ffffff" : "#0f172a"
                      }}>
                        {slot}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            {/* Booking Form */}
            {showBookingForm && selectedSlot && (
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
                    Consultation Fee: ₹{selectedDoctor.consultationFee}
                  </Text>
                </View>

                {/* Book Button */}
                <Pressable
                  onPress={handleBookAppointment}
                  disabled={!patientName || !patientAge}
                  style={{
                    backgroundColor: patientName && patientAge ? "#FF6B35" : "#cbd5e1",
                    borderRadius: 14,
                    paddingVertical: 14,
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Text style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: "#ffffff"
                  }}>
                    Confirm Booking
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
