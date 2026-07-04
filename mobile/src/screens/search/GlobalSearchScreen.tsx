import { useState, useEffect, useMemo } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Pressable, FlatList, Platform, StatusBar,
} from "react-native";
import { doctorAPI, dentistAPI } from "../../services/api";
import { nurseAPI, type Nurse } from "../../api/nurseApi";
import { physiotherapistAPI, type Physiotherapist } from "../../api/physiotherapistApi";
import { getLabTests, type LabTest } from "../../api/labTestApi";
import { ambulanceAPI, type Ambulance } from "../../api/ambulanceApi";
import { MEDICINES } from "../../data/medicines";
import { SERVICES } from "../../data/services";
import type { Doctor, Dentist } from "../../services/api";

type Category = "All" | "Services" | "Doctors" | "Dentists" | "Medicines" | "Lab Tests" | "Nurses" | "Physiotherapists" | "Ambulances";

type SearchResult = {
  id: string;
  category: Exclude<Category, "All">;
  title: string;
  subtitle: string;
  icon: string;
  actionKey: string;
};

const CATEGORIES: Category[] = [
  "All", "Doctors", "Dentists", "Medicines", "Lab Tests",
  "Nurses", "Physiotherapists", "Ambulances", "Services",
];

const CATEGORY_COLORS: Record<Exclude<Category, "All">, string> = {
  Services: "#6366f1",
  Doctors: "#0ea5e9",
  Dentists: "#14b8a6",
  Medicines: "#f59e0b",
  "Lab Tests": "#8b5cf6",
  Nurses: "#ec4899",
  Physiotherapists: "#10b981",
  Ambulances: "#ef4444",
};

type GlobalSearchScreenProps = {
  onBack: () => void;
  onOpenAppointments: () => void;
  onOpenDental: () => void;
  onOpenPharmacy: () => void;
  onOpenLab: () => void;
  onOpenNurse: () => void;
  onOpenPhysiotherapist: () => void;
  onOpenAmbulance: () => void;
};

