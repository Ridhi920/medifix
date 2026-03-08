import { useState, useEffect } from "react";
import { Pressable, ScrollView, Text, View, TextInput, ActivityIndicator, Alert } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from "../../styles";
import { LAB_CENTERS } from "../../data/labTests";
import * as labTestApi from "../../api/labTestApi";
import type { LabTest } from "../../api/labTestApi";

type LabTestBookingScreenProps = {
  readonly onBack: () => void;
};

export default function LabTestBookingScreen({ onBack }: Readonly<LabTestBookingScreenProps>) {
  const [loading, setLoading] = useState<boolean>(true);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [selectedCenter, setSelectedCenter] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [patientName, setPatientName] = useState<string>("");
  const [patientAge, setPatientAge] = useState<string>("");
  const [patientPhone, setPatientPhone] = useState<string>("");
  const [homeCollection, setHomeCollection] = useState<boolean>(false);
  const [address, setAddress] = useState<string>("");
  const [showBookingForm, setShowBookingForm] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchLabTests();
  }, []);

  const fetchLabTests = async () => {
    try {
      setLoading(true);
      const tests = await labTestApi.getLabTests();
      setLabTests(tests);
    } catch (error) {
      console.error("Failed to load lab tests:", error);
      Alert.alert("Error", "Failed to load lab tests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState<string>("");

  // Filter lab tests based on search query
  const filteredTests = labTests.filter((test) => {
    const query = searchQuery.toLowerCase();
    return (
      test.name.toLowerCase().includes(query) ||
      test.category.toLowerCase().includes(query) ||
      test.description.toLowerCase().includes(query)
    );
  });

  // Available dates (next 7 days)
  const availableDates = ["Tomorrow", "Day After", "3 Days", "4 Days", "5 Days", "6 Days", "7 Days"];
  
  // Available time slots
  const timeSlots = ["06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM"];

  const handleTestSelect = (test: LabTest) => {
    setSelectedTest(test);
    setSelectedCenter("");
    setSelectedDate("");
    setSelectedTime("");
    setShowBookingForm(false);
  };

  const handleBookTest = async () => {
    if (!selectedTest || !patientName || !patientAge || !patientPhone) {
      return;
    }

    try {
      setSubmitting(true);

      // Get auth token
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        Alert.alert("Authentication Required", "Please log in to book a lab test.");
        return;
      }

      // Get center name if not home collection
      let centerName: string | undefined;
      if (!homeCollection && selectedCenter) {
        const center = LAB_CENTERS.find(c => c.id === selectedCenter);
        centerName = center?.name;
      }

      // Create booking
      const bookingData: labTestApi.LabBookingCreate = {
        lab_test_id: selectedTest.id,
        patient_name: patientName,
        patient_age: parseInt(patientAge),
        patient_phone: patientPhone,
        collection_date: selectedDate,
        collection_time: selectedTime,
        home_collection: homeCollection,
        address: homeCollection ? address : undefined,
        center_name: !homeCollection ? centerName : undefined,
      };

      await labTestApi.createLabBooking(bookingData, token);

      Alert.alert(
        "Success!",
        `Lab test booked successfully!\n\nTest: ${selectedTest.name}\n${
          homeCollection
            ? `Home Collection at ${address}`
            : `Lab Visit at ${centerName}`
        }\nDate: ${selectedDate}\nTime: ${selectedTime}`,
        [
          {
            text: "OK",
            onPress: () => {
              // Reset form
              setSelectedTest(null);
              setSelectedCenter("");
              setSelectedDate("");
              setSelectedTime("");
              setPatientName("");
              setPatientAge("");
              setPatientPhone("");
              setHomeCollection(false);
              setAddress("");
              setShowBookingForm(false);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error("Failed to book lab test:", error);
      Alert.alert(
        "Booking Failed",
        error.message || "Failed to book lab test. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = () => {
    return (
      selectedTest &&
      selectedDate &&
      selectedTime &&
      patientName &&
      patientAge &&
      patientPhone &&
      (homeCollection ? Boolean(address) : Boolean(selectedCenter))
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={{ marginTop: 16, fontSize: 16, color: "#64748b", fontWeight: "600" }}>
          Loading Lab Tests...
        </Text>
      </View>
    );
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
            <Text style={styles.serviceHeaderTitle}>Book Lab Test</Text>
          </View>

          {/* Description */}
          <Text style={styles.serviceTitle}>Lab Tests & Health Packages</Text>
          <Text style={styles.serviceDescription}>
            Choose from a wide range of diagnostic tests and comprehensive health checkup packages.
          </Text>

          {/* Search Bar */}
          {!selectedTest && (
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
                placeholder="Search tests or packages"
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

          {/* Lab Tests List */}
          {!selectedTest && (
            <View style={{ marginTop: 24 }}>
              <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>
                Available Tests {searchQuery ? `(${filteredTests.length})` : ""}
              </Text>
              {filteredTests.length === 0 ? (
                <View style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: 16,
                  padding: 24,
                  alignItems: "center"
                }}>
                  <Text style={{ fontSize: 16, color: "#64748b", textAlign: "center" }}>
                    No tests found matching "{searchQuery}"
                  </Text>
                </View>
              ) : (
                filteredTests.map((test) => (
                  <Pressable
                    key={test.id}
                    onPress={() => handleTestSelect(test)}
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: 20,
                      padding: 20,
                      marginBottom: 16,
                      borderWidth: 1,
                      borderColor: "#e2e8f0",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 8,
                      elevation: 2
                    }}
                  >
                    {/* Header: Title and Price */}
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <Text style={{ fontSize: 20, fontWeight: "700", color: "#0f172a", marginBottom: 6 }}>
                          {test.name}
                        </Text>
                        {test.popular && (
                          <View style={{
                            backgroundColor: "#FF6B35",
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 6,
                            alignSelf: "flex-start"
                          }}>
                            <Text style={{ fontSize: 10, color: "#ffffff", fontWeight: "700", letterSpacing: 0.5 }}>
                              POPULAR
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={{ fontSize: 24, fontWeight: "700", color: "#FF6B35", marginBottom: 2 }}>
                          ₹{test.price}
                        </Text>
                        <Text style={{ fontSize: 13, color: "#94a3b8", fontWeight: "500" }}>
                          {test.category}
                        </Text>
                      </View>
                    </View>

                    {/* Description */}
                    <Text style={{ fontSize: 14, color: "#64748b", lineHeight: 20, marginBottom: 12 }}>
                      {test.description}
                    </Text>

                    {/* Test Details */}
                    <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={{ fontSize: 16 }}>📋</Text>
                        <Text style={{ fontSize: 13, color: "#0f172a", fontWeight: "500" }}>
                          {test.parameters.length} parameters
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={{ fontSize: 16 }}>⏱️</Text>
                        <Text style={{ fontSize: 13, color: "#0f172a", fontWeight: "500" }}>
                          {test.report_time}
                        </Text>
                      </View>
                      {test.fasting_required && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Text style={{ fontSize: 16 }}>🍽️</Text>
                          <Text style={{ fontSize: 13, color: "#dc2626", fontWeight: "600" }}>
                            Fasting required
                          </Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          )}

          {/* Booking Flow */}
          {selectedTest && (
            <View style={{ marginTop: 24 }}>
              {/* Selected Test Info */}
              <View style={{
                backgroundColor: "#eff6ff",
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: "#bfdbfe"
              }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: "#0f172a" }}>
                      {selectedTest.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                      {selectedTest.description}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setSelectedTest(null)}
                    style={{
                      backgroundColor: "#ffffff",
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      marginLeft: 12
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "600", color: "#FF6B35" }}>
                      Change
                    </Text>
                  </Pressable>
                </View>
                <View style={{ marginTop: 12 }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#0f172a", marginBottom: 6 }}>
                    Test Parameters:
                  </Text>
                  {selectedTest.parameters.map((param) => (
                    <Text key={param} style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}>
                      • {param}
                    </Text>
                  ))}
                </View>
                <View style={{ 
                  flexDirection: "row", 
                  justifyContent: "space-between", 
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: "#bfdbfe"
                }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: "#FF6B35" }}>
                    ₹{selectedTest.price}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#64748b" }}>
                    Report in {selectedTest.report_time}
                  </Text>
                </View>
                {selectedTest.fasting_required && (
                  <View style={{
                    backgroundColor: "#fef2f2",
                    borderRadius: 8,
                    padding: 8,
                    marginTop: 12
                  }}>
                    <Text style={{ fontSize: 11, color: "#dc2626", fontWeight: "600" }}>
                      ⚠️ Fasting Required: Do not eat or drink (except water) for 8-12 hours before the test
                    </Text>
                  </View>
                )}
              </View>

              {/* Home Collection Toggle */}
              <View style={{ marginTop: 24 }}>
                <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Collection Type</Text>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <Pressable
                    onPress={() => setHomeCollection(false)}
                    style={{
                      flex: 1,
                      backgroundColor: homeCollection ? "#f1f5f9" : "#FF6B35",
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: homeCollection ? "#e2e8f0" : "#FF6B35"
                    }}
                  >
                    <Text style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: homeCollection ? "#64748b" : "#ffffff",
                      textAlign: "center"
                    }}>
                      🏥 Lab Visit
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setHomeCollection(true)}
                    style={{
                      flex: 1,
                      backgroundColor: homeCollection ? "#FF6B35" : "#f1f5f9",
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: homeCollection ? "#FF6B35" : "#e2e8f0"
                    }}
                  >
                    <Text style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: homeCollection ? "#ffffff" : "#64748b",
                      textAlign: "center"
                    }}>
                      🏠 Home Collection
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Lab Center Selection (if not home collection) */}
              {!homeCollection && (
                <View style={{ marginTop: 24 }}>
                  <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Select Lab Center</Text>
                  {LAB_CENTERS.map((center) => (
                    <Pressable
                      key={center.id}
                      onPress={() => setSelectedCenter(center.id)}
                      style={{
                        backgroundColor: selectedCenter === center.id ? "#eff6ff" : "#f8fafc",
                        borderRadius: 12,
                        padding: 14,
                        marginBottom: 10,
                        borderWidth: 2,
                        borderColor: selectedCenter === center.id ? "#FF6B35" : "#e2e8f0"
                      }}
                    >
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: "600", color: "#0f172a" }}>
                            {center.name}
                          </Text>
                          <Text style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                            📍 {center.address}
                          </Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text style={{ fontSize: 12, color: "#0f172a" }}>
                            ⭐ {center.rating}
                          </Text>
                          <Text style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                            {center.distance}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Select Date */}
              <View style={{ marginTop: 24 }}>
                <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Select Date</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    {availableDates.map((date) => (
                      <Pressable
                        key={date}
                        onPress={() => setSelectedDate(date)}
                        style={{
                          backgroundColor: selectedDate === date ? "#FF6B35" : "#f1f5f9",
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: selectedDate === date ? "#FF6B35" : "#e2e8f0",
                          minWidth: 100
                        }}
                      >
                        <Text style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: selectedDate === date ? "#ffffff" : "#64748b",
                          textAlign: "center"
                        }}>
                          {date}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Select Time Slot */}
              {Boolean(selectedDate) && (
                <View style={{ marginTop: 24 }}>
                  <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Select Time Slot</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                    {timeSlots.map((slot) => (
                      <Pressable
                        key={slot}
                        onPress={() => {
                          setSelectedTime(slot);
                          setShowBookingForm(true);
                        }}
                        style={{
                          backgroundColor: selectedTime === slot ? "#FF6B35" : "#f1f5f9",
                          paddingVertical: 10,
                          paddingHorizontal: 16,
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: selectedTime === slot ? "#FF6B35" : "#e2e8f0"
                        }}
                      >
                        <Text style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: selectedTime === slot ? "#ffffff" : "#64748b"
                        }}>
                          {slot}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* Patient Details Form */}
              {showBookingForm && (
                <View style={{ marginTop: 24 }}>
                  <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Patient Details</Text>

                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#0f172a", marginBottom: 6 }}>Patient Name</Text>
                  <TextInput
                    value={patientName}
                    onChangeText={setPatientName}
                    placeholder="Enter patient name"
                    placeholderTextColor="#94a3b8"
                    style={styles.input}
                  />

                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#0f172a", marginBottom: 6 }}>Age</Text>
                  <TextInput
                    value={patientAge}
                    onChangeText={setPatientAge}
                    placeholder="Enter age"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    style={styles.input}
                  />

                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#0f172a", marginBottom: 6 }}>Phone Number</Text>
                  <TextInput
                    value={patientPhone}
                    onChangeText={setPatientPhone}
                    placeholder="Enter phone number"
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                    style={styles.input}
                  />

                  {homeCollection && (
                    <>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: "#0f172a", marginBottom: 6 }}>Collection Address</Text>
                      <TextInput
                        value={address}
                        onChangeText={setAddress}
                        placeholder="Enter complete address for sample collection"
                        placeholderTextColor="#94a3b8"
                        multiline
                        numberOfLines={3}
                        style={[styles.input, { height: 80, textAlignVertical: "top", paddingTop: 12 }]}
                      />
                    </>
                  )}

                  {/* Book Button */}
                  <Pressable
                    onPress={handleBookTest}
                    disabled={!isFormValid() || submitting}
                    style={{
                      backgroundColor: (isFormValid() && !submitting) ? "#FF6B35" : "#e2e8f0",
                      paddingVertical: 16,
                      borderRadius: 12,
                      marginTop: 24,
                      shadowColor: (isFormValid() && !submitting) ? "#FF6B35" : "transparent",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 4
                    }}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={{
                        fontSize: 16,
                        fontWeight: "700",
                        color: (isFormValid() && !submitting) ? "#ffffff" : "#94a3b8",
                        textAlign: "center"
                      }}>
                        Book Lab Test - ₹{selectedTest.price}
                      </Text>
                    )}
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
