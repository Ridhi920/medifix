import { useState, useEffect, useCallback } from "react";
import {
  View, Text, Pressable, ScrollView, ActivityIndicator, Alert, Image,
} from "react-native";
import { styles } from "../../styles";
import { pharmacyApi, type MedicineOrder, type PrescriptionSubmission } from "../../api/pharmacyApi";

type Props = { readonly onBack: () => void };
type Tab = "orders" | "prescriptions";

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; emoji: string }> = {
  pending:          { label: "Pending",         bg: "#fff7ed", color: "#ea580c", emoji: "🕐" },
  confirmed:        { label: "Confirmed",        bg: "#eff6ff", color: "#2563eb", emoji: "✅" },
  preparing:        { label: "Preparing",        bg: "#f5f3ff", color: "#7c3aed", emoji: "👨‍🍳" },
  out_for_delivery: { label: "Out for Delivery", bg: "#ecfdf5", color: "#059669", emoji: "🛵" },
  delivered:        { label: "Delivered",        bg: "#f0fdf4", color: "#16a34a", emoji: "📦" },
  cancelled:        { label: "Cancelled",        bg: "#fef2f2", color: "#dc2626", emoji: "✕"  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function OrderHistoryScreen({ onBack }: Props) {
  const [tab, setTab] = useState<Tab>("orders");

  const [orders, setOrders] = useState<MedicineOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);

  const [prescriptions, setPrescriptions] = useState<PrescriptionSubmission[]>([]);
  const [rxLoading, setRxLoading] = useState(true);
  const [expandedRxId, setExpandedRxId] = useState<number | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      setOrders(await pharmacyApi.getMyOrders());
    } catch { /* empty state */ } finally { setOrdersLoading(false); }
  }, []);

  const loadPrescriptions = useCallback(async () => {
    try {
      setRxLoading(true);
      setPrescriptions(await pharmacyApi.getMyPrescriptions());
    } catch { /* empty state */ } finally { setRxLoading(false); }
  }, []);

  useEffect(() => { loadOrders(); loadPrescriptions(); }, [loadOrders, loadPrescriptions]);

  const handleCancel = (order: MedicineOrder) => {
    Alert.alert(
      "Cancel Order",
      `Cancel order #${order.id}? This cannot be undone.`,
      [
        { text: "Keep Order", style: "cancel" },
        {
          text: "Yes, Cancel", style: "destructive",
          onPress: async () => {
            setCancelling(order.id);
            try {
              const updated = await pharmacyApi.cancelOrder(order.id);
              setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
            } catch {
              Alert.alert("Error", "Could not cancel the order. Please try again.");
            } finally { setCancelling(null); }
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.homeScroll}>
      <View style={styles.serviceScreenCard}>

        {/* ── Header ── */}
        <View style={styles.serviceHeaderRow}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <View style={styles.backIcon} />
          </Pressable>
          <Text style={styles.serviceHeaderTitle}>Orders & Prescriptions</Text>
        </View>

        {/* ── Tabs ── */}
        <View style={{
          flexDirection: "row",
          backgroundColor: "#f1f5f9",
          borderRadius: 12,
          padding: 4,
          marginBottom: 20,
        }}>
          {([
            { id: "orders",        label: "📦  Orders"        },
            { id: "prescriptions", label: "📋  Prescriptions" },
          ] as { id: Tab; label: string }[]).map(t => (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 10,
                alignItems: "center",
                backgroundColor: tab === t.id ? "#FF6B35" : "transparent",
              }}
            >
              <Text style={{
                fontSize: 13, fontWeight: "700",
                color: tab === t.id ? "#fff" : "#64748b",
              }}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ══════════════ ORDERS TAB ══════════════ */}
        {tab === "orders" && (
          ordersLoading ? (
            <View style={{ alignItems: "center", paddingVertical: 60 }}>
              <ActivityIndicator size="large" color="#FF6B35" />
              <Text style={{ fontSize: 14, color: "#94a3b8", marginTop: 12 }}>
                Fetching your orders…
              </Text>
            </View>
          ) : orders.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 60 }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>📦</Text>
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#0f172a", marginBottom: 6 }}>
                No Orders Yet
              </Text>
              <Text style={{ fontSize: 14, color: "#94a3b8", textAlign: "center" }}>
                Your pharmacy orders will appear here once you place one.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {orders.map(order => {
                const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
                const isExpanded = expandedOrderId === order.id;

                return (
                  <View key={order.id} style={{
                    backgroundColor: "#fff", borderRadius: 16,
                    borderWidth: 1, borderColor: "#e2e8f0", overflow: "hidden",
                  }}>
                    <Pressable
                      onPress={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      style={{ padding: 16, flexDirection: "row", alignItems: "center" }}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <Text style={{ fontSize: 14, fontWeight: "700", color: "#0f172a" }}>
                            Order #{order.id}
                          </Text>
                          <View style={{ backgroundColor: cfg.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                            <Text style={{ fontSize: 10, fontWeight: "700", color: cfg.color }}>
                              {cfg.emoji} {cfg.label}
                            </Text>
                          </View>
                        </View>
                        {order.store_name ? (
                          <Text style={{ fontSize: 12, fontWeight: "600", color: "#0f172a", marginBottom: 2 }} numberOfLines={1}>
                            🏪 {order.store_name}
                          </Text>
                        ) : null}
                        <Text style={{ fontSize: 12, color: "#64748b" }}>
                          {formatDate(order.created_at)}
                        </Text>
                        <Text style={{ fontSize: 13, fontWeight: "600", color: "#FF6B35", marginTop: 4 }}>
                          ₹{order.total_amount}  ·  {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 14, color: "#94a3b8", marginLeft: 8 }}>
                        {isExpanded ? "▲" : "▼"}
                      </Text>
                    </Pressable>

                    {isExpanded && (
                      <View style={{ borderTopWidth: 1, borderTopColor: "#f1f5f9", padding: 16 }}>
                        <Text style={{ fontSize: 13, fontWeight: "700", color: "#0f172a", marginBottom: 8 }}>
                          Items Ordered
                        </Text>
                        {order.items.map((item, idx) => (
                          <View key={idx} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                            <Text style={{ fontSize: 13, color: "#334155", flex: 1 }}>
                              {item.medicine_name} × {item.quantity}
                            </Text>
                            <Text style={{ fontSize: 13, fontWeight: "600", color: "#0f172a" }}>
                              ₹{item.price * item.quantity}
                            </Text>
                          </View>
                        ))}

                        <View style={{ backgroundColor: "#f8fafc", borderRadius: 10, padding: 12, marginTop: 10 }}>
                          <Text style={{ fontSize: 11, fontWeight: "700", color: "#94a3b8", marginBottom: 4 }}>
                            DELIVERY ADDRESS
                          </Text>
                          <Text style={{ fontSize: 13, color: "#334155" }}>{order.delivery_address}</Text>
                        </View>

                        {order.notes && (
                          <View style={{ backgroundColor: "#fff7ed", borderRadius: 10, padding: 12, marginTop: 8 }}>
                            <Text style={{ fontSize: 11, fontWeight: "700", color: "#ea580c", marginBottom: 4 }}>NOTE</Text>
                            <Text style={{ fontSize: 13, color: "#334155" }}>{order.notes}</Text>
                          </View>
                        )}

                        {order.status === "pending" && (
                          <Pressable
                            onPress={() => handleCancel(order)}
                            disabled={cancelling === order.id}
                            style={{
                              marginTop: 14, borderWidth: 1.5, borderColor: "#dc2626",
                              borderRadius: 12, paddingVertical: 12, alignItems: "center",
                            }}
                          >
                            {cancelling === order.id
                              ? <ActivityIndicator size="small" color="#dc2626" />
                              : <Text style={{ fontSize: 14, fontWeight: "700", color: "#dc2626" }}>Cancel Order</Text>
                            }
                          </Pressable>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )
        )}

        {/* ══════════════ PRESCRIPTIONS TAB ══════════════ */}
        {tab === "prescriptions" && (
          rxLoading ? (
            <View style={{ alignItems: "center", paddingVertical: 60 }}>
              <ActivityIndicator size="large" color="#FF6B35" />
              <Text style={{ fontSize: 14, color: "#94a3b8", marginTop: 12 }}>
                Loading prescriptions…
              </Text>
            </View>
          ) : prescriptions.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 60 }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>📋</Text>
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#0f172a", marginBottom: 6 }}>
                No Prescriptions Yet
              </Text>
              <Text style={{ fontSize: 14, color: "#94a3b8", textAlign: "center" }}>
                Prescriptions you upload during checkout will appear here.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {prescriptions.map(rx => {
                const isReviewed = rx.status === "reviewed";
                const isExpanded = expandedRxId === rx.id;

                return (
                  <View key={rx.id} style={{
                    backgroundColor: "#fff", borderRadius: 16,
                    borderWidth: 1, borderColor: "#e2e8f0", overflow: "hidden",
                  }}>
                    <Pressable
                      onPress={() => setExpandedRxId(isExpanded ? null : rx.id)}
                      style={{ padding: 16, flexDirection: "row", alignItems: "center" }}
                    >
                      {/* Thumbnail */}
                      <View style={{
                        width: 50, height: 50, borderRadius: 10,
                        backgroundColor: "#f8fafc", overflow: "hidden",
                        marginRight: 14, alignItems: "center", justifyContent: "center",
                      }}>
                        {rx.image_data
                          ? <Image source={{ uri: rx.image_data }} style={{ width: 50, height: 50 }} resizeMode="cover" />
                          : <Text style={{ fontSize: 22 }}>📋</Text>
                        }
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

                    {isExpanded && (
                      <View style={{ borderTopWidth: 1, borderTopColor: "#f1f5f9", padding: 16 }}>
                        {rx.image_data && (
                          <Image
                            source={{ uri: rx.image_data }}
                            style={{ width: "100%", height: 220, borderRadius: 12, backgroundColor: "#f8fafc", marginBottom: 14 }}
                            resizeMode="contain"
                          />
                        )}

                        <View style={{
                          backgroundColor: isReviewed ? "#f0fdf4" : "#fff7ed",
                          borderRadius: 12, padding: 14,
                        }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                            <Text style={{ fontSize: 20 }}>{isReviewed ? "✅" : "🕐"}</Text>
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
                            <View style={{ borderTopWidth: 1, borderTopColor: "#bbf7d0", paddingTop: 10, marginTop: 10 }}>
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
          )
        )}

      </View>
    </ScrollView>
  );
}