export default function GlobalSearchScreen({
  onBack,
  onOpenAppointments,
  onOpenDental,
  onOpenPharmacy,
  onOpenLab,
  onOpenNurse,
  onOpenPhysiotherapist,
  onOpenAmbulance,
}: GlobalSearchScreenProps) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("All");
  const [loading, setLoading] = useState(true);

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [physios, setPhysios] = useState<Physiotherapist[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);

  useEffect(() => {
    Promise.allSettled([
      doctorAPI.getDoctors().then(setDoctors),
      dentistAPI.getDentists().then(setDentists),
      nurseAPI.getNurses().then(setNurses),
      physiotherapistAPI.getPhysiotherapists().then(setPhysios),
      getLabTests().then(setLabTests),
      ambulanceAPI.getAmbulances().then(setAmbulances),
    ]).finally(() => setLoading(false));
  }, []);

  const allResults: SearchResult[] = useMemo(() => {
    const results: SearchResult[] = [];

    SERVICES.forEach((s) =>
      results.push({
        id: `svc-${s.key}`,
        category: "Services",
        title: s.title,
        subtitle: s.summary,
        icon: serviceIcon(s.key),
        actionKey: s.key,
      })
    );

    MEDICINES.forEach((m) =>
      results.push({
        id: `med-${m.id}`,
        category: "Medicines",
        title: m.name,
        subtitle: `${m.category} · ₹${m.price}${m.prescriptionRequired ? " · Rx" : ""}`,
        icon: "💊",
        actionKey: "pharmacy",
      })
    );

    doctors.forEach((d) =>
      results.push({
        id: `doc-${d.id}`,
        category: "Doctors",
        title: `Dr. ${d.name}`,
        subtitle: `${d.specialty} · ₹${d.consultation_fee}`,
        icon: "🩺",
        actionKey: "appointments",
      })
    );

    dentists.forEach((d) =>
      results.push({
        id: `den-${d.id}`,
        category: "Dentists",
        title: `Dr. ${d.name}`,
        subtitle: `${d.specialty} · ₹${d.consultation_fee}`,
        icon: "🦷",
        actionKey: "dental",
      })
    );

    labTests.forEach((t) =>
      results.push({
        id: `lab-${t.id}`,
        category: "Lab Tests",
        title: t.name,
        subtitle: `${t.category} · ₹${t.price} · ${t.report_time}`,
        icon: "🔬",
        actionKey: "lab",
      })
    );

    nurses.forEach((n) =>
      results.push({
        id: `nur-${n.id}`,
        category: "Nurses",
        title: n.name,
        subtitle: `${n.specialization} · ${n.experience}y exp`,
        icon: "👩‍⚕️",
        actionKey: "nurse",
      })
    );

    physios.forEach((p) =>
      results.push({
        id: `phy-${p.id}`,
        category: "Physiotherapists",
        title: p.name,
        subtitle: `${p.specialization} · ${p.experience}y exp`,
        icon: "🏃",
        actionKey: "physiotherapist",
      })
    );

    ambulances.forEach((a) =>
      results.push({
        id: `amb-${a.id}`,
        category: "Ambulances",
        title: a.name,
        subtitle: `${a.ambulance_type} · ${a.estimated_time}`,
        icon: "🚑",
        actionKey: "ambulance",
      })
    );

    return results;
  }, [doctors, dentists, nurses, physios, labTests, ambulances]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allResults.filter((r) => {
      const matchesCategory = selectedCategory === "All" || r.category === selectedCategory;
      const matchesQuery =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.subtitle.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [allResults, query, selectedCategory]);

  const grouped = useMemo(() => {
    const map = new Map<string, SearchResult[]>();
    filtered.forEach((r) => {
      if (!map.has(r.category)) map.set(r.category, []);
      map.get(r.category)!.push(r);
    });
    return Array.from(map.entries());
  }, [filtered]);

  function handleResultPress(result: SearchResult) {
    switch (result.actionKey) {
      case "doctor":
      case "appointments": return onOpenAppointments();
      case "dental": return onOpenDental();
      case "pharmacy": return onOpenPharmacy();
      case "lab": return onOpenLab();
      case "nurse": return onOpenNurse();
      case "physiotherapist": return onOpenPhysiotherapist();
      case "ambulance": return onOpenAmbulance();
    }
  }

  const showEmpty = !loading && query.trim().length > 0 && filtered.length === 0;
  const showPrompt = !loading && query.trim().length === 0;

  const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44;

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc", paddingTop: topInset }}>
      {/* Header */}
      <View style={{
        flexDirection: "row", alignItems: "center", gap: 12,
        paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: "#ffffff",
        borderBottomWidth: 1, borderBottomColor: "#e2e8f0",
      }}>
        <Pressable
          onPress={onBack}
          style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: "#f1f5f9",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 18, color: "#0f172a" }}>←</Text>
        </Pressable>
        <View style={{
          flex: 1, flexDirection: "row", alignItems: "center",
          backgroundColor: "#f1f5f9", borderRadius: 14,
          paddingHorizontal: 12, paddingVertical: 8, gap: 8,
        }}>
          <Text style={{ fontSize: 16 }}>🔍</Text>
          <TextInput
            autoFocus
            placeholder="Search doctors, medicines, lab tests…"
            placeholderTextColor="#94a3b8"
            value={query}
            onChangeText={setQuery}
            style={{ flex: 1, fontSize: 15, color: "#0f172a" }}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")}>
              <Text style={{ fontSize: 16, color: "#94a3b8" }}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
        style={{ backgroundColor: "#ffffff", maxHeight: 52 }}
      >
        {CATEGORIES.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <Pressable
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={{
                paddingHorizontal: 14, paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: active ? "#FF6B35" : "#f1f5f9",
                borderWidth: 1,
                borderColor: active ? "#FF6B35" : "#e2e8f0",
              }}
            >
              <Text style={{
                fontSize: 13, fontWeight: "600",
                color: active ? "#ffffff" : "#64748b",
              }}>
                {cat}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Content */}
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={{ color: "#64748b", fontSize: 14 }}>Loading…</Text>
        </View>
      ) : showPrompt ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 40 }}>🔍</Text>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#0f172a" }}>Search MediFix</Text>
          <Text style={{ fontSize: 14, color: "#64748b", textAlign: "center" }}>
            Find doctors, medicines, lab tests, nurses, and more
          </Text>
        </View>
      ) : showEmpty ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 40 }}>😕</Text>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#0f172a" }}>No results found</Text>
          <Text style={{ fontSize: 14, color: "#64748b", textAlign: "center" }}>
            Try a different keyword or category
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          {grouped.map(([category, items]) => (
            <View key={category}>
              <View style={{
                flexDirection: "row", alignItems: "center", gap: 8,
                paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8,
              }}>
                <View style={{
                  width: 10, height: 10, borderRadius: 5,
                  backgroundColor: CATEGORY_COLORS[category as Exclude<Category, "All">],
                }} />
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {category}
                </Text>
                <Text style={{ fontSize: 12, color: "#94a3b8" }}>({items.length})</Text>
              </View>
              {items.map((result) => (
                <TouchableOpacity
                  key={result.id}
                  activeOpacity={0.7}
                  onPress={() => handleResultPress(result)}
                  style={{
                    flexDirection: "row", alignItems: "center", gap: 12,
                    marginHorizontal: 16, marginBottom: 8,
                    backgroundColor: "#ffffff",
                    borderRadius: 14, padding: 14,
                    borderWidth: 1, borderColor: "#f1f5f9",
                    shadowColor: "#0f172a", shadowOpacity: 0.04,
                    shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
                  }}
                >
                  <View style={{
                    width: 44, height: 44, borderRadius: 22,
                    backgroundColor: (CATEGORY_COLORS[result.category] ?? "#64748b") + "18",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <Text style={{ fontSize: 22 }}>{result.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "600", color: "#0f172a" }} numberOfLines={1}>
                      {result.title}
                    </Text>
                    <Text style={{ fontSize: 13, color: "#64748b", marginTop: 2 }} numberOfLines={1}>
                      {result.subtitle}
                    </Text>
                  </View>
                  <View style={{
                    paddingHorizontal: 8, paddingVertical: 3,
                    borderRadius: 8,
                    backgroundColor: (CATEGORY_COLORS[result.category] ?? "#64748b") + "18",
                  }}>
                    <Text style={{
                      fontSize: 11, fontWeight: "600",
                      color: CATEGORY_COLORS[result.category] ?? "#64748b",
                    }}>
                      {result.category}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function serviceIcon(key: string): string {
  const icons: Record<string, string> = {
    doctor: "🩺", dental: "🦷", ambulance: "🚑",
    lab: "🔬", nurse: "👩‍⚕️", physiotherapist: "🏃", pharmacy: "💊",
  };
  return icons[key] ?? "⚕️";
}
