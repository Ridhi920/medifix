import { useState, useEffect } from "react";
import { Pressable, ScrollView, Text, View, TextInput, Linking, ActivityIndicator } from "react-native";
import { styles } from "../../styles";
import { ambulanceAPI, type Ambulance } from "../../api/ambulanceApi";
import { parseBackendErrors, validators } from "../../utils/errorHandler";
import CustomAlert from "../../components/CustomAlert";
import LoadingScreen from "../../components/LoadingScreen";

const EMERGENCY_CONTACTS = [
  { name: "Emergency", number: "108" },
  { name: "Police", number: "100" },
  { name: "Fire", number: "101" },
  { name: "NDRF", number: "011-24363260" }
];

type AmbulanceBookingScreenProps = {
  readonly onBack: () => void;
};

type BookingMode = "now" | "schedule";

type ValidationErrors = {
  patientName?: string;
  contactNumber?: string;
  pickupAddress?: string;
  scheduledDate?: string;
  scheduledTime?: string;
};

type AlertState = {
  visible: boolean;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  onConfirm?: () => void;
};

export default function AmbulanceBookingScreen({ onBack }: Readonly<AmbulanceBookingScreenProps>) {
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [bookingMode, setBookingMode] = useState<BookingMode>("now");
  const [selectedAmbulance, setSelectedAmbulance] = useState<Ambulance | null>(null);
  const [patientName, setPatientName] = useState<string>("");
  const [contactNumber, setContactNumber] = useState<string>("");
  const [pickupAddress, setPickupAddress] = useState<string>("");
  const [dropoffAddress, setDropoffAddress] = useState<string>("");
  const [medicalCondition, setMedicalCondition] = useState<string>("");
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [scheduledTime, setScheduledTime] = useState<string>("");
  const [showBookingForm, setShowBookingForm] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [alert, setAlert] = useState<AlertState>({
    visible: false,
    type: "info",
    title: "",
    message: ""
  });

  useEffect(() => {
    fetchAmbulances();
  }, []);

  const fetchAmbulances = async () => {
    try {
      setLoading(true);
      const [data] = await Promise.all([
        ambulanceAPI.getAmbulances(),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);
      setAmbulances(data);
    } catch (error: any) {
      console.error('Failed to fetch ambulances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAmbulanceSelect = (ambulance: Ambulance) => {
    if (!ambulance.is_active) return;
    setSelectedAmbulance(ambulance);
    setShowBookingForm(true);
  };

  const handleEmergencyCall = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  const validateForm = (): { isValid: boolean; errors: ValidationErrors } => {
    const errors: ValidationErrors = {};

    // Use validators from utility
    errors.patientName = validators.name(patientName);
    errors.contactNumber = validators.phone(contactNumber);
    errors.pickupAddress = validators.address(pickupAddress);

    // Schedule validation
    if (bookingMode === "schedule") {
      errors.scheduledDate = validators.date(scheduledDate);
      errors.scheduledTime = validators.required(scheduledTime, "Scheduled time");
    }

    // Remove undefined errors
    Object.keys(errors).forEach(key => {
      if (errors[key as keyof ValidationErrors] === undefined) {
        delete errors[key as keyof ValidationErrors];
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  const handleBookAmbulance = async () => {
    if (!selectedAmbulance) {
      setAlert({
        visible: true,
        type: "error",
        title: "Selection Required",
        message: "Please select an ambulance type to continue."
      });
      return;
    }

    // Validate form
    const validation = validateForm();
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      
      // Show first error in alert
      const firstError = Object.values(validation.errors)[0];
      setAlert({
        visible: true,
        type: "warning",
        title: "Check Your Information",
        message: firstError || "Please fill in all required fields correctly."
      });
      return;
    }

    // Clear validation errors
    setValidationErrors({});

    try {
      setSubmitting(true);
      
      // Format the scheduled date for API if booking type is scheduled
      let formattedDate = null;
      if (bookingMode === "schedule" && scheduledDate) {
        // Convert DD/MM/YYYY to YYYY-MM-DD
        const [day, month, year] = scheduledDate.split('/');
        if (day && month && year) {
          formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }

      const bookingData = {
        ambulance_id: selectedAmbulance.id,
        patient_name: patientName,
        contact_number: contactNumber,
        pickup_address: pickupAddress,
        dropoff_address: dropoffAddress || pickupAddress,
        medical_condition: medicalCondition || undefined,
        booking_type: bookingMode === "now" ? "immediate" : "scheduled" as "immediate" | "scheduled",
        scheduled_date: formattedDate || undefined,
        scheduled_time: scheduledTime || undefined,
      };

      const booking = await ambulanceAPI.createAmbulanceBooking(bookingData);

      // Success alert
      setAlert({
        visible: true,
        type: "success",
        title: "Booking Confirmed!",
        message: `Your ambulance has been booked successfully.\n\n` +
          `Booking ID: #${booking.id}\n` +
          `Ambulance: ${selectedAmbulance.name}\n` +
          `Patient: ${patientName}\n` +
          `Price: ₹${booking.ambulance_price}\n\n` +
          `Our team will contact you shortly at ${contactNumber}`,
        onConfirm: () => {
          // Reset form
          setSelectedAmbulance(null);
          setPatientName("");
          setContactNumber("");
          setPickupAddress("");
          setDropoffAddress("");
          setMedicalCondition("");
          setScheduledDate("");
          setScheduledTime("");
          setShowBookingForm(false);
          setBookingMode("now");
          setValidationErrors({});
        }
      });
    } catch (error: any) {
      console.error('Failed to book ambulance:', error);
      
      const errorMessage = parseBackendErrors(error);
      
      setAlert({
        visible: true,
        type: "error",
        title: "Booking Failed",
        message: errorMessage
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = () => {
    const basicValid = patientName.trim().length >= 2 && 
                      contactNumber.trim().length >= 10 && 
                      pickupAddress.trim().length >= 5;
    if (bookingMode === "schedule") {
      return basicValid && scheduledDate && scheduledTime;
    }
    return basicValid;
  };

  if (loading) {
    return <LoadingScreen message="Dr. Meddy is locating ambulances for you" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
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
            <Text style={styles.serviceHeaderTitle}>Book Ambulance</Text>
          </View>

          {/* Emergency Banner */}
          <View style={{
            backgroundColor: "#ef4444",
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
            flexDirection: "row",
            alignItems: "center",
            gap: 12
          }}>
            <Text style={{ fontSize: 32 }}>🚨</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#ffffff", marginBottom: 4 }}>
                Emergency Helpline
              </Text>
              <Text style={{ fontSize: 13, color: "#fee2e2" }}>
                For life-threatening situations, call immediately
              </Text>
            </View>
          </View>

          {/* Emergency Contacts */}
          <View style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 24
          }}>
            {EMERGENCY_CONTACTS.map((contact) => (
              <Pressable
                key={contact.number}
                onPress={() => handleEmergencyCall(contact.number)}
                style={{
                  flex: 1,
                  minWidth: "47%",
                  backgroundColor: "#fef2f2",
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: "#fecaca",
                  alignItems: "center"
                }}
              >
                <Text style={{ fontSize: 20, marginBottom: 4 }}>📞</Text>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#0f172a", marginBottom: 2 }}>
                  {contact.name}
                </Text>
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#ef4444" }}>
                  {contact.number}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Booking Mode Selection */}
          {!selectedAmbulance && (
            <>
              <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Select Booking Type</Text>
              <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
                <Pressable
                  onPress={() => setBookingMode("now")}
                  style={{
                    flex: 1,
                    backgroundColor: bookingMode === "now" ? "#ef4444" : "#f8fafc",
                    borderRadius: 12,
                    padding: 16,
                    alignItems: "center",
                    borderWidth: 2,
                    borderColor: bookingMode === "now" ? "#ef4444" : "#e2e8f0"
                  }}
                >
                  <Text style={{ fontSize: 24, marginBottom: 8 }}>⚡</Text>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: bookingMode === "now" ? "#ffffff" : "#0f172a",
                    marginBottom: 4
                  }}>
                    Book Now
                  </Text>
                  <Text style={{
                    fontSize: 11,
                    color: bookingMode === "now" ? "#fee2e2" : "#64748b",
                    textAlign: "center"
                  }}>
                    Immediate pickup
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setBookingMode("schedule")}
                  style={{
                    flex: 1,
                    backgroundColor: bookingMode === "schedule" ? "#3b82f6" : "#f8fafc",
                    borderRadius: 12,
                    padding: 16,
                    alignItems: "center",
                    borderWidth: 2,
                    borderColor: bookingMode === "schedule" ? "#3b82f6" : "#e2e8f0"
                  }}
                >
                  <Text style={{ fontSize: 24, marginBottom: 8 }}>📅</Text>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: bookingMode === "schedule" ? "#ffffff" : "#0f172a",
                    marginBottom: 4
                  }}>
                    Schedule
                  </Text>
                  <Text style={{
                    fontSize: 11,
                    color: bookingMode === "schedule" ? "#dbeafe" : "#64748b",
                    textAlign: "center"
                  }}>
                    Plan for later
                  </Text>
                </Pressable>
              </View>

              {/* Ambulance Types */}
              <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Select Ambulance Type</Text>
              {ambulances.length === 0 ? (
                <View style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: 16,
                  padding: 32,
                  alignItems: "center",
                  borderWidth: 2,
                  borderColor: "#e2e8f0"
                }}>
                  <Text style={{ fontSize: 48, marginBottom: 8 }}>🚑</Text>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#64748b", textAlign: "center" }}>
                    No ambulances available at the moment
                  </Text>
                </View>
              ) : (
                ambulances.map((ambulance) => (
                <Pressable
                  key={ambulance.id}
                  onPress={() => handleAmbulanceSelect(ambulance)}
                  disabled={!ambulance.is_active}
                  style={{
                    backgroundColor: ambulance.is_active ? "#f8fafc" : "#f1f5f9",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 2,
                    borderColor: ambulance.is_active ? "#e2e8f0" : "#cbd5e1",
                    opacity: ambulance.is_active ? 1 : 0.6
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                    <Text style={{ fontSize: 40 }}>{ambulance.image}</Text>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <Text style={{ fontSize: 16, fontWeight: "700", color: "#0f172a" }}>
                          {ambulance.name}
                        </Text>
                        {!ambulance.is_active && (
                          <View style={{
                            backgroundColor: "#64748b",
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 6
                          }}>
                            <Text style={{ fontSize: 10, fontWeight: "600", color: "#ffffff" }}>
                              Unavailable
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
                        {ambulance.description}
                      </Text>
                      
                      <View style={{ marginBottom: 8 }}>
                        {ambulance.features.map((feature, idx) => (
                          <Text key={idx} style={{ fontSize: 11, color: "#475569", marginBottom: 2 }}>
                            • {feature}
                          </Text>
                        ))}
                      </View>

                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                        <View style={{
                          backgroundColor: "#eef2ff",
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 8
                        }}>
                          <Text style={{ fontSize: 14, fontWeight: "700", color: "#1e3a8a" }}>
                            ₹{ambulance.base_price}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 12, color: "#64748b" }}>
                          ⏱️ {ambulance.estimated_time}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              )))}
            </>
          )}

          {/* Booking Form */}
          {showBookingForm && selectedAmbulance && (
            <View>
              {/* Selected Ambulance */}
              <View style={{
                backgroundColor: "#eef2ff",
                borderRadius: 16,
                padding: 16,
                marginBottom: 20,
                borderWidth: 2,
                borderColor: "#3b82f6"
              }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                    <Text style={{ fontSize: 36 }}>{selectedAmbulance.image}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: "700", color: "#0f172a" }}>
                        {selectedAmbulance.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: "#64748b" }}>
                        {bookingMode === "now" ? "Immediate Pickup" : "Scheduled Booking"}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => {
                      setSelectedAmbulance(null);
                      setShowBookingForm(false);
                    }}
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

              <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Booking Details</Text>

              {/* Patient Name */}
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#0f172a", marginBottom: 6 }}>
                Patient Name*
              </Text>
              <TextInput
                value={patientName}
                onChangeText={(text) => {
                  setPatientName(text);
                  if (validationErrors.patientName) {
                    setValidationErrors({ ...validationErrors, patientName: undefined });
                  }
                }}
                placeholder="Enter patient name (min 2 characters)"
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  marginBottom: validationErrors.patientName ? 4 : 16,
                  borderWidth: 1,
                  borderColor: validationErrors.patientName ? "#ef4444" : "#e2e8f0",
                  fontSize: 14,
                  color: "#0f172a"
                }}
              />
              {validationErrors.patientName && (
                <Text style={{ fontSize: 12, color: "#ef4444", marginBottom: 12 }}>
                  {validationErrors.patientName}
                </Text>
              )}

              {/* Contact Number */}
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#0f172a", marginBottom: 6 }}>
                Contact Number*
              </Text>
              <TextInput
                value={contactNumber}
                onChangeText={(text) => {
                  setContactNumber(text);
                  if (validationErrors.contactNumber) {
                    setValidationErrors({ ...validationErrors, contactNumber: undefined });
                  }
                }}
                placeholder="Enter 10-digit contact number"
                keyboardType="phone-pad"
                maxLength={15}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  marginBottom: validationErrors.contactNumber ? 4 : 16,
                  borderWidth: 1,
                  borderColor: validationErrors.contactNumber ? "#ef4444" : "#e2e8f0",
                  fontSize: 14,
                  color: "#0f172a"
                }}
              />
              {validationErrors.contactNumber && (
                <Text style={{ fontSize: 12, color: "#ef4444", marginBottom: 12 }}>
                  {validationErrors.contactNumber}
                </Text>
              )}

              {/* Pickup Address */}
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#0f172a", marginBottom: 6 }}>
                Pickup Address*
              </Text>
              <TextInput
                value={pickupAddress}
                onChangeText={(text) => {
                  setPickupAddress(text);
                  if (validationErrors.pickupAddress) {
                    setValidationErrors({ ...validationErrors, pickupAddress: undefined });
                  }
                }}
                placeholder="Enter pickup location (min 5 characters)"
                multiline
                numberOfLines={2}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  marginBottom: validationErrors.pickupAddress ? 4 : 16,
                  borderWidth: 1,
                  borderColor: validationErrors.pickupAddress ? "#ef4444" : "#e2e8f0",
                  fontSize: 14,
                  color: "#0f172a",
                  textAlignVertical: "top",
                  minHeight: 60
                }}
              />
              {validationErrors.pickupAddress && (
                <Text style={{ fontSize: 12, color: "#ef4444", marginBottom: 12 }}>
                  {validationErrors.pickupAddress}
                </Text>
              )}

              {/* Dropoff Address */}
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#0f172a", marginBottom: 6 }}>
                Dropoff Address (Optional)
              </Text>
              <TextInput
                value={dropoffAddress}
                onChangeText={setDropoffAddress}
                placeholder="Enter destination hospital/clinic"
                multiline
                numberOfLines={2}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: "#e2e8f0",
                  fontSize: 14,
                  color: "#0f172a",
                  textAlignVertical: "top",
                  minHeight: 60
                }}
              />

              {/* Schedule Date & Time (only if scheduling) */}
              {bookingMode === "schedule" && (
                <>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#0f172a", marginBottom: 6 }}>
                    Scheduled Date*
                  </Text>
                  <TextInput
                    value={scheduledDate}
                    onChangeText={(text) => {
                      setScheduledDate(text);
                      if (validationErrors.scheduledDate) {
                        setValidationErrors({ ...validationErrors, scheduledDate: undefined });
                      }
                    }}
                    placeholder="DD/MM/YYYY (e.g., 15/03/2026)"
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      marginBottom: validationErrors.scheduledDate ? 4 : 16,
                      borderWidth: 1,
                      borderColor: validationErrors.scheduledDate ? "#ef4444" : "#e2e8f0",
                      fontSize: 14,
                      color: "#0f172a"
                    }}
                  />
                  {validationErrors.scheduledDate && (
                    <Text style={{ fontSize: 12, color: "#ef4444", marginBottom: 12 }}>
                      {validationErrors.scheduledDate}
                    </Text>
                  )}

                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#0f172a", marginBottom: 6 }}>
                    Scheduled Time*
                  </Text>
                  <TextInput
                    value={scheduledTime}
                    onChangeText={(text) => {
                      setScheduledTime(text);
                      if (validationErrors.scheduledTime) {
                        setValidationErrors({ ...validationErrors, scheduledTime: undefined });
                      }
                    }}
                    placeholder="HH:MM AM/PM (e.g., 10:30 AM)"
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      marginBottom: validationErrors.scheduledTime ? 4 : 16,
                      borderWidth: 1,
                      borderColor: validationErrors.scheduledTime ? "#ef4444" : "#e2e8f0",
                      fontSize: 14,
                      color: "#0f172a"
                    }}
                  />
                  {validationErrors.scheduledTime && (
                    <Text style={{ fontSize: 12, color: "#ef4444", marginBottom: 12 }}>
                      {validationErrors.scheduledTime}
                    </Text>
                  )}
                </>
              )}

              {/* Medical Condition */}
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#0f172a", marginBottom: 6 }}>
                Medical Condition (Optional)
              </Text>
              <TextInput
                value={medicalCondition}
                onChangeText={setMedicalCondition}
                placeholder="Describe the medical condition"
                multiline
                numberOfLines={3}
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
                backgroundColor: "#fef2f2",
                borderRadius: 12,
                padding: 14,
                marginBottom: 16
              }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#0f172a", marginBottom: 8 }}>
                  Booking Summary
                </Text>
                <Text style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                  Ambulance: {selectedAmbulance.name}
                </Text>
                <Text style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                  Type: {bookingMode === "now" ? "Immediate Pickup" : "Scheduled"}
                </Text>
                <Text style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                  Estimated Time: {selectedAmbulance.estimated_time}
                </Text>
                {Boolean(bookingMode === "schedule" && scheduledDate && scheduledTime) && (
                  <Text style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                    Scheduled: {scheduledDate} at {scheduledTime}
                  </Text>
                )}
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#ef4444", marginTop: 8 }}>
                  Base Cost: ₹{selectedAmbulance.base_price}
                </Text>
                <Text style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>
                  *Final cost may vary based on distance and additional services
                </Text>
              </View>

              {/* Confirm Button */}
              <Pressable
                onPress={handleBookAmbulance}
                disabled={!isFormValid() || submitting}
                style={{
                  backgroundColor: (isFormValid() && !submitting) ? "#ef4444" : "#cbd5e1",
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: "#ffffff"
                  }}>
                    {bookingMode === "now" ? "Book Ambulance Now" : "Schedule Ambulance"}
                  </Text>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Custom Alert */}
      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={() => {
          setAlert({ ...alert, visible: false });
          if (alert.onConfirm) {
            alert.onConfirm();
          }
        }}
      />
    </View>
  );
}
