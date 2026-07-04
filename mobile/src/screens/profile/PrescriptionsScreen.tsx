import { useState, useEffect, useCallback } from "react";
import {
  View, Text, Pressable, ScrollView, ActivityIndicator, Image, Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { styles } from "../../styles";
import { pharmacyApi, type PrescriptionSubmission } from "../../api/pharmacyApi";

type Props = { readonly onBack: () => void };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function PrescriptionsScreen({ onBack }: Props) {
  const [prescriptions, setPrescriptions] = useState<PrescriptionSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await pharmacyApi.getMyPrescriptions();
      setPrescriptions(data);
    } catch {
      // show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      quality: 0.6,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const { uri, base64 } = result.assets[0];
    if (!base64) return;

    setUploading(true);
    try {
      const submitted = await pharmacyApi.submitPrescription(`data:image/jpeg;base64,${base64}`);
      setPrescriptions(prev => [submitted, ...prev]);
      Alert.alert("Uploaded! ✅", "Your prescription has been submitted for review. We'll update the status shortly.");
    } catch {
      Alert.alert("Upload Failed", "Could not upload the prescription. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Please allow camera access.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.6,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const { base64 } = result.assets[0];
    if (!base64) return;

    setUploading(true);
    try {
      const submitted = await pharmacyApi.submitPrescription(`data:image/jpeg;base64,${base64}`);
      setPrescriptions(prev => [submitted, ...prev]);
      Alert.alert("Uploaded! ✅", "Your prescription has been submitted for review.");
    } catch {
      Alert.alert("Upload Failed", "Could not upload the prescription. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.homeScroll}>
      <View style={styles.serviceScreenCard}>
        <View style={styles.serviceHeaderRow}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <View style={styles.backIcon} />
          </Pressable>
          <Text style={styles.serviceHeaderTitle}>My Prescriptions</Text>
        </View>

        {/* Upload buttons */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
          <Pressable
            onPress={handleCamera}
            disabled={uploading}
            style={{
              flex: 1, backgroundColor: "#FF6B35", borderRadius: 12,
              paddingVertical: 13, alignItems: "center", flexDirection: "row",
              justifyContent: "center", gap: 6,
            }}
          >
            <Text style={{ fontSize: 16 }}>📸</Text>
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>Take Photo</Text>
          </Pressable>
          <Pressable
            onPress={handleUpload}
            disabled={uploading}
            style={{
              flex: 1, borderWidth: 1.5, borderColor: "#FF6B35", borderRadius: 12,
              paddingVertical: 13, alignItems: "center", flexDirection: "row",
              justifyContent: "center", gap: 6,
            }}
          >
            <Text style={{ fontSize: 16 }}>🖼️</Text>
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#FF6B35" }}>From Gallery</Text>
          </Pressable>
        </View>

        {uploading && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16, backgroundColor: "#fff7ed", borderRadius: 10, padding: 12 }}>
            <ActivityIndicator size="small" color="#FF6B35" />
            <Text style={{ fontSize: 13, color: "#ea580c", fontWeight: "600" }}>Uploading prescription…</Text>
          </View>
        )}

        {/* List */}
        {loading ? (
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={{ fontSize: 14, color: "#94a3b8", marginTop: 12 }}>Loading prescriptions…</Text>
          </View>
        ) : prescriptions.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>📋</Text>
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#0f172a", marginBottom: 6 }}>
              No Prescriptions Yet
            </Text>
            <Text style={{ fontSize: 14, color: "#94a3b8", textAlign: "center" }}>
              Upload a prescription above and we'll review it for you.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {prescriptions.map(rx => {
              const isReviewed = rx.status === "reviewed";
              const isExpanded = expandedId === rx.id;

              return (
                <View
                  key={rx.id}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                    overflow: "hidden",
                  }}
                >
                  {/* Header */}
                  <Pressable
                    onPress={() => setExpandedId(isExpanded ? null : rx.id)}
                    style={{ padding: 16, flexDirection: "row", alignItems: "center" }}
                  >
                    {/* Thumbnail */}
                    <View style={{
                      width: 52, height: 52, borderRadius: 10,
                      backgroundColor: "#f8fafc", overflow: "hidden",
                      marginRight: 14, alignItems: "center", justifyContent: "center",
                    }}>
                      {rx.image_data ? (
                        <Image
                          source={{ uri: rx.image_data }}
                          style={{ width: 52, height: 52 }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={{ fontSize: 24 }}>📋</Text>
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <Text style={{ fontSize: 14, fontWeight: "700", color: "#0f172a" }}>
                          Prescription #{rx.id}
                        </Text>
                        <View style={{
                          backgroundColor: isReviewed ? "#f0fdf4" : "#fff7ed",
                          paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
                        }}>
                          <Text style={{ fontSize: 10, fontWeight: "700", color: isReviewed ? "#16a34a" : "#ea580c" }}>
                            {isReviewed ? "✓ Reviewed" : "🕐 Under Review"}
                          </Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 12, color: "#64748b" }}>{formatDate(rx.created_at)}</Text>
                    </View>
                    <Text style={{ fontSize: 14, color: "#94a3b8", marginLeft: 8 }}>
                      {isExpanded ? "▲" : "▼"}
                    </Text>
                  </Pressable>

                  {/* Expanded */}
                  {isExpanded && (
                    <View style={{ borderTopWidth: 1, borderTopColor: "#f1f5f9", padding: 16 }}>
                      {/* Full image */}
                      {rx.image_data && (
                        <Image
                          source={{ uri: rx.image_data }}
                          style={{
                            width: "100%", height: 220, borderRadius: 12,
                            backgroundColor: "#f8fafc", marginBottom: 14,
                          }}
                          resizeMode="contain"
                        />
                      )}

                      {/* Status detail */}
                      <View style={{
                        backgroundColor: isReviewed ? "#f0fdf4" : "#fff7ed",
                        borderRadius: 12, padding: 14,
                      }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: isReviewed && rx.admin_notes ? 8 : 0 }}>
                          <Text style={{ fontSize: 18 }}>{isReviewed ? "✅" : "🕐"}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, fontWeight: "700", color: isReviewed ? "#16a34a" : "#ea580c" }}>
                              {isReviewed ? "Reviewed by Pharmacist" : "Pending Review"}
                            </Text>
                            <Text style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                              {isReviewed
                                ? "Our pharmacist has reviewed your prescription."
                                : "Our pharmacist will review this shortly."}
                            </Text>
                          </View>
                        </View>

                        {isReviewed && rx.admin_notes && (
                          <View style={{ borderTopWidth: 1, borderTopColor: "#bbf7d0", paddingTop: 10, marginTop: 4 }}>
                            <Text style={{ fontSize: 11, fontWeight: "700", color: "#16a34a", marginBottom: 4 }}>
                              PHARMACIST NOTES
                            </Text>
                            <Text style={{ fontSize: 13, color: "#334155" }}>{rx.admin_notes}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
