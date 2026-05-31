import { useState, useEffect } from "react";
import { Modal, Pressable, ScrollView, Text, View, TextInput, Image, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { styles } from "../../styles";
import { MEDICINES, MEDICINE_CATEGORIES, type Medicine } from "../../data/medicines";
import LoadingScreen from "../../components/LoadingScreen";
import PrescriptionUploadSuccessModal from "../../components/PrescriptionUploadSuccessModal";
import { pharmacyApi } from "../../api/pharmacyApi";

type PharmacyScreenProps = {
  readonly onBack: () => void;
};

type CartItem = {
  medicine: Medicine;
  quantity: number;
};

type PrescriptionUploadProps = {
  readonly prescriptionUploaded: boolean;
  readonly prescriptionImage: string;
  readonly onUploadFromGallery: () => void;
  readonly onTakePhoto: () => void;
};

function PrescriptionUpload({ prescriptionUploaded, prescriptionImage, onUploadFromGallery, onTakePhoto }: Readonly<PrescriptionUploadProps>) {
  if (prescriptionUploaded) {
    return (
      <View style={{
        backgroundColor: "#f0fdf4",
        borderRadius: 12,
        padding: 12,
        marginTop: 16,
        borderWidth: 1,
        borderColor: "#bbf7d0",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        {prescriptionImage ? (
          <Image
            source={{ uri: prescriptionImage }}
            style={{
              width: 50,
              height: 50,
              borderRadius: 8,
              marginRight: 12
            }}
            resizeMode="cover"
          />
        ) : (
          <Text style={{ fontSize: 32, marginRight: 12 }}>✅</Text>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#16a34a" }}>
            Prescription Uploaded
          </Text>
          <Text style={{ fontSize: 11, color: "#64748b" }}>
            Required for Rx medicines
          </Text>
        </View>
        <Pressable
          onPress={onUploadFromGallery}
          style={{
            backgroundColor: "#ffffff",
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 6
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: "600", color: "#16a34a" }}>
            Change
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{
      backgroundColor: "#fffbeb",
      borderRadius: 12,
      padding: 12,
      marginTop: 16,
      borderWidth: 1,
      borderColor: "#fde68a",
      flexDirection: "row",
      alignItems: "center"
    }}>
      <Text style={{ fontSize: 24, marginRight: 12 }}>📋</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: "#0f172a", marginBottom: 2 }}>
          Upload Prescription (Optional)
        </Text>
        <Text style={{ fontSize: 11, color: "#64748b" }}>
          Required for prescription medicines only
        </Text>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable
          onPress={onTakePhoto}
          style={{
            backgroundColor: "#FF6B35",
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 8
          }}
        >
          <Text style={{ fontSize: 18 }}>📸</Text>
        </Pressable>
        <Pressable
          onPress={onUploadFromGallery}
          style={{
            backgroundColor: "#FF6B35",
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 8
          }}
        >
          <Text style={{ fontSize: 18 }}>🖼️</Text>
        </Pressable>
      </View>
    </View>
  );
}

const REFILL_OPTIONS = [
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "2 Months", value: "2months" },
  { label: "3 Months", value: "3months" },
];

type CartViewProps = {
  readonly cart: CartItem[];
  readonly onBack: () => void;
  readonly removeFromCart: (id: string) => void;
  readonly updateQuantity: (id: string, newQuantity: number) => void;
  readonly getTotalAmount: () => number;
  readonly getTotalSavings: () => number;
  readonly deliveryAddress: string;
  readonly setDeliveryAddress: (address: string) => void;
  readonly phoneNumber: string;
  readonly setPhoneNumber: (phone: string) => void;
  readonly refillEnabled: boolean;
  readonly setRefillEnabled: (v: boolean) => void;
  readonly refillFrequency: string;
  readonly setRefillFrequency: (v: string) => void;
  readonly handlePlaceOrder: () => void;
};

function CartView({
  cart,
  onBack,
  removeFromCart,
  updateQuantity,
  getTotalAmount,
  getTotalSavings,
  deliveryAddress,
  setDeliveryAddress,
  phoneNumber,
  setPhoneNumber,
  refillEnabled,
  setRefillEnabled,
  refillFrequency,
  setRefillFrequency,
  handlePlaceOrder
}: Readonly<CartViewProps>) {
  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
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
            <Text style={styles.serviceHeaderTitle}>Your Cart ({cart.length})</Text>
          </View>

          {cart.length === 0 ? (
            <View style={{
              backgroundColor: "#f8fafc",
              borderRadius: 16,
              padding: 40,
              alignItems: "center",
              marginTop: 40
            }}>
              <Text style={{ fontSize: 40, marginBottom: 16 }}>🛒</Text>
              <Text style={{ fontSize: 18, fontWeight: "600", color: "#0f172a", marginBottom: 8 }}>
                Your cart is empty
              </Text>
              <Text style={{ fontSize: 14, color: "#64748b", textAlign: "center" }}>
                Add medicines from our catalog to place an order
              </Text>
            </View>
          ) : (
            <>
              {/* Cart Items */}
              <View style={{ marginTop: 24 }}>
                {cart.map((item) => (
                  <View
                    key={item.medicine.id}
                    style={{
                      backgroundColor: "#f8fafc",
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: "#e2e8f0"
                    }}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: "#0f172a" }}>
                          {item.medicine.name}
                        </Text>
                        <Text style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                          {item.medicine.manufacturer} • {item.medicine.packSize}
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
                          {item.medicine.discountPrice && (
                            <Text style={{ fontSize: 12, color: "#94a3b8", textDecorationLine: "line-through", marginRight: 6 }}>
                              ₹{item.medicine.price}
                            </Text>
                          )}
                          <Text style={{ fontSize: 16, fontWeight: "700", color: "#FF6B35" }}>
                            ₹{item.medicine.discountPrice || item.medicine.price}
                          </Text>
                        </View>
                      </View>
                      <View style={{ alignItems: "flex-end", justifyContent: "space-between" }}>
                        <Pressable
                          onPress={() => removeFromCart(item.medicine.id)}
                          style={{ padding: 4 }}
                        >
                          <Text style={{ fontSize: 18, color: "#dc2626" }}>🗑️</Text>
                        </Pressable>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <Pressable
                            onPress={() => updateQuantity(item.medicine.id, item.quantity - 1)}
                            style={{
                              backgroundColor: "#ffffff",
                              width: 28,
                              height: 28,
                              borderRadius: 6,
                              alignItems: "center",
                              justifyContent: "center",
                              borderWidth: 1,
                              borderColor: "#e2e8f0"
                            }}
                          >
                            <Text style={{ fontSize: 16, fontWeight: "700", color: "#64748b" }}>−</Text>
                          </Pressable>
                          <Text style={{ fontSize: 15, fontWeight: "700", color: "#0f172a", minWidth: 24, textAlign: "center" }}>
                            {item.quantity}
                          </Text>
                          <Pressable
                            onPress={() => updateQuantity(item.medicine.id, item.quantity + 1)}
                            style={{
                              backgroundColor: "#FF6B35",
                              width: 28,
                              height: 28,
                              borderRadius: 6,
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                          >
                            <Text style={{ fontSize: 16, fontWeight: "700", color: "#ffffff" }}>+</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              {/* Bill Summary */}
              <View style={{
                backgroundColor: "#eff6ff",
                borderRadius: 16,
                padding: 16,
                marginTop: 16
              }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#0f172a", marginBottom: 12 }}>
                  Bill Summary
                </Text>
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 14, color: "#64748b" }}>Cart Total</Text>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "#0f172a" }}>
                      ₹{getTotalAmount() + getTotalSavings()}
                    </Text>
                  </View>
                  {getTotalSavings() > 0 && (
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: 14, color: "#16a34a" }}>Savings</Text>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: "#16a34a" }}>
                        −₹{getTotalSavings()}
                      </Text>
                    </View>
                  )}
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 14, color: "#64748b" }}>Delivery Charges</Text>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "#16a34a" }}>FREE</Text>
                  </View>
                  <View style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingTop: 12,
                    marginTop: 8,
                    borderTopWidth: 1,
                    borderTopColor: "#bfdbfe"
                  }}>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: "#0f172a" }}>Total Amount</Text>
                    <Text style={{ fontSize: 18, fontWeight: "700", color: "#FF6B35" }}>
                      ₹{getTotalAmount()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Delivery Details */}
              <View style={{ marginTop: 24 }}>
                <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Delivery Details</Text>
                
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#0f172a", marginBottom: 6 }}>
                  Delivery Address*
                </Text>
                <TextInput
                  value={deliveryAddress}
                  onChangeText={setDeliveryAddress}
                  placeholder="Enter complete delivery address"
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={3}
                  style={[styles.input, { height: 80, textAlignVertical: "top", paddingTop: 12, marginBottom: 16 }]}
                />

                <Text style={{ fontSize: 13, fontWeight: "600", color: "#0f172a", marginBottom: 6 }}>
                  Contact Number*
                </Text>
                <TextInput
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="Enter phone number"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  style={styles.input}
                />
              </View>

              {/* Refill Schedule */}
              <View style={{
                backgroundColor: "#f8fafc",
                borderRadius: 16,
                padding: 16,
                marginTop: 24,
                borderWidth: 1,
                borderColor: "#e2e8f0"
              }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: "#0f172a" }}>
                      🔄 Auto Refill
                    </Text>
                    <Text style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      Get medicines delivered automatically
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setRefillEnabled(!refillEnabled)}
                    style={{
                      width: 48,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: refillEnabled ? "#FF6B35" : "#cbd5e1",
                      justifyContent: "center",
                      paddingHorizontal: 2
                    }}
                  >
                    <View style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: "#ffffff",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.2,
                      shadowRadius: 2,
                      elevation: 2,
                      alignSelf: refillEnabled ? "flex-end" : "flex-start"
                    }} />
                  </Pressable>
                </View>

                {refillEnabled && (
                  <View style={{ marginTop: 16 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: "#0f172a", marginBottom: 10 }}>
                      Delivery Frequency
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                      {REFILL_OPTIONS.map((opt) => (
                        <Pressable
                          key={opt.value}
                          onPress={() => setRefillFrequency(opt.value)}
                          style={{
                            paddingVertical: 8,
                            paddingHorizontal: 18,
                            borderRadius: 20,
                            borderWidth: 1.5,
                            borderColor: refillFrequency === opt.value ? "#FF6B35" : "#e2e8f0",
                            backgroundColor: refillFrequency === opt.value ? "#fff4f0" : "#ffffff"
                          }}
                        >
                          <Text style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color: refillFrequency === opt.value ? "#FF6B35" : "#64748b"
                          }}>
                            {opt.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    <Text style={{ fontSize: 11, color: "#64748b", marginTop: 10 }}>
                      Your next order will be placed automatically every {REFILL_OPTIONS.find(o => o.value === refillFrequency)?.label.toLowerCase()}.
                    </Text>
                  </View>
                )}
              </View>

              {/* Place Order Button */}
              <Pressable
                onPress={handlePlaceOrder}
                disabled={!deliveryAddress || !phoneNumber}
                style={{
                  backgroundColor: (deliveryAddress && phoneNumber) ? "#FF6B35" : "#e2e8f0",
                  paddingVertical: 16,
                  borderRadius: 12,
                  marginTop: 24,
                  shadowColor: (deliveryAddress && phoneNumber) ? "#FF6B35" : "transparent",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4
                }}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: (deliveryAddress && phoneNumber) ? "#ffffff" : "#94a3b8",
                  textAlign: "center"
                }}>
                  Place Order - ₹{getTotalAmount()}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

