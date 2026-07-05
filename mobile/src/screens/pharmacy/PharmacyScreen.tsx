import { useState, useEffect } from "react";
import { Modal, Pressable, ScrollView, Text, View, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { styles } from "../../styles";
import { MEDICINES, MEDICINE_CATEGORIES, type Medicine } from "../../data/medicines";
import LoadingScreen from "../../components/LoadingScreen";
import CustomAlert from "../../components/CustomAlert";
import { pharmacyApi } from "../../api/pharmacyApi";
import { fetchFeeSettings, type FeeSettings } from "../../api/settingsApi";
import MedicineImage from "../../components/MedicineImage";
import KitsSection from "../../components/KitsSection";
import { useLocation } from "../../hooks/useLocation";
import LocationBar from "../../components/LocationBar";

type PharmacyScreenProps = {
  readonly onBack: () => void;
};

type CartItem = {
  medicine: Medicine;
  quantity: number;
};


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
  setDeliveryAddress,
  phoneNumber,
  setPhoneNumber,
  refillEnabled,
  setRefillEnabled,
  refillFrequency,
  setRefillFrequency,
  handlePlaceOrder
}: Readonly<CartViewProps>) {
  const { locationName, locationLoading, requestLocation, setManualName } = useLocation();

  const [fees, setFees] = useState<FeeSettings>({ convenience_fee: 7, delivery_fee: 20, free_delivery_threshold: 400 });
  useEffect(() => { fetchFeeSettings().then(setFees); }, []);

  const cartTotal = getTotalAmount();
  const deliveryFee = cartTotal >= fees.free_delivery_threshold ? 0 : fees.delivery_fee;
  const grandTotal = cartTotal + fees.convenience_fee + deliveryFee;

  const [houseNo, setHouseNo] = useState("");
  const [building, setBuilding] = useState("");
  const [landmark, setLandmark] = useState("");
  const [showLocModal, setShowLocModal] = useState(false);
  const [locSearchText, setLocSearchText] = useState("");

  // Build complete delivery address from all parts whenever any part changes
  useEffect(() => {
    const parts = [houseNo.trim(), building.trim(), locationName ?? "", landmark.trim()].filter(Boolean);
    setDeliveryAddress(parts.join(", "));
  }, [houseNo, building, locationName, landmark]);

  const handleGPS = () => {
    requestLocation();
    setShowLocModal(false);
  };

  const handleConfirmLocation = () => {
    if (locSearchText.trim()) setManualName(locSearchText.trim());
    setShowLocModal(false);
    setLocSearchText("");
  };

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
                      <MedicineImage
                        name={item.medicine.name}
                        genericName={item.medicine.genericName}
                        category={item.medicine.category}
                        type={item.medicine.type}
                        imageUri={item.medicine.image}
                        size={56}
                      />
                      <View style={{ flex: 1, marginLeft: 12 }}>
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
              <View style={{ backgroundColor: "#eff6ff", borderRadius: 16, padding: 16, marginTop: 16 }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#0f172a", marginBottom: 12 }}>
                  Bill Summary
                </Text>
                <View style={{ gap: 10 }}>

                  {/* MRP total */}
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 14, color: "#64748b" }}>Cart Total (MRP)</Text>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "#0f172a" }}>
                      ₹{cartTotal + getTotalSavings()}
                    </Text>
                  </View>

                  {/* Savings */}
                  {getTotalSavings() > 0 && (
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: 14, color: "#16a34a" }}>Discount / Savings</Text>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: "#16a34a" }}>
                        −₹{getTotalSavings()}
                      </Text>
                    </View>
                  )}

                  {/* Subtotal after savings */}
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 14, color: "#64748b" }}>Cart Subtotal</Text>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "#0f172a" }}>₹{cartTotal}</Text>
                  </View>

                  {/* Convenience fee */}
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 14, color: "#64748b" }}>Convenience Fee</Text>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "#0f172a" }}>
                      ₹{fees.convenience_fee}
                    </Text>
                  </View>

                  {/* Delivery */}
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <View>
                      <Text style={{ fontSize: 14, color: "#64748b" }}>Delivery Fee</Text>
                      {deliveryFee === 0 && (
                        <Text style={{ fontSize: 10, color: "#16a34a" }}>
                          Free on orders ≥ ₹{fees.free_delivery_threshold}
                        </Text>
                      )}
                      {deliveryFee > 0 && (
                        <Text style={{ fontSize: 10, color: "#94a3b8" }}>
                          Free above ₹{fees.free_delivery_threshold}
                        </Text>
                      )}
                    </View>
                    {deliveryFee === 0 ? (
                      <Text style={{ fontSize: 14, fontWeight: "600", color: "#16a34a" }}>FREE</Text>
                    ) : (
                      <Text style={{ fontSize: 14, fontWeight: "600", color: "#0f172a" }}>
                        ₹{fees.delivery_fee}
                      </Text>
                    )}
                  </View>

                  {/* Grand total */}
                  <View style={{
                    flexDirection: "row", justifyContent: "space-between",
                    paddingTop: 12, marginTop: 4,
                    borderTopWidth: 1, borderTopColor: "#bfdbfe"
                  }}>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: "#0f172a" }}>Total Amount</Text>
                    <Text style={{ fontSize: 18, fontWeight: "700", color: "#FF6B35" }}>
                      ₹{grandTotal}
                    </Text>
                  </View>

                  {deliveryFee > 0 && (
                    <Text style={{ fontSize: 11, color: "#94a3b8", textAlign: "center" }}>
                      Add ₹{fees.free_delivery_threshold - cartTotal} more for free delivery
                    </Text>
                  )}
                </View>
              </View>

              {/* Delivery Details */}
              <View style={{ marginTop: 24 }}>
                <Text style={[styles.sectionTitle, { marginBottom: 14 }]}>Delivery Details</Text>

                {/* Location Picker */}
                <Pressable
                  onPress={() => setShowLocModal(true)}
                  style={{
                    backgroundColor: "#fff4ef",
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 6,
                    borderWidth: 1,
                    borderColor: "#FFD5C2",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 20, marginRight: 10 }}>📍</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: "#94a3b8", marginBottom: 2 }}>
                      DELIVERY AREA
                    </Text>
                    {locationLoading ? (
                      <ActivityIndicator size="small" color="#FF6B35" />
                    ) : (
                      <Text style={{ fontSize: 14, fontWeight: "700", color: "#FF6B35" }} numberOfLines={1}>
                        {locationName ?? "Set your location"}
                      </Text>
                    )}
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#FF6B35" }}>Change ›</Text>
                </Pressable>
                <Text style={{ fontSize: 11, color: "#94a3b8", marginBottom: 20, paddingLeft: 2 }}>
                  Tap to use GPS or search a different area
                </Text>

                {/* Complete Address Fields */}
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#0f172a", marginBottom: 14 }}>
                  Complete Address
                </Text>

                <Text style={{ fontSize: 13, fontWeight: "600", color: "#0f172a", marginBottom: 6 }}>
                  House / Flat / Floor No.*
                </Text>
                <TextInput
                  value={houseNo}
                  onChangeText={setHouseNo}
                  placeholder="e.g. Flat 4B, 2nd Floor"
                  placeholderTextColor="#94a3b8"
                  style={[styles.input, { marginBottom: 14 }]}
                />

                <Text style={{ fontSize: 13, fontWeight: "600", color: "#0f172a", marginBottom: 6 }}>
                  Building / Apartment / Society
                </Text>
                <TextInput
                  value={building}
                  onChangeText={setBuilding}
                  placeholder="e.g. Sunrise Apartments"
                  placeholderTextColor="#94a3b8"
                  style={[styles.input, { marginBottom: 14 }]}
                />

                <Text style={{ fontSize: 13, fontWeight: "600", color: "#0f172a", marginBottom: 6 }}>
                  Nearby Landmark (optional)
                </Text>
                <TextInput
                  value={landmark}
                  onChangeText={setLandmark}
                  placeholder="e.g. Near City Hospital"
                  placeholderTextColor="#94a3b8"
                  style={[styles.input, { marginBottom: 20 }]}
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

              {/* Location Picker Modal */}
              <Modal
                visible={showLocModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowLocModal(false)}
              >
                <Pressable
                  style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }}
                  onPress={() => setShowLocModal(false)}
                />
                <KeyboardAvoidingView
                  behavior={Platform.OS === "ios" ? "padding" : undefined}
                  style={{
                    backgroundColor: "#fff",
                    borderTopLeftRadius: 22,
                    borderTopRightRadius: 22,
                    padding: 24,
                    paddingBottom: 40,
                  }}
                >
                  <View style={{ width: 40, height: 4, backgroundColor: "#e2e8f0", borderRadius: 2, alignSelf: "center", marginBottom: 22 }} />
                  <Text style={{ fontSize: 18, fontWeight: "700", color: "#0f172a", marginBottom: 4 }}>
                    Set Delivery Area
                  </Text>
                  <Text style={{ fontSize: 13, color: "#64748b", marginBottom: 22 }}>
                    Choose your area so we can deliver to you
                  </Text>

                  {/* GPS */}
                  <Pressable
                    onPress={handleGPS}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#fff4ef",
                      borderRadius: 12,
                      padding: 14,
                      marginBottom: 20,
                      borderWidth: 1,
                      borderColor: "#FFD5C2",
                    }}
                  >
                    <Text style={{ fontSize: 22, marginRight: 12 }}>🎯</Text>
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: "#FF6B35" }}>
                        Use Current Location
                      </Text>
                      <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                        Detect via GPS
                      </Text>
                    </View>
                  </Pressable>

                  {/* Divider */}
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                    <View style={{ flex: 1, height: 1, backgroundColor: "#e2e8f0" }} />
                    <Text style={{ fontSize: 11, fontWeight: "600", color: "#94a3b8", marginHorizontal: 10 }}>
                      OR SEARCH MANUALLY
                    </Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: "#e2e8f0" }} />
                  </View>

                  <TextInput
                    style={{
                      backgroundColor: "#f8fafc",
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: "#e2e8f0",
                      paddingHorizontal: 14,
                      paddingVertical: 13,
                      fontSize: 14,
                      color: "#0f172a",
                      marginBottom: 14,
                    }}
                    placeholder="Type area, city or pincode…"
                    placeholderTextColor="#94a3b8"
                    value={locSearchText}
                    onChangeText={setLocSearchText}
                    returnKeyType="done"
                    onSubmitEditing={handleConfirmLocation}
                  />
                  <Pressable
                    onPress={handleConfirmLocation}
                    disabled={!locSearchText.trim()}
                    style={{
                      backgroundColor: locSearchText.trim() ? "#FF6B35" : "#e2e8f0",
                      borderRadius: 12,
                      paddingVertical: 15,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: "700", color: locSearchText.trim() ? "#fff" : "#94a3b8" }}>
                      Confirm Area
                    </Text>
                  </Pressable>
                </KeyboardAvoidingView>
              </Modal>

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
                disabled={!houseNo.trim() || !phoneNumber.trim()}
                style={{
                  backgroundColor: (houseNo.trim() && phoneNumber.trim()) ? "#FF6B35" : "#e2e8f0",
                  paddingVertical: 16,
                  borderRadius: 12,
                  marginTop: 24,
                  shadowColor: (houseNo.trim() && phoneNumber.trim()) ? "#FF6B35" : "transparent",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4
                }}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: (houseNo.trim() && phoneNumber.trim()) ? "#ffffff" : "#94a3b8",
                  textAlign: "center"
                }}>
                  Place Order - ₹{grandTotal}
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
  const { locationName, locationLoading, requestLocation, setManualName } = useLocation();
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState<boolean>(false);
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [refillEnabled, setRefillEnabled] = useState<boolean>(false);
  const [refillFrequency, setRefillFrequency] = useState<string>("monthly");
  const [orderAlert, setOrderAlert] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: "",
    message: "",
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // The medicine catalogue comes from the backend so anything added/edited in
  // the admin portal appears here too. Falls back to the bundled list only if
  // the backend is unreachable (offline).
  const [medicines, setMedicines] = useState<Medicine[]>(MEDICINES);
  useEffect(() => {
    pharmacyApi
      .getMedicines()
      .then((list) => {
        const mapped: Medicine[] = list.map((m) => ({
          id: String(m.id),
          name: m.name,
          genericName: m.generic_name,
          manufacturer: m.manufacturer,
          category: m.category,
          type: m.dosage_form || "Tablet",
          packSize: m.strength || "",
          price: m.price,
          stock: m.stock,
          description: m.description || "",
          prescriptionRequired: m.requires_prescription,
          image: m.image || undefined,
        }));
        setMedicines(mapped);
      })
      .catch((e) => {
        console.warn("💊 Could not load medicines from backend, using bundled list:", e?.message ?? e);
      });
  }, []);

  // Filter medicines based on search and category
  const filteredMedicines = medicines.filter((medicine) => {
    const matchesCategory = selectedCategory === "All" || medicine.category === selectedCategory;
    const matchesSearch = searchQuery === "" ||
      medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      medicine.genericName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });


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

  const handlePlaceOrder = async () => {
    if (cart.length > 0 && deliveryAddress && phoneNumber) {
      try {
        await pharmacyApi.createOrder({
          patient_name: phoneNumber,
          patient_phone: phoneNumber,
          delivery_address: deliveryAddress,
          items: cart.map((item, idx) => ({
            medicine_id: idx + 1,
            medicine_name: item.medicine.name,
            quantity: item.quantity,
            price: item.medicine.discountPrice ?? item.medicine.price,
          })),
          notes: refillEnabled
            ? `Auto Refill: Every ${REFILL_OPTIONS.find(o => o.value === refillFrequency)?.label}`
            : undefined,
        });
      } catch {
        // order saved locally even if backend fails
      }
      const orderedTotal = getTotalAmount();
      const orderedAddress = deliveryAddress;
      setCart([]);
      setDeliveryAddress("");
      setPhoneNumber("");
      setRefillEnabled(false);
      setRefillFrequency("monthly");
      setShowCart(false);
      setOrderAlert({
        visible: true,
        title: "Order Placed! 🎉",
        message: `Your order of ₹${orderedTotal} has been placed successfully.\n\nDelivering to:\n${orderedAddress}`,
      });
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
            Order medicines and get them delivered to your door
          </Text>

          {/* Location Bar */}
          <LocationBar
            locationName={locationName}
            loading={locationLoading}
            onRequestGPS={requestLocation}
            onSetManual={setManualName}
          />

          {/* Kits — Launching Soon */}
          <KitsSection />

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
                      {/* Top row: image + info + price */}
                      <View style={{ flexDirection: "row", gap: 12, marginBottom: 10 }}>
                        {/* Medicine image */}
                        <MedicineImage
                          name={medicine.name}
                          genericName={medicine.genericName}
                          category={medicine.category}
                          type={medicine.type}
                          imageUri={medicine.image}
                          size={82}
                          perStrip={medicine.perStrip}
                        />

                        {/* Info + price */}
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <Text style={{ fontSize: 15, fontWeight: "700", color: "#0f172a", flex: 1, marginRight: 8 }} numberOfLines={2}>
                              {medicine.name}
                            </Text>
                            <View style={{ alignItems: "flex-end" }}>
                              {medicine.discountPrice && (
                                <Text style={{ fontSize: 11, color: "#94a3b8", textDecorationLine: "line-through" }}>
                                  ₹{medicine.price}
                                </Text>
                              )}
                              <Text style={{ fontSize: 17, fontWeight: "700", color: "#FF6B35" }}>
                                ₹{medicine.discountPrice ?? medicine.price}
                              </Text>
                              {medicine.discountPrice && (
                                <Text style={{ fontSize: 10, color: "#16a34a", fontWeight: "600" }}>
                                  Save ₹{medicine.price - medicine.discountPrice}
                                </Text>
                              )}
                            </View>
                          </View>

                          <Text style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                            {medicine.genericName} • {medicine.manufacturer}
                          </Text>

                          <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                            <View style={{ backgroundColor: "#f1f5f9", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                              <Text style={{ fontSize: 10, color: "#64748b", fontWeight: "600" }}>
                                {medicine.type}
                              </Text>
                            </View>
                            <Text style={{ fontSize: 11, color: "#64748b" }}>{medicine.packSize}</Text>
                            {medicine.prescriptionRequired && (
                              <View style={{ backgroundColor: "#fee2e2", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                <Text style={{ fontSize: 9, color: "#dc2626", fontWeight: "700" }}>Rx REQUIRED</Text>
                              </View>
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

      <CustomAlert
        visible={orderAlert.visible}
        type="success"
        title={orderAlert.title}
        message={orderAlert.message}
        onClose={() => setOrderAlert({ ...orderAlert, visible: false })}
        primaryButtonText="Done"
      />
    </View>
  );
}
