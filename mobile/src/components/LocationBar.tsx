import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

interface LocationBarProps {
  locationName: string | null;
  loading: boolean;
  onRequestGPS: () => void;
  onSetManual: (name: string) => void;
}

// Ready for Google Maps Places Autocomplete — replace the manual TextInput
// with a Google Places Autocomplete input and call onSetManual + a location
// coordinate setter when the user picks a suggestion.
export default function LocationBar({
  locationName,
  loading,
  onRequestGPS,
  onSetManual,
}: LocationBarProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");

  const handleGPS = () => {
    onRequestGPS();
    setModalVisible(false);
  };

  const handleConfirm = () => {
    if (searchText.trim()) onSetManual(searchText.trim());
    setModalVisible(false);
    setSearchText("");
  };

  return (
    <>
      <Pressable
        onPress={() => setModalVisible(true)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#fff4ef",
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 9,
          marginBottom: 14,
          borderWidth: 1,
          borderColor: "#FFD5C2",
        }}
      >
        <Text style={{ fontSize: 15, marginRight: 6 }}>📍</Text>
        {loading ? (
          <ActivityIndicator size="small" color="#FF6B35" style={{ marginRight: 6 }} />
        ) : (
          <Text
            style={{ flex: 1, fontSize: 13, fontWeight: "600", color: "#FF6B35" }}
            numberOfLines={1}
          >
            {locationName ?? "Set your location"}
          </Text>
        )}
        <Text style={{ fontSize: 12, color: "#FF6B35", marginLeft: 4 }}>▾</Text>
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }}
          onPress={() => setModalVisible(false)}
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
          {/* Handle */}
          <View
            style={{
              width: 40,
              height: 4,
              backgroundColor: "#e2e8f0",
              borderRadius: 2,
              alignSelf: "center",
              marginBottom: 22,
            }}
          />

          <Text style={{ fontSize: 18, fontWeight: "700", color: "#0f172a", marginBottom: 4 }}>
            Set Location
          </Text>
          <Text style={{ fontSize: 13, color: "#64748b", marginBottom: 22 }}>
            Services near you will be shown first
          </Text>

          {/* Use Current Location (GPS) */}
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
              OR ENTER MANUALLY
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
            placeholder="Type area, city or address…"
            placeholderTextColor="#94a3b8"
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="done"
            onSubmitEditing={handleConfirm}
          />

          <Pressable
            onPress={handleConfirm}
            disabled={!searchText.trim()}
            style={{
              backgroundColor: searchText.trim() ? "#FF6B35" : "#e2e8f0",
              borderRadius: 12,
              paddingVertical: 15,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: searchText.trim() ? "#fff" : "#94a3b8",
              }}
            >
              Confirm Location
            </Text>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
