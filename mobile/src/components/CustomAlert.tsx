import React from "react";
import { Modal, View, Text, Pressable, StyleSheet } from "react-native";

type AlertType = "success" | "error" | "warning" | "info";

type CustomAlertProps = {
  visible: boolean;
  type?: AlertType;
  title: string;
  message: string;
  onClose: () => void;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onSecondaryPress?: () => void;
};

const ALERT_COLORS = {
  success: {
    bg: "#dcfce7",
    border: "#16a34a",
    icon: "✓",
    iconBg: "#16a34a",
    button: "#16a34a"
  },
  error: {
    bg: "#fee2e2",
    border: "#dc2626",
    icon: "✕",
    iconBg: "#dc2626",
    button: "#dc2626"
  },
  warning: {
    bg: "#fef3c7",
    border: "#f59e0b",
    icon: "⚠",
    iconBg: "#f59e0b",
    button: "#f59e0b"
  },
  info: {
    bg: "#dbeafe",
    border: "#3b82f6",
    icon: "ℹ",
    iconBg: "#3b82f6",
    button: "#FF6B35"
  }
};

export default function CustomAlert({
  visible,
  type = "info",
  title,
  message,
  onClose,
  primaryButtonText = "OK",
  secondaryButtonText,
  onSecondaryPress
}: CustomAlertProps) {
  const colors = ALERT_COLORS[type];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable 
        style={styles.overlay}
        onPress={onClose}
      >
        <Pressable 
          style={styles.modalContainer}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: colors.iconBg }]}>
            <Text style={styles.iconText}>{colors.icon}</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {secondaryButtonText && onSecondaryPress && (
              <Pressable
                style={[styles.button, styles.secondaryButton]}
                onPress={() => {
                  onSecondaryPress();
                  onClose();
                }}
              >
                <Text style={styles.secondaryButtonText}>
                  {secondaryButtonText}
                </Text>
              </Pressable>
            )}
            <Pressable
              style={[styles.button, styles.primaryButton, { backgroundColor: colors.button }]}
              onPress={onClose}
            >
              <Text style={styles.primaryButtonText}>{primaryButtonText}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  modalContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16
  },
  iconText: {
    fontSize: 32,
    color: "#ffffff",
    fontWeight: "700"
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 12,
    textAlign: "center"
  },
  message: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%"
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center"
  },
  primaryButton: {
    backgroundColor: "#FF6B35"
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff"
  },
  secondaryButton: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#475569"
  }
});
