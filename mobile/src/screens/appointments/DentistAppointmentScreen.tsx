import { useState, useEffect } from "react";
import { Pressable, ScrollView, Text, View, TextInput, ActivityIndicator, Image } from "react-native";
import { styles } from "../../styles";
import { dentistAPI, type Dentist } from "../../services/api";
import { parseBackendErrors, validators } from "../../utils/errorHandler";
import CustomAlert from "../../components/CustomAlert";
import LoadingScreen from "../../components/LoadingScreen";
import DatePickerModal from "../../components/DatePickerModal";
import { useLocation } from "../../hooks/useLocation";
import { haversineKm, formatDistance } from "../../utils/locationUtils";
import LocationBar from "../../components/LocationBar";

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Derive the weekday name (e.g. "Monday") from a DD/MM/YYYY date string
const weekdayFromDate = (dateStr: string): string => {
  const [dd, mm, yyyy] = dateStr.split("/");
  if (!dd || !mm || !yyyy) return "";
  return WEEKDAY_NAMES[new Date(Number(yyyy), Number(mm) - 1, Number(dd)).getDay()];
};

// Convert DD/MM/YYYY -> YYYY-MM-DD for the API
const toApiDate = (dateStr: string): string => {
  const [dd, mm, yyyy] = dateStr.split("/");
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
};

type DentistAppointmentScreenProps = {
  readonly onBack: () => void;
};

type AlertState = {
  visible: boolean;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  onConfirm?: () => void;
};

// Helper function to check if image is a URL/base64 or emoji
const isImageUrl = (imageString: string): boolean => {
  return imageString.startsWith('data:') || imageString.startsWith('http://') || imageString.startsWith('https://');
};

// Component to render image or emoji
const DentistImage = ({ image, size = 40 }: { image: string; size?: number }) => {
  if (isImageUrl(image)) {
    return (
      <Image
        source={{ uri: image }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#f1f5f9'
        }}
        resizeMode="cover"
      />
    );
  }
  return <Text style={{ fontSize: size }}>{image || '🦷'}</Text>;
};