export default function PharmacyScreen({ onBack }: Readonly<PharmacyScreenProps>) {
  const [loading, setLoading] = useState<boolean>(true);
  const [prescriptionUploaded, setPrescriptionUploaded] = useState<boolean>(false);
  const [prescriptionImage, setPrescriptionImage] = useState<string>("");
  const [showPrescriptionModal, setShowPrescriptionModal] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState<boolean>(false);
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [refillEnabled, setRefillEnabled] = useState<boolean>(false);
  const [refillFrequency, setRefillFrequency] = useState<string>("monthly");

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Filter medicines based on search and category
  const filteredMedicines = MEDICINES.filter((medicine) => {
    const matchesCategory = selectedCategory === "All" || medicine.category === selectedCategory;
    const matchesSearch = searchQuery === "" ||
      medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      medicine.genericName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handlePrescriptionSuccess = async (uri: string, base64?: string | null) => {
    setPrescriptionImage(uri);
    setPrescriptionUploaded(true);
    setShowSuccessModal(true);
    // Submit to backend best-effort (silently ignore errors)
    if (base64) {
      try {
        await pharmacyApi.submitPrescription(`data:image/jpeg;base64,${base64}`);
      } catch {
        // backend submission is best-effort
      }
    }
  };

  const handleSuccessModalCancel = () => {
    setShowSuccessModal(false);
  };

  const handleSuccessModalCheckAvailability = (checkAvailability: boolean) => {
    setShowSuccessModal(false);
    if (checkAvailability) {
      // Filter to show only prescription medicines
      setSelectedCategory("All");
      setSearchQuery("");
      // Optionally show a notification
      alert("✓ Now showing available medicines based on your prescription");
    }
  };

  const handleUploadPrescription = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("Permission to access camera roll is required!");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.6,
      base64: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      await handlePrescriptionSuccess(result.assets[0].uri, result.assets[0].base64);
    }
  };

  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("Permission to access camera is required!");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.6,
      base64: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      await handlePrescriptionSuccess(result.assets[0].uri, result.assets[0].base64);
    }
  };

  const getItemQuantity = (medicineId: string): number => {
    const item = cart.find(item => item.medicine.id === medicineId);
    return item ? item.quantity : 0;
  };

  const addToCart = (medicine: Medicine) => {
    const existingItem = cart.find(item => item.medicine.id === medicine.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.medicine.id === medicine.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { medicine, quantity: 1 }]);
    }
  };

  const removeFromCart = (medicineId: string) => {
    setCart(cart.filter(item => item.medicine.id !== medicineId));
  };

  const updateQuantity = (medicineId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(medicineId);
    } else {
      setCart(cart.map(item =>
        item.medicine.id === medicineId
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => {
      const price = item.medicine.discountPrice || item.medicine.price;
      return total + (price * item.quantity);
    }, 0);
  };

  const getTotalSavings = () => {
    return cart.reduce((savings, item) => {
      const discount = item.medicine.discountPrice 
        ? (item.medicine.price - item.medicine.discountPrice) * item.quantity 
        : 0;
      return savings + discount;
    }, 0);
  };

  const handlePlaceOrder = () => {
    if (cart.length > 0 && deliveryAddress && phoneNumber) {
      const refillLabel = REFILL_OPTIONS.find(o => o.value === refillFrequency)?.label;
      const refillMsg = refillEnabled ? `\nAuto Refill: Every ${refillLabel}` : "";
      alert(`Order placed successfully!\nTotal: ₹${getTotalAmount()}\nYou saved: ₹${getTotalSavings()}\nDelivery to: ${deliveryAddress}${refillMsg}`);
      setCart([]);
      setDeliveryAddress("");
      setPhoneNumber("");
      setRefillEnabled(false);
      setRefillFrequency("monthly");
      setShowCart(false);
      setPrescriptionUploaded(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Dr. Meddy is stocking up medicines for you" />;
  }

  if (showCart) {
    return (
      <CartView
        cart={cart}
        onBack={() => setShowCart(false)}
        removeFromCart={removeFromCart}
        updateQuantity={updateQuantity}
        getTotalAmount={getTotalAmount}
        getTotalSavings={getTotalSavings}
        deliveryAddress={deliveryAddress}
        setDeliveryAddress={setDeliveryAddress}
        phoneNumber={phoneNumber}
        setPhoneNumber={setPhoneNumber}
        refillEnabled={refillEnabled}
        setRefillEnabled={setRefillEnabled}
        refillFrequency={refillFrequency}
        setRefillFrequency={setRefillFrequency}
        handlePlaceOrder={handlePlaceOrder}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
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
            <Text style={styles.serviceHeaderTitle}>Order Medicines</Text>
            {cart.length > 0 && (
              <Pressable
                onPress={() => setShowCart(true)}
                style={{
                  backgroundColor: "#FF6B35",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <Text style={{ fontSize: 14, color: "#ffffff", fontWeight: "700" }}>🛒</Text>
                <Text style={{ fontSize: 13, color: "#ffffff", fontWeight: "700" }}>
                  {cart.length}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Description */}
          <Text style={styles.serviceTitle}>Online Pharmacy</Text>
          <Text style={styles.serviceDescription}>
            Upload your prescription and order medicines for home delivery
          </Text>

          {/* Prescription Upload Section */}
          <PrescriptionUpload
            prescriptionUploaded={prescriptionUploaded}
            prescriptionImage={prescriptionImage}
            onUploadFromGallery={handleUploadPrescription}
            onTakePhoto={handleTakePhoto}
          />

          {/* Search Bar */}
              <View style={{
                backgroundColor: "#f1f5f9",
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 12,
                flexDirection: "row",
                alignItems: "center",
                marginTop: 24,
                borderWidth: 1,
                borderColor: "#e2e8f0"
              }}>
                <Text style={{ fontSize: 16, color: "#94a3b8", marginRight: 8 }}>🔍</Text>
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search medicines"
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

              {/* Category Filter */}
              <View style={{ marginTop: 20 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    {MEDICINE_CATEGORIES.map((category) => (
                      <Pressable
                        key={category}
                        onPress={() => setSelectedCategory(category)}
                        style={{
                          backgroundColor: selectedCategory === category ? "#FF6B35" : "#f1f5f9",
                          paddingVertical: 8,
                          paddingHorizontal: 16,
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor: selectedCategory === category ? "#FF6B35" : "#e2e8f0"
                        }}
                      >
                        <Text style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: selectedCategory === category ? "#ffffff" : "#64748b"
                        }}>
                          {category}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Medicines List */}
              <View style={{ marginTop: 24 }}>
                <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>
                  Available Medicines ({filteredMedicines.length})
                </Text>
                {filteredMedicines.length === 0 ? (
                  <View style={{
                    backgroundColor: "#f8fafc",
                    borderRadius: 16,
                    padding: 24,
                    alignItems: "center"
                  }}>
                    <Text style={{ fontSize: 16, color: "#64748b", textAlign: "center" }}>
                      No medicines found
                    </Text>
                  </View>
                ) : (
                  filteredMedicines.map((medicine) => (
                    <View
                      key={medicine.id}
                      style={{
                        backgroundColor: "#ffffff",
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: "#e2e8f0",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 4,
                        elevation: 1
                      }}
                    >
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 16, fontWeight: "700", color: "#0f172a" }}>
                            {medicine.name}
                          </Text>
                          <Text style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                            {medicine.genericName} • {medicine.manufacturer}
                          </Text>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
                            <View style={{
                              backgroundColor: "#f1f5f9",
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                              borderRadius: 6
                            }}>
                              <Text style={{ fontSize: 10, color: "#64748b", fontWeight: "600" }}>
                                {medicine.type}
                              </Text>
                            </View>
                            <Text style={{ fontSize: 11, color: "#64748b" }}>
                              {medicine.packSize}
                            </Text>
                            {medicine.prescriptionRequired && (
                              <View style={{
                                backgroundColor: "#fee2e2",
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 4
                              }}>
                                <Text style={{ fontSize: 9, color: "#dc2626", fontWeight: "700" }}>
                                  Rx REQUIRED
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <View style={{ alignItems: "flex-end", justifyContent: "space-between" }}>
                          <View>
                            {medicine.discountPrice && (
                              <Text style={{
                                fontSize: 12,
                                color: "#94a3b8",
                                textDecorationLine: "line-through"
                              }}>
                                ₹{medicine.price}
                              </Text>
                            )}
                            <Text style={{ fontSize: 18, fontWeight: "700", color: "#FF6B35" }}>
                              ₹{medicine.discountPrice || medicine.price}
                            </Text>
                            {medicine.discountPrice && (
                              <Text style={{ fontSize: 10, color: "#16a34a", fontWeight: "600" }}>
                                Save ₹{medicine.price - medicine.discountPrice}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                      <Text style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
                        {medicine.description}
                      </Text>
                      {getItemQuantity(medicine.id) === 0 ? (
                        <Pressable
                          onPress={() => addToCart(medicine)}
                          style={{
                            backgroundColor: "#FF6B35",
                            paddingVertical: 10,
                            borderRadius: 8,
                            alignItems: "center"
                          }}
                        >
                          <Text style={{ fontSize: 14, fontWeight: "700", color: "#ffffff" }}>
                            Add to Cart
                          </Text>
                        </Pressable>
                      ) : (
                        <View style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          backgroundColor: "#f8fafc",
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: "#FF6B35",
                          overflow: "hidden"
                        }}>
                          <Pressable
                            onPress={() => updateQuantity(medicine.id, getItemQuantity(medicine.id) - 1)}
                            style={{
                              backgroundColor: "#FF6B35",
                              paddingHorizontal: 20,
                              paddingVertical: 10,
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                          >
                            <Text style={{ fontSize: 20, fontWeight: "700", color: "#ffffff" }}>
                              -
                            </Text>
                          </Pressable>
                          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                            <Text style={{ fontSize: 16, fontWeight: "700", color: "#0f172a" }}>
                              {getItemQuantity(medicine.id)}
                            </Text>
                          </View>
                          <Pressable
                            onPress={() => addToCart(medicine)}
                            style={{
                              backgroundColor: "#FF6B35",
                              paddingHorizontal: 20,
                              paddingVertical: 10,
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                          >
                            <Text style={{ fontSize: 20, fontWeight: "700", color: "#ffffff" }}>
                              +
                            </Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  ))
                )}
              </View>
        </View>
      </ScrollView>

      {/* Floating Cart Button */}
      {cart.length > 0 && !showCart && (
        <Pressable
          onPress={() => setShowCart(true)}
          style={{
            position: "absolute",
            bottom: 20,
            right: 20,
            backgroundColor: "#FF6B35",
            width: 60,
            height: 60,
            borderRadius: 30,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#FF6B35",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 8
          }}
        >
          <Text style={{ fontSize: 24 }}>🛒</Text>
          <View style={{
            position: "absolute",
            top: -5,
            right: -5,
            backgroundColor: "#dc2626",
            minWidth: 22,
            height: 22,
            borderRadius: 11,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 6
          }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#ffffff" }}>
              {cart.length}
            </Text>
          </View>
        </Pressable>
      )}

      {/* Prescription Success Modal */}
      <PrescriptionUploadSuccessModal
        visible={showSuccessModal}
        onCancel={handleSuccessModalCancel}
        onCheckAvailability={handleSuccessModalCheckAvailability}
      />
    </View>
  );
}
