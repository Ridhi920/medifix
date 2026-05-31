import { useState, useEffect } from "react";
import { Pressable, ScrollView, Text, View, TextInput, ActivityIndicator, Image } from "react-native";
import { styles } from "../../styles";
import { nurseAPI, type Nurse } from "../../api/nurseApi";
import { parseBackendErrors, validators } from "../../utils/errorHandler";
import CustomAlert from "../../components/CustomAlert";
import LoadingScreen from "../../components/LoadingScreen";
import DatePickerModal from "../../components/DatePickerModal";
import TimePickerDropdown from "../../components/TimePickerDropdown";
import { useLocation } from "../../hooks/useLocation";
import { haversineKm, formatDistance } from "../../utils/locationUtils";

type NurseBookingScreenProps = {
  readonly onBack: () => void;
};

type BookingType = "hourly" | "daily" | "weekly";

type ValidationErrors = {
  patientName?: string;
  patientAge?: string;
  contactNumber?: string;
  address?: string;
  startDate?: string;
  startTime?: string;
  duration?: string;
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
const NurseImage = ({ image, size = 40 }: { image: string; size?: number }) => {
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
  return <Text style={{ fontSize: size }}>{image || '👨‍⚕️'}</Text>;
};

export default function NurseBookingScreen({ onBack }: Readonly<NurseBookingScreenProps>) {
  const { location } = useLocation();
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [filteredNurses, setFilteredNurses] = useState<Nurse[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>("All");
  const [selectedExperience, setSelectedExperience] = useState<string>("All");
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>("rating");
  const [showSpecializationDropdown, setShowSpecializationDropdown] = useState<boolean>(false);
  const [showExperienceDropdown, setShowExperienceDropdown] = useState<boolean>(false);
  const [showRatingDropdown, setShowRatingDropdown] = useState<boolean>(false);
  const [showSortDropdown, setShowSortDropdown] = useState<boolean>(false);
  const [selectedNurse, setSelectedNurse] = useState<Nurse | null>(null);
  const [showBookingForm, setShowBookingForm] = useState<boolean>(false);
  
  // Form fields
  const [patientName, setPatientName] = useState<string>("");
  const [patientAge, setPatientAge] = useState<string>("");
  const [patientGender, setPatientGender] = useState<string>("Male");
  const [contactNumber, setContactNumber] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [medicalCondition, setMedicalCondition] = useState<string>("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [bookingType, setBookingType] = useState<BookingType>("daily");
  const [duration, setDuration] = useState<string>("1");
  const [shiftPreference, setShiftPreference] = useState<string>("Day (8 AM - 8 PM)");
  const [startDate, setStartDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [specialInstructions, setSpecialInstructions] = useState<string>("");
  
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [alert, setAlert] = useState<AlertState>({
    visible: false,
    type: "info",
    title: "",
    message: ""
  });

  useEffect(() => {
    fetchNurses();
  }, []);

  useEffect(() => {
    filterNurses();
  }, [selectedSpecialization, selectedExperience, selectedRating, sortBy, searchQuery, nurses, location]);

  const fetchNurses = async () => {
    try {
      setLoading(true);
      const data = await nurseAPI.getNurses();
      setNurses(data);
      setFilteredNurses(data);
    } catch (error: any) {
      console.error('Failed to fetch nurses:', error);
      setAlert({
        visible: true,
        type: "error",
        title: "Error",
        message: "Failed to load nurses. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const filterNurses = () => {
    let filtered = [...nurses];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n => 
        n.name.toLowerCase().includes(query) ||
        n.specialization.toLowerCase().includes(query) ||
        n.qualification.toLowerCase().includes(query) ||
        n.services.some(s => s.toLowerCase().includes(query))
      );
    }

    // Specialization filter
    if (selectedSpecialization !== "All") {
      filtered = filtered.filter(n => n.specialization === selectedSpecialization);
    }

    // Experience filter
    if (selectedExperience !== "All") {
      if (selectedExperience === "0-2") {
        filtered = filtered.filter(n => n.experience >= 0 && n.experience <= 2);
      } else if (selectedExperience === "2-5") {
        filtered = filtered.filter(n => n.experience > 2 && n.experience <= 5);
      } else if (selectedExperience === "5-10") {
        filtered = filtered.filter(n => n.experience > 5 && n.experience <= 10);
      } else if (selectedExperience === "10+") {
        filtered = filtered.filter(n => n.experience > 10);
      }
    }

    // Rating filter
    if (selectedRating > 0) {
      filtered = filtered.filter(n => n.rating >= selectedRating);
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
    } else if (sortBy === "hourly_rate") {
      filtered.sort((a, b) => a.hourly_rate - b.hourly_rate);
    } else if (sortBy === "daily_rate") {
      filtered.sort((a, b) => a.daily_rate - b.daily_rate);
    }

    setFilteredNurses(filtered);
  };

  const experienceRanges = ["All", "0-2", "2-5", "5-10", "10+"];

  const handleNurseSelect = (nurse: Nurse) => {
    if (!nurse.is_active) return;
    setSelectedNurse(nurse);
    setSelectedServices([]);
    setShowBookingForm(true);
  };

  const toggleService = (service: string) => {
    setSelectedServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const calculateTotalPrice = (): number => {
    if (!selectedNurse) return 0;
    const durationNum = parseInt(duration) || 1;
    
    switch (bookingType) {
      case "hourly":
        return selectedNurse.hourly_rate * durationNum;
      case "daily":
        return selectedNurse.daily_rate * durationNum;
      case "weekly":
        return (selectedNurse.daily_rate * 7) * durationNum;
      default:
        return 0;
    }
  };

  const validateForm = (): { isValid: boolean; errors: ValidationErrors } => {
    const errors: ValidationErrors = {};

    errors.patientName = validators.name(patientName);
    const ageNum = parseInt(patientAge);
    if (!patientAge || ageNum < 1 || ageNum > 150) {
      errors.patientAge = "Please enter a valid age (1-150)";
    }
    errors.contactNumber = validators.phone(contactNumber);
    errors.address = validators.address(address);
    errors.startDate = validators.date(startDate);
    
    if (!duration || parseInt(duration) < 1) {
      errors.duration = "Duration must be at least 1";
    }

    if (selectedServices.length === 0) {
      setAlert({
        visible: true,
        type: "warning",
        title: "Required Services",
        message: "Please select at least one service you need."
      });
      return { isValid: false, errors };
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

  const handleBookNurse = async () => {
    if (!selectedNurse) {
      setAlert({
        visible: true,
        type: "error",
        title: "Selection Required",
        message: "Please select a nurse to continue."
      });
      return;
    }

    const validation = validateForm();
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      const firstError = Object.values(validation.errors)[0];
      if (firstError) {
        setAlert({
          visible: true,
          type: "warning",
          title: "Check Your Information",
          message: firstError
        });
      }
      return;
    }

    setValidationErrors({});

    try {
      setSubmitting(true);
      
      // Format date
      let formattedDate = startDate;
      if (startDate.includes('/')) {
        const [day, month, year] = startDate.split('/');
        if (day && month && year) {
          formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }

      const bookingData = {
        nurse_id: selectedNurse.id,
        patient_name: patientName,
        patient_age: parseInt(patientAge),
        patient_gender: patientGender,
        contact_number: contactNumber,
        address: address,
        medical_condition: medicalCondition || undefined,
        required_services: selectedServices,
        booking_type: bookingType,
        duration: parseInt(duration),
        shift_preference: shiftPreference,
        start_date: formattedDate,
        start_time: bookingType === "hourly" ? startTime : undefined,
        special_instructions: specialInstructions || undefined,
      };

      const booking = await nurseAPI.createNurseBooking(bookingData);

      setAlert({
        visible: true,
        type: "success",
        title: "Booking Confirmed!",
        message: `Your nurse booking has been confirmed.\n\n` +
          `Booking ID: #${booking.id}\n` +
          `Nurse: ${selectedNurse.name}\n` +
          `Patient: ${patientName}\n` +
          `Duration: ${duration} ${bookingType === "hourly" ? "hours" : bookingType === "daily" ? "days" : "weeks"}\n` +
          `Total Price: ₹${booking.total_price}\n\n` +
          `Our team will contact you shortly at ${contactNumber}`,
        onConfirm: () => {
          resetForm();
        }
      });
    } catch (error: any) {
      console.error('Failed to book nurse:', error);
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

  const resetForm = () => {
    setSelectedNurse(null);
    setPatientName("");
    setPatientAge("");
    setPatientGender("Male");
    setContactNumber("");
    setAddress("");
    setMedicalCondition("");
    setSelectedServices([]);
    setBookingType("daily");
    setDuration("1");
    setShiftPreference("Day (8 AM - 8 PM)");
    setStartDate("");
    setStartTime("09:00 AM");
    setSpecialInstructions("");
    setShowBookingForm(false);
    setValidationErrors({});
  };

  if (loading) {
    return <LoadingScreen message="Loading nurses" />;
  }

  if (showBookingForm && selectedNurse) {
    return (
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 32, paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <Pressable onPress={() => setShowBookingForm(false)} style={styles.backButton}>
            <Text style={{ fontSize: 16, color: '#1e3a8a', fontWeight: '600' }}>← Back</Text>
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#0f172a', marginLeft: 12 }}>Book Nurse</Text>
        </View>

        {/* Nurse Info */}
        <View style={[styles.card, { marginBottom: 16 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <NurseImage image={selectedNurse.image} size={40} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#1a1a1a' }}>{selectedNurse.name}</Text>
              <Text style={{ fontSize: 14, color: '#666', marginTop: 2 }}>
                {selectedNurse.qualification} • {selectedNurse.specialization}
              </Text>
              <Text style={{ fontSize: 14, color: '#666' }}>
                {selectedNurse.experience} years exp • ⭐ {selectedNurse.rating.toFixed(1)}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' }}>
            <View>
              <Text style={{ fontSize: 12, color: '#666' }}>Hourly</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#4CAF50' }}>₹{selectedNurse.hourly_rate}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 12, color: '#666' }}>Daily (12h)</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#4CAF50' }}>₹{selectedNurse.daily_rate}</Text>
            </View>
          </View>
        </View>

        {/* Patient Information */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 6 }}>Patient Name *</Text>
          <TextInput
            style={[styles.input, validationErrors.patientName && { borderColor: '#ef4444', borderWidth: 1.5 }]}
            value={patientName}
            onChangeText={setPatientName}
            placeholder="Enter patient name"
          />
          {validationErrors.patientName && <Text style={{ fontSize: 12, color: '#ef4444', marginBottom: 8, marginTop: -8 }}>{validationErrors.patientName}</Text>}

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 6 }}>Age *</Text>
              <TextInput
                style={[styles.input, validationErrors.patientAge && { borderColor: '#ef4444', borderWidth: 1.5 }]}
                value={patientAge}
                onChangeText={setPatientAge}
                placeholder="Age"
                keyboardType="numeric"
              />
              {validationErrors.patientAge && <Text style={{ fontSize: 12, color: '#ef4444', marginBottom: 8, marginTop: -8 }}>{validationErrors.patientAge}</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 6 }}>Gender *</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {["Male", "Female"].map(gender => (
                  <Pressable
                    key={gender}
                    onPress={() => setPatientGender(gender)}
                    style={[
                      { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
                      patientGender === gender && { backgroundColor: '#FF6B35', borderColor: '#FF6B35' }
                    ]}
                  >
                    <Text style={[
                      { fontSize: 13, fontWeight: '600', color: '#64748b' },
                      patientGender === gender && { color: '#ffffff' }
                    ]}>{gender}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 6 }}>Contact Number *</Text>
          <TextInput
            style={[styles.input, validationErrors.contactNumber && { borderColor: '#ef4444', borderWidth: 1.5 }]}
            value={contactNumber}
            onChangeText={setContactNumber}
            placeholder="Enter contact number"
            keyboardType="phone-pad"
          />

          <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 6 }}>Address *</Text>
          <TextInput
            style={[styles.input, validationErrors.address && { borderColor: '#ef4444', borderWidth: 1.5 }]}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter complete address"
            multiline
            numberOfLines={2}
          />

          <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 6 }}>Medical Condition (Optional)</Text>
          <TextInput
            style={styles.input}
            value={medicalCondition}
            onChangeText={setMedicalCondition}
            placeholder="Describe medical condition"
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Services Required */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Required Services *</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {selectedNurse.services.map(service => (
              <Pressable
                key={service}
                onPress={() => toggleService(service)}
                style={[
                  { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
                  selectedServices.includes(service) && { backgroundColor: '#FF6B35', borderColor: '#FF6B35' }
                ]}
              >
                <Text style={[
                  { fontSize: 13, fontWeight: '600', color: '#64748b' },
                  selectedServices.includes(service) && { color: '#ffffff' }
                ]}>{service}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Booking Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Booking Details</Text>
          
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 6 }}>Booking Type *</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {[
              { value: "hourly", label: "Hourly" },
              { value: "daily", label: "Daily" },
              { value: "weekly", label: "Weekly" }
            ].map(type => (
              <Pressable
                key={type.value}
                onPress={() => setBookingType(type.value as BookingType)}
                style={[
                  { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
                  bookingType === type.value && { backgroundColor: '#FF6B35', borderColor: '#FF6B35' }
                ]}
              >
                <Text style={[
                  { fontSize: 13, fontWeight: '600', color: '#64748b' },
                  bookingType === type.value && { color: '#ffffff' }
                ]}>{type.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 6 }}>
            Duration ({bookingType === "hourly" ? "hours" : bookingType === "daily" ? "days" : "weeks"}) *
          </Text>
          <TextInput
            style={[styles.input, validationErrors.duration && { borderColor: '#ef4444', borderWidth: 1.5 }]}
            value={duration}
            onChangeText={setDuration}
            placeholder="Enter duration"
            keyboardType="numeric"
          />

          <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 6 }}>Shift Preference *</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {selectedNurse.available_shifts.map(shift => (
              <Pressable
                key={shift}
                onPress={() => setShiftPreference(shift)}
                style={[
                  { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
                  shiftPreference === shift && { backgroundColor: '#FF6B35', borderColor: '#FF6B35' }
                ]}
              >
                <Text style={[
                  { fontSize: 13, fontWeight: '600', color: '#64748b' },
                  shiftPreference === shift && { color: '#ffffff' }
                ]}>{shift}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 6 }}>Start Date *</Text>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={[{
              backgroundColor: '#ffffff',
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              marginBottom: validationErrors.startDate ? 4 : 16,
              borderWidth: 1,
              borderColor: validationErrors.startDate ? '#ef4444' : '#e2e8f0',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }]}
          >
            <Text style={{ fontSize: 14, color: startDate ? '#0f172a' : '#94a3b8' }}>
              {startDate || "Select date"}
            </Text>
            <Text style={{ fontSize: 16 }}>📅</Text>
          </Pressable>
          {validationErrors.startDate && (
            <Text style={{ fontSize: 12, color: '#ef4444', marginBottom: 12 }}>
              {validationErrors.startDate}
            </Text>
          )}

          {bookingType === "hourly" && (
            <>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 6 }}>Start Time *</Text>
              <TimePickerDropdown
                value={startTime}
                onChange={setStartTime}
                hasError={Boolean(validationErrors.startTime)}
              />
            </>
          )}

          <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 6 }}>Special Instructions (Optional)</Text>
          <TextInput
            style={styles.input}
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            placeholder="Any special requirements?"
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Price Summary */}
        <View style={[styles.card, { backgroundColor: '#f0f9ff' }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontSize: 14, color: '#666' }}>Total Amount</Text>
              <Text style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                {duration} {bookingType === "hourly" ? "hours" : bookingType === "daily" ? "days" : "weeks"} 
                × ₹{bookingType === "hourly" ? selectedNurse.hourly_rate : bookingType === "daily" ? selectedNurse.daily_rate : selectedNurse.daily_rate * 7}
              </Text>
            </View>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#2196F3' }}>
              ₹{calculateTotalPrice()}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={handleBookNurse}
          disabled={submitting}
          style={[styles.primaryButton, submitting && { opacity: 0.6 }]}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Confirm Booking</Text>
          )}
        </Pressable>

        <CustomAlert
          visible={alert.visible}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onClose={() => {
            setAlert({ ...alert, visible: false });
            alert.onConfirm?.();
          }}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 32, paddingBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={{ fontSize: 16, color: '#1e3a8a', fontWeight: '600' }}>← Back</Text>
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#0f172a', marginLeft: 12 }}>Book Home Nurse</Text>
      </View>

      {/* Search Bar */}
      <View style={{ padding: 16, paddingBottom: 0 }}>
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
          placeholder="Search nurses by name, specialization, services..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Filters</Text>
        
        {/* Specialization Dropdown */}
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: "600", color: "#64748b", marginBottom: 6 }}>Specialization</Text>
          <Pressable
            onPress={() => setShowSpecializationDropdown(!showSpecializationDropdown)}
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
            <Text style={{ fontSize: 13, color: "#0f172a", fontWeight: "500" }}>{selectedSpecialization}</Text>
            <Text style={{ fontSize: 10, color: "#64748b" }}>▼</Text>
          </Pressable>
          {showSpecializationDropdown && (
            <View style={{
              position: "absolute",
              top: 56,
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
                <Pressable
                  onPress={() => {
                    setSelectedSpecialization("All");
                    setShowSpecializationDropdown(false);
                  }}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: "#f1f5f9",
                    backgroundColor: selectedSpecialization === "All" ? "#fff7ed" : "transparent"
                  }}
                >
                  <Text style={{ fontSize: 13, color: "#0f172a" }}>All</Text>
                </Pressable>
                {Array.from(new Set(nurses.map(n => n.specialization))).map(spec => (
                  <Pressable
                    key={spec}
                    onPress={() => {
                      setSelectedSpecialization(spec);
                      setShowSpecializationDropdown(false);
                    }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: "#f1f5f9",
                      backgroundColor: selectedSpecialization === spec ? "#fff7ed" : "transparent"
                    }}
                  >
                    <Text style={{ fontSize: 13, color: "#0f172a" }}>{spec}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Experience, Rating, Sort Row */}
        <View style={{ flexDirection: "row", gap: 8, zIndex: -1 }}>
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
                {selectedExperience === "All" ? "All" : `${selectedExperience}y`}
              </Text>
              <Text style={{ fontSize: 10, color: "#64748b" }}>▼</Text>
            </Pressable>
            {showExperienceDropdown && (
              <View style={{
                position: "absolute",
                top: 56,
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
                  {experienceRanges.map(range => (
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
                        backgroundColor: selectedExperience === range ? "#eff6ff" : "transparent"
                      }}
                    >
                      <Text style={{ fontSize: 13, color: "#0f172a" }}>
                        {range === "All" ? "All" : `${range} yrs`}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Rating Dropdown */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: "#64748b", marginBottom: 6 }}>Rating</Text>
            <Pressable
              onPress={() => setShowRatingDropdown(!showRatingDropdown)}
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
                {selectedRating === 0 ? "All" : `${selectedRating}+⭐`}
              </Text>
              <Text style={{ fontSize: 10, color: "#64748b" }}>▼</Text>
            </Pressable>
            {showRatingDropdown && (
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
                {[0, 3, 4, 4.5].map(rating => (
                  <Pressable
                    key={rating}
                    onPress={() => {
                      setSelectedRating(rating);
                      setShowRatingDropdown(false);
                    }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: "#f1f5f9",
                      backgroundColor: selectedRating === rating ? "#fef3c7" : "transparent"
                    }}
                  >
                    <Text style={{ fontSize: 13, color: "#0f172a" }}>
                      {rating === 0 ? "All" : `${rating}+ ⭐`}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Sort Dropdown */}
        <View style={{ marginTop: 12, zIndex: -2 }}>
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
               sortBy === "rating" ? "Rating" :
               sortBy === "experience" ? "Experience" :
               sortBy === "hourly_rate" ? "Hourly Rate" : "Daily Rate"}
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
              {[{id: "nearest", label: "📍 Nearest"}, {id: "rating", label: "Rating"}, {id: "experience", label: "Experience"}, {id: "hourly_rate", label: "Hourly Rate"}, {id: "daily_rate", label: "Daily Rate"}].map(option => (
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
      </View>

      {/* Nurses List */}
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>
          Available Nurses ({filteredNurses.length})
        </Text>
        
        {filteredNurses.length === 0 ? (
          <View style={styles.card}>
            <Text style={{ textAlign: 'center', color: '#666' }}>
              No nurses available for this specialization
            </Text>
          </View>
        ) : (
          filteredNurses.map(nurse => (
            <Pressable
              key={nurse.id}
              onPress={() => handleNurseSelect(nurse)}
              style={[styles.card, { marginBottom: 12, opacity: nurse.is_active ? 1 : 0.6 }]}
            >
              <View style={{ flexDirection: 'row' }}>
                <NurseImage image={nurse.image} size={50} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#1a1a1a' }}>{nurse.name}</Text>
                      <Text style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
                        {nurse.qualification} • {nurse.specialization}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                        {nurse.experience} years • {nurse.gender} • ⭐ {nurse.rating.toFixed(1)}
                        {location && nurse.latitude != null && nurse.longitude != null
                          ? ` · 📍 ${formatDistance(haversineKm(location.latitude, location.longitude, nurse.latitude, nurse.longitude))} away`
                          : ""}
                      </Text>
                    </View>
                    {!nurse.is_active && (
                      <View style={{ backgroundColor: '#ff5252', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                        <Text style={{ fontSize: 11, color: '#fff', fontWeight: '600' }}>Unavailable</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {nurse.services.slice(0, 3).map(service => (
                      <View key={service} style={{ backgroundColor: '#e3f2fd', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                        <Text style={{ fontSize: 11, color: '#1976d2' }}>{service}</Text>
                      </View>
                    ))}
                    {nurse.services.length > 3 && (
                      <View style={{ backgroundColor: '#f5f5f5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                        <Text style={{ fontSize: 11, color: '#666' }}>+{nurse.services.length - 3} more</Text>
                      </View>
                    )}
                  </View>

                  <View style={{ flexDirection: 'row', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, color: '#999' }}>Hourly Rate</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#4CAF50' }}>₹{nurse.hourly_rate}/hr</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, color: '#999' }}>Daily Rate</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#4CAF50' }}>₹{nurse.daily_rate}/day</Text>
                    </View>
                  </View>

                  {nurse.is_active && (
                    <View style={{ marginTop: 10 }}>
                      <View style={{ backgroundColor: '#2196F3', paddingVertical: 8, borderRadius: 8, alignItems: 'center' }}>
                        <Text style={{ color: '#fff', fontWeight: '600' }}>Book Now</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          ))
        )}
      </View>

      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={() => {
          setAlert({ ...alert, visible: false });
          alert.onConfirm?.();
        }}
      />

      <DatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelect={(date) => {
          setStartDate(date);
          if (validationErrors.startDate) {
            setValidationErrors({ ...validationErrors, startDate: undefined });
          }
        }}
        selectedDate={startDate}
      />
    </ScrollView>
  );
}