export default function DentistAppointmentScreen({ onBack }: Readonly<DentistAppointmentScreenProps>) {
  const { location, locationName, locationLoading, requestLocation, setManualName } = useLocation();
  const [loading, setLoading] = useState<boolean>(true);
  const [booking, setBooking] = useState<boolean>(false);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [filteredDentists, setFilteredDentists] = useState<Dentist[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("All");
  const [selectedExperience, setSelectedExperience] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("rating");
  const [showSpecialtyDropdown, setShowSpecialtyDropdown] = useState<boolean>(false);
  const [showExperienceDropdown, setShowExperienceDropdown] = useState<boolean>(false);
  const [showSortDropdown, setShowSortDropdown] = useState<boolean>(false);
  const [selectedDentist, setSelectedDentist] = useState<Dentist | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [patientName, setPatientName] = useState<string>("");
  const [patientAge, setPatientAge] = useState<string>("");
  const [symptoms, setSymptoms] = useState<string>("");
  const [showBookingForm, setShowBookingForm] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [alert, setAlert] = useState<AlertState>({
    visible: false,
    type: "info",
    title: "",
    message: ""
  });

  useEffect(() => {
    fetchDentists();
  }, []);

  useEffect(() => {
    filterAndSortDentists();
  }, [dentists, searchQuery, selectedSpecialty, selectedExperience, sortBy, location]);

  const fetchDentists = async () => {
    try {
      setLoading(true);
      setError("");
      const [data] = await Promise.all([
        dentistAPI.getDentists(),
        new Promise(resolve => setTimeout(resolve, 1000))
      ]);
      setDentists(data);
      setFilteredDentists(data);
    } catch (err: any) {
      console.error("Error fetching dentists:", err);
      setError(err.response?.data?.detail || "Failed to load dentists");
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortDentists = () => {
    let filtered = [...dentists];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d => 
        d.name.toLowerCase().includes(query) ||
        d.specialty.toLowerCase().includes(query) ||
        d.qualification.toLowerCase().includes(query)
      );
    }

    // Specialty filter
    if (selectedSpecialty !== "All") {
      filtered = filtered.filter(d => d.specialty === selectedSpecialty);
    }

    // Experience filter
    if (selectedExperience !== "All") {
      if (selectedExperience === "0-5") {
        filtered = filtered.filter(d => d.experience >= 0 && d.experience <= 5);
      } else if (selectedExperience === "5-10") {
        filtered = filtered.filter(d => d.experience > 5 && d.experience <= 10);
      } else if (selectedExperience === "10-20") {
        filtered = filtered.filter(d => d.experience > 10 && d.experience <= 20);
      } else if (selectedExperience === "20+") {
        filtered = filtered.filter(d => d.experience > 20);
      }
    }

    // Sort
    if (sortBy === "nearest" && location) {
      filtered.sort((a, b) => {
        const dA = a.latitude != null && a.longitude != null
          ? haversineKm(location.latitude, location.longitude, a.latitude, a.longitude)
          : Infinity;
        const dB = b.latitude != null && b.longitude != null
          ? haversineKm(location.latitude, location.longitude, b.latitude, b.longitude)
          : Infinity;
        return dA - dB;
      });
    } else if (sortBy === "rating") {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "experience") {
      filtered.sort((a, b) => b.experience - a.experience);
    } else if (sortBy === "fee_low") {
      filtered.sort((a, b) => a.consultation_fee - b.consultation_fee);
    } else if (sortBy === "fee_high") {
      filtered.sort((a, b) => b.consultation_fee - a.consultation_fee);
    }

    setFilteredDentists(filtered);
  };

  const specialties = ["All", ...Array.from(new Set(dentists.map(d => d.specialty)))];
  const experienceRanges = ["All", "0-5", "5-10", "10-20", "20+"];

  const fetchBookedSlots = async (dentistId: number, day: string) => {
    try {
      setLoadingSlots(true);
      const slots = await dentistAPI.getBookedSlots(dentistId, day);
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

    if (selectedDentist) {
      await fetchBookedSlots(selectedDentist.id, day);
    }
  };

  const handleDateSelect = async (dateStr: string) => {
    setSelectedDate(dateStr);
    const day = weekdayFromDate(dateStr);
    await handleDaySelect(day);
  };

  if (loading) {
    return <LoadingScreen message="Dr. Meddy is looking for the best dentists for you" />;
  }

  if (error && dentists.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#ffffff", padding: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: "600", color: "#ef4444", marginBottom: 12 }}>
          Error Loading Dentists
        </Text>
        <Text style={{ fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 24 }}>
          {error}
        </Text>
        <Pressable
          onPress={fetchDentists}
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

  const handleDentistSelect = (dentist: Dentist) => {
    setSelectedDentist(dentist);
    setSelectedDay("");
    setSelectedDate("");
    setSelectedSlot("");
    setShowBookingForm(false);
    setBookedSlots([]);
  };

  const handleBookAppointment = async () => {
    if (!selectedDentist || !selectedDay || !selectedSlot) {
      setAlert({
        visible: true,
        type: "warning",
        title: "Missing Information",
        message: "Please select dentist, day, and time slot"
      });
      return;
    }

    // Validate patient name
    const nameError = validators.name(patientName);
    if (nameError) {
      setAlert({
        visible: true,
        type: "error",
        title: "Invalid Name",
        message: nameError
      });
      return;
    }

    // Validate patient age
    const ageError = validators.age(patientAge);
    if (ageError) {
      setAlert({
        visible: true,
        type: "error",
        title: "Invalid Age",
        message: ageError
      });
      return;
    }

    const age = parseInt(patientAge, 10);

    try {
      setBooking(true);
      await dentistAPI.bookAppointment({
        dentist_id: selectedDentist.id,
        patient_name: patientName.trim(),
        patient_age: age,
        symptoms: symptoms.trim() || undefined,
        appointment_day: selectedDay,
        appointment_slot: selectedSlot,
        appointment_date: selectedDate ? toApiDate(selectedDate) : undefined,
      });

      setAlert({
        visible: true,
        type: "success",
        title: "Appointment Booked! ✅",
        message: `Appointment booked with ${selectedDentist.name}\n\n` +
          `Patient: ${patientName}\n` +
          `Day: ${selectedDay}\n` +
          `Time: ${selectedSlot}\n\n` +
          `You will receive a confirmation shortly.`,
        onConfirm: () => {
          // Reset form
          setSelectedDentist(null);
          setSelectedDay("");
          setSelectedDate("");
          setSelectedSlot("");
          setPatientName("");
          setPatientAge("");
          setSymptoms("");
          setShowBookingForm(false);
        }
      });
    } catch (err: any) {
      console.error("Error booking appointment:", err);
      const errorMessage = parseBackendErrors(err);
      setAlert({
        visible: true,
        type: "error",
        title: "Booking Failed",
        message: errorMessage
      });
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
        <Text style={styles.serviceTitle}>Find Your Dentist</Text>
        <Text style={styles.serviceDescription}>
          Browse through our expert dentists and book an appointment that suits you best.
        </Text>

        {/* Location Bar */}
        <LocationBar
          locationName={locationName}
          loading={locationLoading}
          onRequestGPS={requestLocation}
          onSetManual={setManualName}
        />

        {/* Filters */}
        {!selectedDentist && (
          <View style={{ marginTop: 24 }}>
            {/* Search Bar */}
            <TextInput
              style={{
                backgroundColor: "#f1f5f9",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 14,
                color: "#0f172a",
                borderWidth: 1,
                borderColor: "#e2e8f0",
                marginBottom: 12
              }}
              placeholder="Search dentists by name, specialty..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {/* Filter Dropdowns */}
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
              {/* Specialty Dropdown */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: "#64748b", marginBottom: 6 }}>Specialty</Text>
                <Pressable
                  onPress={() => setShowSpecialtyDropdown(!showSpecialtyDropdown)}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <Text style={{ fontSize: 13, color: "#0f172a", fontWeight: "500" }}>{selectedSpecialty}</Text>
                  <Text style={{ fontSize: 10, color: "#64748b" }}>▼</Text>
                </Pressable>
                {showSpecialtyDropdown && (
                  <View style={{
                    position: "absolute",
                    top: 62,
                    left: 0,
                    right: 0,
                    backgroundColor: "#ffffff",
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                    maxHeight: 200,
                    zIndex: 1000,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3
                  }}>
                    <ScrollView>
                      {specialties.map((specialty) => (
                        <Pressable
                          key={specialty}
                          onPress={() => {
                            setSelectedSpecialty(specialty);
                            setShowSpecialtyDropdown(false);
                          }}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            borderBottomWidth: 1,
                            borderBottomColor: "#f1f5f9",
                            backgroundColor: selectedSpecialty === specialty ? "#f0f9ff" : "transparent"
                          }}
                        >
                          <Text style={{ fontSize: 13, color: "#0f172a" }}>{specialty}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Experience Dropdown */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: "#64748b", marginBottom: 6 }}>Experience</Text>
                <Pressable
                  onPress={() => setShowExperienceDropdown(!showExperienceDropdown)}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <Text style={{ fontSize: 13, color: "#0f172a", fontWeight: "500" }}>
                    {selectedExperience === "All" ? "All" : `${selectedExperience} yrs`}
                  </Text>
                  <Text style={{ fontSize: 10, color: "#64748b" }}>▼</Text>
                </Pressable>
                {showExperienceDropdown && (
                  <View style={{
                    position: "absolute",
                    top: 62,
                    left: 0,
                    right: 0,
                    backgroundColor: "#ffffff",
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                    maxHeight: 150,
                    zIndex: 1000,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3
                  }}>
                    <ScrollView>
                      {experienceRanges.map((range) => (
                        <Pressable
                          key={range}
                          onPress={() => {
                            setSelectedExperience(range);
                            setShowExperienceDropdown(false);
                          }}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            borderBottomWidth: 1,
                            borderBottomColor: "#f1f5f9",
                            backgroundColor: selectedExperience === range ? "#fef3c7" : "transparent"
                          }}
                        >
                          <Text style={{ fontSize: 13, color: "#0f172a" }}>
                            {range === "All" ? "All" : `${range} years`}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            {/* Sort Dropdown */}
            <View style={{ marginBottom: 12, zIndex: -1 }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: "#64748b", marginBottom: 6 }}>Sort By</Text>
              <Pressable
                onPress={() => setShowSortDropdown(!showSortDropdown)}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#e2e8f0",
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <Text style={{ fontSize: 13, color: "#0f172a", fontWeight: "500" }}>
                  {sortBy === "nearest" ? "📍 Nearest" :
                   sortBy === "rating" ? "Rating (High to Low)" :
                   sortBy === "experience" ? "Experience (High to Low)" :
                   sortBy === "fee_low" ? "Fee (Low to High)" : "Fee (High to Low)"}
                </Text>
                <Text style={{ fontSize: 10, color: "#64748b" }}>▼</Text>
              </Pressable>
              {showSortDropdown && (
                <View style={{
                  position: "absolute",
                  top: 56,
                  left: 0,
                  right: 0,
                  backgroundColor: "#ffffff",
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#e2e8f0",
                  zIndex: 1000,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3
                }}>
                  {[
                    {id: "nearest", label: "📍 Nearest"},
                    {id: "rating", label: "Rating (High to Low)"},
                    {id: "experience", label: "Experience (High to Low)"},
                    {id: "fee_low", label: "Fee (Low to High)"},
                    {id: "fee_high", label: "Fee (High to Low)"}
                  ].map((option) => (
                    <Pressable
                      key={option.id}
                      onPress={() => {
                        setSortBy(option.id);
                        setShowSortDropdown(false);
                      }}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: "#f1f5f9",
                        backgroundColor: sortBy === option.id ? "#dcfce7" : "transparent"
                      }}
                    >
                      <Text style={{ fontSize: 13, color: "#0f172a" }}>{option.label}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Results Count */}
            <Text style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
              {filteredDentists.length} dentist{filteredDentists.length !== 1 ? 's' : ''} found
            </Text>
          </View>
        )}

        {/* Dentists List */}
        {!selectedDentist && (
          <View>
            {filteredDentists.map((dentist) => (
              <Pressable
                key={dentist.id}
                onPress={() => handleDentistSelect(dentist)}
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
                  <DentistImage image={dentist.image} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: "#0f172a" }}>
                      {dentist.name}
                    </Text>
                    <Text style={{ fontSize: 14, color: "#FF6B35", marginTop: 2 }}>
                      {dentist.specialty}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                      {dentist.qualification}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 12 }}>
                      <Text style={{ fontSize: 12, color: "#0f172a" }}>
                        ⭐ {dentist.rating}
                      </Text>
                      <Text style={{ fontSize: 12, color: "#64748b" }}>
                        {dentist.experience} years exp.
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
                      📍 {dentist.address}
                      {location && dentist.latitude != null && dentist.longitude != null
                        ? ` · ${formatDistance(haversineKm(location.latitude, location.longitude, dentist.latitude, dentist.longitude))} away`
                        : ""}
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
                        ₹{dentist.consultation_fee}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Selected Dentist & Booking */}
        {selectedDentist && (
          <View style={{ marginTop: 24 }}>
            {/* Selected Dentist Card */}
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
                  <DentistImage image={selectedDentist.image} size={36} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: "#0f172a" }}>
                      {selectedDentist.name}
                    </Text>
                    <Text style={{ fontSize: 14, color: "#FF6B35" }}>
                      {selectedDentist.specialty}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => setSelectedDentist(null)}
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

            {/* Select Date */}
            <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Select Date</Text>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#f1f5f9",
                borderWidth: 1,
                borderColor: selectedDate ? "#1e3a8a" : "#e2e8f0",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                marginBottom: selectedDay ? 8 : 20
              }}
            >
              <Text style={{ fontSize: 14, color: selectedDate ? "#0f172a" : "#94a3b8", fontWeight: "600" }}>
                {selectedDate || "Select appointment date"}
              </Text>
              <Text style={{ fontSize: 16 }}>📅</Text>
            </Pressable>
            {Boolean(selectedDay) && (
              <Text style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>
                {selectedDay} appointment
              </Text>
            )}

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
                    {selectedDentist.available_slots.map((slot) => {
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
                    Dentist: {selectedDentist.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                    Day: {selectedDay}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                    Time: {selectedSlot}
                  </Text>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#1e3a8a", marginTop: 8 }}>
                    Consultation Fee: ₹{selectedDentist.consultation_fee}
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

      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={() => {
          if (alert.onConfirm) {
            alert.onConfirm();
          }
          setAlert({ ...alert, visible: false });
        }}
        primaryButtonText="OK"
      />

      <DatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelect={handleDateSelect}
        selectedDate={selectedDate}
        allowedWeekdays={selectedDentist?.available_days}
      />
    </ScrollView>
  );
}
