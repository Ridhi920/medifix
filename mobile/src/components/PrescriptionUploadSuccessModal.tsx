import { useState } from "react";
import { Modal, View, Text, Pressable } from "react-native";
import { styles } from "../styles";

type PrescriptionUploadSuccessModalProps = {
  readonly visible: boolean;
  readonly onCancel: () => void;
  readonly onCheckAvailability: (checkAvailability: boolean) => void;
};

export default function PrescriptionUploadSuccessModal({
  visible,
  onCancel,
  onCheckAvailability,
}: Readonly<PrescriptionUploadSuccessModalProps>) {
  const [checkAvailability, setCheckAvailability] = useState<boolean>(false);

  const handleContinue = () => {
    onCheckAvailability(checkAvailability);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={{
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20
      }}>
        <View style={{
          backgroundColor: "#ffffff",
          borderRadius: 16,
          padding: 24,
          alignItems: "center",
          width: "100%",
          maxWidth: 320,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5
        }}>
          {/* Success Icon */}
          <View style={{
            backgroundColor: "#f0fdf4",
            width: 70,
            height: 70,
            borderRadius: 35,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 16
          }}>
            <Text style={{ fontSize: 40 }}>✅</Text>
          </View>

          {/* Title */}
          <Text style={{
            fontSize: 18,
            fontWeight: "700",
            color: "#0f172a",
            marginBottom: 8,
            textAlign: "center"
          }}>
            Prescription Uploaded
          </Text>

          {/* Message */}
          <Text style={{
            fontSize: 14,
            color: "#64748b",
            marginBottom: 24,
            textAlign: "center",
            lineHeight: 20
          }}>
            Your prescription has been successfully uploaded and is now available for review in our admin panel.
          </Text>

          {/* Checkbox */}
          <Pressable
            onPress={() => setCheckAvailability(!checkAvailability)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
              paddingHorizontal: 12,
              backgroundColor: "#f8fafc",
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#e2e8f0",
              marginBottom: 24,
              width: "100%",
              alignSelf: "flex-start"
            }}
          >
            <View style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              borderWidth: 2,
              borderColor: checkAvailability ? "#FF6B35" : "#cbd5e1",
              backgroundColor: checkAvailability ? "#FF6B35" : "transparent",
              justifyContent: "center",
              alignItems: "center",
              marginRight: 12
            }}>
              {checkAvailability && (
                <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "700" }}>✓</Text>
              )}
            </View>
            <Text style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#0f172a",
              flex: 1
            }}>
              Check Medicine Availability
            </Text>
          </Pressable>

          {/* Buttons */}
          <View style={{
            flexDirection: "row",
            gap: 12,
            width: "100%"
          }}>
            <Pressable
              onPress={onCancel}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 8,
                borderWidth: 1.5,
                borderColor: "#e2e8f0",
                backgroundColor: "#f8fafc",
                alignItems: "center"
              }}
            >
              <Text style={{
                fontSize: 14,
                fontWeight: "700",
                color: "#64748b"
              }}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={handleContinue}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 8,
                backgroundColor: "#FF6B35",
                alignItems: "center",
                shadowColor: "#FF6B35",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 3
              }}
            >
              <Text style={{
                fontSize: 14,
                fontWeight: "700",
                color: "#ffffff"
              }}>
                Continue
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
