import { useState, useEffect } from "react";
import { Pressable, ScrollView, Text, View, TextInput, ActivityIndicator, Image } from "react-native";
import DatePickerModal from "../../components/DatePickerModal";
import TimePickerDropdown from "../../components/TimePickerDropdown";
import { styles } from "../../styles";
import { physiotherapistAPI, type Physiotherapist } from "../../api/physiotherapistApi";
import { parseBackendErrors, validators } from "../../utils/errorHandler";
import CustomAlert from "../../components/CustomAlert";
import LoadingScreen from "../../components/LoadingScreen";
import { useLocation } from "../../hooks/useLocation";
import { haversineKm, formatDistance } from "../../utils/locationUtils";
import LocationBar from "../../components/LocationBar";

type PhysiotherapistBookingScreenProps = {
  readonly onBack: () => void;
};

type BookingType = "session" | "daily" | "weekly";
type ServiceType = "home" | "clinic";

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

const isImageUrl = (imageString: string): boolean => {
  return imageString.startsWith('data:') || imageString.startsWith('http://') || imageString.startsWith('https://');
};

const PhysiotherapistImage = ({ image, size = 40 }: { image: string; size?: number }) => {
  if (isImageUrl(image)) {
    return (
      <Image
        source={{ uri: image }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#f1f5f9' }}
        resizeMode="cover"
      />
    );
  }
  return <Text style={{ fontSize: size }}>{image || '🧑‍⚕️'}</Text>;
};

export default function PhysiotherapistBookingScreen({ onBack }: Readonly<PhysiotherapistBookingScreenProps>) {
  const { location, locationName, locationLoading, requestLocation, setManualName } = useLocation();
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [physiotherapists, setPhysiotherapists] = useState<Physiotherapist[]>([]);
  const [filteredPhysiotherapists, setFilteredPhysiotherapists] = useState<Physiotherapist[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>("All");
  const [selectedExperience, setSelectedExperience] = useState<string>("All");
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>("rating");
  const [showSpecializationDropdown, setShowSpecializationDropdown] = useState<boolean>(false);
  const [showExperienceDropdown, setShowExperienceDropdown] = useState<boolean>(false);
  const [showRatingDropdown, setShowRatingDropdown] = useState<boolean>(false);
  const [showSortDropdown, setShowSortDropdown] = useState<boolean>(false);
  const [selectedPhysiotherapist, setSelectedPhysiotherapist] = useState<Physiotherapist | null>(null);
  const [showBookingForm, setShowBookingForm] = useState<boolean>(false);
  
  // Form fields
  const [patientName, setPatientName] = useState<string>("");
  const [patientAge, setPatientAge] = useState<string>("");
  const [patientGender, setPatientGender] = useState<string>("Male");
  const [contactNumber, setContactNumber] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [medicalCondition, setMedicalCondition] = useState<string>("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [serviceType, setServiceType] = useState<ServiceType>("home");
  const [bookingType, setBookingType] = useState<BookingType>("session");
  const [duration, setDuration] = useState<string>("1");
  const [shiftPreference, setShiftPreference] = useState<string>("Morning (8 AM - 12 PM)");
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

  const specializationOptions = ["All", "Sports", "Orthopedic", "Neurological", "Pediatric", "Geriatric"];

  useEffect(() => {
    fetchPhysiotherapists();
  }, []);

  useEffect(() => {
    filterPhysiotherapists();
  }, [selectedSpecialization, selectedExperience, selectedRating, sortBy, searchQuery, physiotherapists, location]);

  const fetchPhysiotherapists = async () => {
    try {
      setLoading(true);
      const data = await physiotherapistAPI.getPhysiotherapists();
      setPhysiotherapists(data);
      setFilteredPhysiotherapists(data);
    } catch (error: any) {
      console.error('Failed to fetch physiotherapists:', error);
      setAlert({
        visible: true,
        type: "error",
        title: "Error",
        message: "Failed to load physiotherapists. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const filterPhysiotherapists = () => {
    let filtered = [...physiotherapists];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.specialization.toLowerCase().includes(query) ||
        p.qualification.toLowerCase().includes(query) ||
        p.services.some(s => s.toLowerCase().includes(query))
      );
    }

    // Specialization filter
    if (selectedSpecialization !== "All") {
      filtered = filtered.filter(p => p.specialization === selectedSpecialization);
    }

    // Experience filter
    if (selectedExperience !== "All") {
      if (selectedExperience === "0-2") {
        filtered = filtered.filter(p => p.experience >= 0 && p.experience <= 2);
      } else if (selectedExperience === "2-5") {
        filtered = filtered.filter(p => p.experience > 2 && p.experience <= 5);
      } else if (selectedExperience === "5-10") {
        filtered = filtered.filter(p => p.experience > 5 && p.experience <= 10);
      } else if (selectedExperience === "10+") {
        filtered = filtered.filter(p => p.experience > 10);
      }
    }

    // Rating filter
    if (selectedRating > 0) {
      filtered = filtered.filter(p => p.rating >= selectedRating);
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

    setFilteredPhysiotherapists(filtered);
  };

  const experienceRanges = ["All", "0-2", "2-5", "5-10", "10+"];

  const handlePhysiotherapistSelect = (physiotherapist: Physiotherapist) => {
    if (!physiotherapist.is_active) return;
    setSelectedPhysiotherapist(physiotherapist);
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
    if (!selectedPhysiotherapist) return 0;
    const durationNum = parseInt(duration) || 1;
    
    switch (bookingType) {
      case "session":
        return selectedPhysiotherapist.hourly_rate * durationNum;
      case "daily":
        return selectedPhysiotherapist.daily_rate * durationNum;
      case "weekly":
        return (selectedPhysiotherapist.daily_rate * 7) * durationNum;
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
    if (serviceType === "home") {
      errors.address = validators.address(address);
    }
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

  const handleBookPhysiotherapist = async () => {
    if (!selectedPhysiotherapist) {
      setAlert({
        visible: true,
        type: "error",
        title: "Selection Required",
        message: "Please select a physiotherapist to continue."
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
        physiotherapist_id: selectedPhysiotherapist.id,
        patient_name: patientName,
        patient_age: parseInt(patientAge),
        patient_gender: patientGender,
        contact_number: contactNumber,
        service_type: serviceType,
        address: serviceType === "home" ? address : undefined,
        medical_condition: medicalCondition || undefined,
        required_services: selectedServices,
        booking_type: bookingType,
        duration: parseInt(duration),
        shift_preference: shiftPreference,
        start_date: formattedDate,
        start_time: bookingType === "session" ? startTime : undefined,
        special_instructions: specialInstructions || undefined,
      };

      const booking = await physiotherapistAPI.createPhysiotherapistBooking(bookingData);

      setAlert({
        visible: true,
        type: "success",
        title: "Booking Confirmed!",
        message: `Your physiotherapy booking has been confirmed.\n\n` +
          `Booking ID: #${booking.id}\n` +
          `Physiotherapist: ${selectedPhysiotherapist.name}\n` +
          `Patient: ${patientName}\n` +
          `Service: ${serviceType === "home" ? "Home Service" : "Visit Clinic"}\n` +
          `Duration: ${duration} ${bookingType === "session" ? "sessions" : bookingType === "daily" ? "days" : "weeks"}\n` +
          `Total Price: ₹${booking.total_price}\n\n` +
          `Our team will contact you shortly at ${contactNumber}`,
        onConfirm: () => {
          resetForm();
        }
      });
    } catch (error: any) {
      console.error('Failed to book physiotherapist:', error);
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
    setSelectedPhysiotherapist(null);
    setPatientName("");
    setPatientAge("");
    setPatientGender("Male");
    setContactNumber("");
    setAddress("");
    setMedicalCondition("");
    setSelectedServices([]);
    setServiceType("home");
    setBookingType("session");
    setDuration("1");
    setShiftPreference("Morning (8 AM - 12 PM)");
    setStartDate("");
    setStartTime("");
    setSpecialInstructions("");
    setShowBookingForm(false);
    setValidationErrors({});
  };

  if (loading) {
    return <LoadingScreen message="Loading physiotherapists" />;
  }

  if (showBookingForm && selectedPhysiotherapist) {
    return (
      <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.homeScroll}>
        <View style={styles.serviceScreenCard}>
        <View style={styles.serviceHeaderRow}>
          <Pressable onPress={() => setShowBookingForm(false)} style={styles.backButton}>
            <View style={styles.backIcon} />
          </Pressable>
          <Text style={styles.serviceHeaderTitle}>Book Physiotherapist</Text>
        </View>

        {/* Physiotherapist Info */}
        <View style={[styles.card, { marginBottom: 16 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View style={{ marginRight: 12 }}>
              <PhysiotherapistImage image={selectedPhysiotherapist.image} size={40} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#1a1a1a' }}>{selectedPhysiotherapist.name}</Text>
              <Text style={{ fontSize: 14, color: '#666', marginTop: 2 }}>
                {selectedPhysiotherapist.qualification} • {selectedPhysiotherapist.specialization}
              </Text>
              <Text style={{ fontSize: 14, color: '#666' }}>
                {selectedPhysiotherapist.experience} years exp • ⭐ {selectedPhysiotherapist.rating.toFixed(1)}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' }}>
            <View>
              <Text style={{ fontSize: 12, color: '#666' }}>Per Session</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#4CAF50' }}>₹{selectedPhysiotherapist.hourly_rate}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 12, color: '#666' }}>Daily</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#4CAF50' }}>₹{selectedPhysiotherapist.daily_rate}</Text>
            </View>
          </View>
        </View>

        {/* Service Type Toggle */}
        <View style={{ marginBottom: 16 }}>
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Service Type</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={() => setServiceType("home")}
              style={{
                flex: 1,
                backgroundColor: serviceType === "home" ? "#FF6B35" : "#f1f5f9",
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: serviceType === "home" ? "#FF6B35" : "#e2e8f0",
                alignItems: "center"
              }}
            >
              <Text style={{ fontSize: 22, marginBottom: 4 }}>🏠</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: serviceType === "home" ? "#ffffff" : "#0f172a" }}>
                Home Service
              </Text>
              <Text style={{ fontSize: 11, color: serviceType === "home" ? "#ffe0d0" : "#64748b", textAlign: "center", marginTop: 2 }}>
                Therapist visits you
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setServiceType("clinic")}
              style={{
                flex: 1,
                backgroundColor: serviceType === "clinic" ? "#FF6B35" : "#f1f5f9",
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: serviceType === "clinic" ? "#FF6B35" : "#e2e8f0",
                alignItems: "center"
              }}
            >
              <Text style={{ fontSize: 22, marginBottom: 4 }}>🏥</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: serviceType === "clinic" ? "#ffffff" : "#0f172a" }}>
                Visit Clinic
              </Text>
              <Text style={{ fontSize: 11, color: serviceType === "clinic" ? "#ffe0d0" : "#64748b", textAlign: "center", marginTop: 2 }}>
                You visit the clinic
              </Text>
            </Pressable>
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

          {serviceType === "home" && (
            <>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 6 }}>Home Address *</Text>
              <TextInput
                style={[styles.input, validationErrors.address && { borderColor: '#ef4444', borderWidth: 1.5 }]}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter complete address for home visit"
                multiline
                numberOfLines={2}
              />
              {validationErrors.address && <Text style={{ fontSize: 12, color: '#ef4444', marginBottom: 8, marginTop: -8 }}>{validationErrors.address}</Text>}
            </>
          )}

          <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 6 }}>Medical Condition (Optional)</Text>
          <TextInput
            style={styles.input}
            value={medicalCondition}
            onChangeText={setMedicalCondition}
            placeholder="Describe medical condition or injury"
            multiline
            numberOfLines={2}
          />

          {/* ── divider ── */}
          <View style={{ height: 1, backgroundColor: '#f1f5f9', marginVertical: 20 }} />

          {/* Required Services */}
          <Text style={styles.sectionTitle}>Required Services *</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {selectedPhysiotherapist.services.map(service => (
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

          {/* ── divider ── */}
          <View style={{ height: 1, backgroundColor: '#f1f5f9', marginVertical: 20 }} />

          {/* Booking Details */}
          <Text style={styles.sectionTitle}>Booking Details</Text>
          
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 6 }}>Booking Type *</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {[
              { value: "session", label: "Per Session" },
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
            Duration ({bookingType === "session" ? "sessions" : bookingType === "daily" ? "days" : "weeks"}) *
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
            {selectedPhysiotherapist.available_shifts.map(shift => (
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
            style={{
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
            }}
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

          {bookingType === "session" && (
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
                {duration} {bookingType === "session" ? "sessions" : bookingType === "daily" ? "days" : "weeks"} 
                × ₹{bookingType === "session" ? selectedPhysiotherapist.hourly_rate : bookingType === "daily" ? selectedPhysiotherapist.daily_rate : selectedPhysiotherapist.daily_rate * 7}
              </Text>
            </View>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#2196F3' }}>
              ₹{calculateTotalPrice()}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={handleBookPhysiotherapist}
          disabled={submitting}
          style={[styles.primaryButton, submitting && { opacity: 0.6 }]}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Confirm Booking</Text>
          )}
        </Pressable>

        </View>

      </ScrollView>
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
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
    <ScrollView contentContainerStyle={styles.homeScroll}>
      <View style={styles.serviceScreenCard}>
      <View style={styles.serviceHeaderRow}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <View style={styles.backIcon} />
        </Pressable>
        <Text style={styles.serviceHeaderTitle}>Book Physiotherapist</Text>
      </View>

      {/* Location Bar */}
      <LocationBar
        locationName={locationName}
        loading={locationLoading}
        onRequestGPS={requestLocation}
        onSetManual={setManualName}
      />

      {/* Search Bar */}
      <View style={{ marginBottom: 20 }}>
        <TextInput
          style={{
            backgroundColor: "#f1f5f9",
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 14,
            color: "#0f172a",
            borderWidth: 1,
            borderColor: "#e2e8f0"
          }}
          placeholder="Search physiotherapists by name, specialization, services..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      <View style={{ marginBottom: 20, backgroundColor: "#ffffff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#e2e8f0" }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 12 }}>Filters</Text>
        
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
                {specializationOptions.map(specialization => (
                  <Pressable
                    key={specialization}
                    onPress={() => {
                      setSelectedSpecialization(specialization);
                      setShowSpecializationDropdown(false);
                    }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: "#f1f5f9",
                      backgroundColor: selectedSpecialization === specialization ? "#fff7ed" : "transparent"
                    }}
                  >
                    <Text style={{ fontSize: 13, color: "#0f172a" }}>{specialization}</Text>
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

      {/* Results Count */}
      <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
        {filteredPhysiotherapists.length} physiotherapist{filteredPhysiotherapists.length !== 1 ? 's' : ''} found
      </Text>

      {filteredPhysiotherapists.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🧘</Text>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#666' }}>No physiotherapists available</Text>
          <Text style={{ fontSize: 14, color: '#999', marginTop: 8 }}>
            {selectedSpecialization !== "All" ? "Try selecting a different specialization" : "Please check back later"}
          </Text>
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          {filteredPhysiotherapists.map(physiotherapist => (
            <Pressable
              key={physiotherapist.id}
              onPress={() => handlePhysiotherapistSelect(physiotherapist)}
              style={[
                styles.card,
                !physiotherapist.is_active && { opacity: 0.6 }
              ]}
            >
              <View style={{ flexDirection: 'row' }}>
                <View style={{ marginRight: 12 }}>
                  <PhysiotherapistImage image={physiotherapist.image} size={48} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 18, fontWeight: '600', color: '#1a1a1a' }}>{physiotherapist.name}</Text>
                      <Text style={{ fontSize: 14, color: '#666', marginTop: 2 }}>
                        {physiotherapist.qualification}
                      </Text>
                    </View>
                    {physiotherapist.is_active && (
                      <View style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#e8f5e9', borderRadius: 8 }}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#4CAF50' }}>Available</Text>
                      </View>
                    )}
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#e3f2fd', borderRadius: 8 }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: '#1976D2' }}>{physiotherapist.specialization}</Text>
                    </View>
                    <Text style={{ fontSize: 13, color: '#666' }}>
                      {physiotherapist.experience} years exp
                    </Text>
                    <Text style={{ fontSize: 13, color: '#666' }}>
                      ⭐ {physiotherapist.rating.toFixed(1)}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#666' }}>
                      {physiotherapist.gender}
                    </Text>
                    {location && physiotherapist.latitude != null && physiotherapist.longitude != null && (
                      <Text style={{ fontSize: 13, color: '#666' }}>
                        📍 {formatDistance(haversineKm(location.latitude, location.longitude, physiotherapist.latitude, physiotherapist.longitude))} away
                      </Text>
                    )}
                  </View>

                  <Text style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
                    Languages: {physiotherapist.languages.join(', ')}
                  </Text>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {physiotherapist.services.slice(0, 3).map(service => (
                      <View key={service} style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
                        <Text style={{ fontSize: 11, color: '#666' }}>{service}</Text>
                      </View>
                    ))}
                    {physiotherapist.services.length > 3 && (
                      <View style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
                        <Text style={{ fontSize: 11, color: '#666' }}>+{physiotherapist.services.length - 3} more</Text>
                      </View>
                    )}
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' }}>
                    <View>
                      <Text style={{ fontSize: 12, color: '#666' }}>Per Session</Text>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#4CAF50' }}>₹{physiotherapist.hourly_rate}</Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 12, color: '#666' }}>Daily</Text>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#4CAF50' }}>₹{physiotherapist.daily_rate}</Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 12, color: '#666' }}>Weekly</Text>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#4CAF50' }}>₹{physiotherapist.daily_rate * 7}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      </View>

    </ScrollView>
    <CustomAlert
      visible={alert.visible}
      type={alert.type}
      title={alert.title}
      message={alert.message}
      onClose={() => setAlert({ ...alert, visible: false })}
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
    </View>
  );
}
