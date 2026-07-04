import { useState } from "react";
import {
  View, Text, Pressable, ScrollView, Modal,
  KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { KITS, type Kit } from "../data/kits";

export default function KitsSection() {
  const [selectedKit, setSelectedKit] = useState<Kit | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notified, setNotified] = useState<Set<string>>(new Set());
  const [requested, setRequested] = useState<Set<string>>(new Set());

  const handleNotify = (kit: Kit) => {
    setNotified(prev => new Set([...prev, kit.id]));
    Alert.alert(
      "You're on the list! 🔔",
      `We'll notify you as soon as the ${kit.name} is available.`,
      [{ text: "Great!" }]
    );
  };

  const handleRequest = (kit: Kit) => {
    setRequested(prev => new Set([...prev, kit.id]));
    Alert.alert(
      "Request Received! 📋",
      `Your request for the ${kit.name} has been noted. Our team will reach out soon.`,
      [{ text: "Thanks!" }]
    );
  };

  const otherKits = selectedKit ? KITS.filter(k => k.id !== selectedKit.id) : [];

  return (
    <>
      {/* ── Section header ── */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, marginTop: 24 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#0f172a" }}>
            Curated Health Kits
          </Text>
          <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 1 }}>
            Everything you need, bundled together
          </Text>
        </View>
        <View style={{
          backgroundColor: "#FF6B35", paddingHorizontal: 8, paddingVertical: 3,
          borderRadius: 6,
        }}>
          <Text style={{ fontSize: 9, fontWeight: "800", color: "#fff", letterSpacing: 0.5 }}>
            LAUNCHING SOON
          </Text>
        </View>
      </View>

      {/* ── Horizontal kit cards ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingRight: 4, paddingBottom: 4 }}
      >
        {KITS.map(kit => (
          <Pressable
            key={kit.id}
            onPress={() => { setSelectedKit(kit); setExpandedId(null); }}
            style={{
              width: 120,
              backgroundColor: kit.cardBg,
              borderRadius: 16,
              padding: 14,
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.06)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.07,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 30, marginBottom: 8 }}>{kit.emoji}</Text>
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#0f172a", lineHeight: 16 }}>
              {kit.name}
            </Text>
            <Text style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>
              {kit.essentials.length} items
            </Text>
            {notified.has(kit.id) && (
              <View style={{ marginTop: 6, backgroundColor: "#dcfce7", borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2, alignSelf: "flex-start" }}>
                <Text style={{ fontSize: 8, color: "#16a34a", fontWeight: "700" }}>NOTIFIED ✓</Text>
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>

      {/* ── Kit detail modal ── */}
      <Modal
        visible={selectedKit !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedKit(null)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.48)" }}
          onPress={() => setSelectedKit(null)}
        />
        <View style={{
          backgroundColor: "#fff",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: "88%",
        }}>
          {/* Handle */}
          <View style={{ width: 40, height: 4, backgroundColor: "#e2e8f0", borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 4 }} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 48 }}
          >
            {selectedKit && (
              <>
                {/* ── Selected kit detail ── */}
                <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
                  {/* Hero */}
                  <View style={{
                    backgroundColor: selectedKit.cardBg,
                    borderRadius: 20,
                    padding: 20,
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 20,
                  }}>
                    <Text style={{ fontSize: 54, marginRight: 16 }}>{selectedKit.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 19, fontWeight: "800", color: "#0f172a" }}>
                        {selectedKit.name}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
                        <View style={{ backgroundColor: "#FF6B35", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 }}>
                          <Text style={{ fontSize: 9, fontWeight: "800", color: "#fff" }}>COMING SOON</Text>
                        </View>
                        <Text style={{ fontSize: 11, color: "#64748b" }}>
                          {selectedKit.essentials.length} items included
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Essentials list */}
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#0f172a", marginBottom: 12 }}>
                    Essentials Included:
                  </Text>
                  <View style={{ gap: 10, marginBottom: 24 }}>
                    {selectedKit.essentials.map((item, idx) => (
                      <View key={idx} style={{ flexDirection: "row", alignItems: "center" }}>
                        <View style={{
                          width: 22, height: 22, borderRadius: 11,
                          backgroundColor: selectedKit.cardBg,
                          alignItems: "center", justifyContent: "center",
                          marginRight: 10,
                        }}>
                          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF6B35" }} />
                        </View>
                        <Text style={{ fontSize: 14, color: "#334155", flex: 1 }}>{item}</Text>
                      </View>
                    ))}
                  </View>

                  {/* CTA buttons */}
                  <Pressable
                    onPress={() => handleNotify(selectedKit)}
                    style={{
                      backgroundColor: notified.has(selectedKit.id) ? "#16a34a" : "#FF6B35",
                      borderRadius: 14, paddingVertical: 15, alignItems: "center", marginBottom: 10,
                    }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>
                      {notified.has(selectedKit.id) ? "✓ You'll be notified" : "🔔  Notify Me When Available"}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleRequest(selectedKit)}
                    style={{
                      borderWidth: 1.5,
                      borderColor: requested.has(selectedKit.id) ? "#64748b" : "#FF6B35",
                      borderRadius: 14, paddingVertical: 15, alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: "700", color: requested.has(selectedKit.id) ? "#64748b" : "#FF6B35" }}>
                      {requested.has(selectedKit.id) ? "✓ Request Sent" : "📋  Request This Kit"}
                    </Text>
                  </Pressable>
                </View>

                {/* ── Other kits accordion ── */}
                <View style={{ marginTop: 28 }}>
                  <View style={{ height: 1, backgroundColor: "#f1f5f9", marginBottom: 20 }} />
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#0f172a", paddingHorizontal: 24, marginBottom: 10 }}>
                    Other Kits
                  </Text>
                  {otherKits.map(kit => (
                    <View key={kit.id}>
                      {/* Accordion header */}
                      <Pressable
                        onPress={() => setExpandedId(expandedId === kit.id ? null : kit.id)}
                        style={{
                          flexDirection: "row", alignItems: "center",
                          paddingHorizontal: 24, paddingVertical: 12,
                          borderBottomWidth: 1, borderBottomColor: "#f8fafc",
                        }}
                      >
                        <View style={{
                          width: 40, height: 40, borderRadius: 12,
                          backgroundColor: kit.cardBg,
                          alignItems: "center", justifyContent: "center",
                          marginRight: 12,
                        }}>
                          <Text style={{ fontSize: 20 }}>{kit.emoji}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: "600", color: "#0f172a" }}>
                            {kit.name}
                          </Text>
                          <Text style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
                            {kit.essentials.length} items
                          </Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          {notified.has(kit.id) && (
                            <View style={{ backgroundColor: "#dcfce7", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
                              <Text style={{ fontSize: 8, color: "#16a34a", fontWeight: "700" }}>✓ NOTIFIED</Text>
                            </View>
                          )}
                          <Text style={{ fontSize: 16, color: "#94a3b8" }}>
                            {expandedId === kit.id ? "▲" : "▼"}
                          </Text>
                        </View>
                      </Pressable>

                      {/* Accordion body */}
                      {expandedId === kit.id && (
                        <View style={{ backgroundColor: kit.cardBg, paddingHorizontal: 24, paddingVertical: 16 }}>
                          <View style={{ gap: 8, marginBottom: 14 }}>
                            {kit.essentials.map((item, idx) => (
                              <View key={idx} style={{ flexDirection: "row", alignItems: "center" }}>
                                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#FF6B35", marginRight: 10 }} />
                                <Text style={{ fontSize: 13, color: "#334155" }}>{item}</Text>
                              </View>
                            ))}
                          </View>
                          <View style={{ flexDirection: "row", gap: 10 }}>
                            <Pressable
                              onPress={() => handleNotify(kit)}
                              style={{
                                flex: 1, backgroundColor: notified.has(kit.id) ? "#16a34a" : "#FF6B35",
                                borderRadius: 10, paddingVertical: 10, alignItems: "center",
                              }}
                            >
                              <Text style={{ fontSize: 12, fontWeight: "700", color: "#fff" }}>
                                {notified.has(kit.id) ? "✓ Notified" : "🔔 Notify Me"}
                              </Text>
                            </Pressable>
                            <Pressable
                              onPress={() => handleRequest(kit)}
                              style={{
                                flex: 1, borderWidth: 1.5,
                                borderColor: requested.has(kit.id) ? "#64748b" : "#FF6B35",
                                borderRadius: 10, paddingVertical: 10, alignItems: "center",
                              }}
                            >
                              <Text style={{ fontSize: 12, fontWeight: "700", color: requested.has(kit.id) ? "#64748b" : "#FF6B35" }}>
                                {requested.has(kit.id) ? "✓ Requested" : "📋 Request"}
                              </Text>
                            </Pressable>
                          </View>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}
