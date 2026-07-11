import { useState, useRef, useEffect } from "react";
import {
  View, Text, ScrollView, Dimensions,
  type NativeSyntheticEvent, type NativeScrollEvent,
} from "react-native";
import { fetchTestimonials } from "../api/contentApi";

const { width: SCREEN_W } = Dimensions.get("window");

type Testimonial = {
  name: string;
  role: string;
  avatar: string;
  quote: string;
  accent: string;
  bg: string;
};

// Used until the API responds (and as a fallback if it fails).
const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    name: "Rahul Sharma", role: "Mumbai", avatar: "👨",
    quote: "Excellent service, got connected to a doctor within minutes! The whole process was seamless.",
    accent: "#2563eb", bg: "#dbeafe",
  },
  {
    name: "Priya Patel", role: "Ahmedabad", avatar: "👩",
    quote: "Ordered medicines at midnight and they arrived in 27 minutes. An absolute lifesaver!",
    accent: "#16a34a", bg: "#dcfce7",
  },
  {
    name: "Amit Kumar", role: "Delhi", avatar: "🧑",
    quote: "Booked a home nurse for my father. Professional, punctual and genuinely caring staff.",
    accent: "#FF6B35", bg: "#ffedd5",
  },
  {
    name: "Sneha Reddy", role: "Hyderabad", avatar: "👩‍🦰",
    quote: "The ambulance arrived incredibly fast during an emergency. I can't recommend them enough.",
    accent: "#7c3aed", bg: "#ede9fe",
  },
];

export default function TestimonialsCarousel() {
  const [index, setIndex] = useState(0);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(DEFAULT_TESTIMONIALS);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetchTestimonials().then((data) => {
      if (data.length > 0) {
        setTestimonials(data.map((t) => ({
          name: t.name, role: t.role, avatar: t.avatar,
          quote: t.quote, accent: t.accent, bg: t.bg,
        })));
        setIndex(0);
      }
    });
  }, []);

  // Auto-advance every 4s
  useEffect(() => {
    if (testimonials.length === 0) return;
    const timer = setInterval(() => {
      const next = (index + 1) % testimonials.length;
      scrollRef.current?.scrollTo({ x: next * SCREEN_W, animated: true });
      setIndex(next);
    }, 4000);
    return () => clearInterval(timer);
  }, [index, testimonials]);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (newIndex !== index) setIndex(newIndex);
  };

  return (
    <View style={{ paddingVertical: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: "700", color: "#0f172a", textAlign: "center", marginBottom: 20 }}>
        What Our Users Say
      </Text>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
      >
        {testimonials.map((t, i) => (
          <View key={i} style={{ width: SCREEN_W, paddingHorizontal: 20 }}>
            <View style={{
              backgroundColor: t.bg,
              borderRadius: 20,
              padding: 22,
            }}>
              {/* Quote mark */}
              <Text style={{ fontSize: 44, lineHeight: 44, color: t.accent, fontWeight: "800", marginBottom: -8 }}>
                “
              </Text>
              <Text style={{ fontSize: 15, color: "#1e293b", lineHeight: 22, fontWeight: "500", marginBottom: 18 }}>
                {t.quote}
              </Text>

              {/* 5 stars */}
              <Text style={{ fontSize: 13, marginBottom: 14 }}>⭐️⭐️⭐️⭐️⭐️</Text>

              {/* Author */}
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: "#ffffff",
                  alignItems: "center", justifyContent: "center",
                  marginRight: 12,
                }}>
                  <Text style={{ fontSize: 24 }}>{t.avatar}</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#0f172a" }}>{t.name}</Text>
                  <Text style={{ fontSize: 12, color: t.accent, fontWeight: "600" }}>📍 {t.role}</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Pagination dots */}
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 18 }}>
        {testimonials.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === index ? 22 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: i === index ? "#FF6B35" : "#cbd5e1",
            }}
          />
        ))}
      </View>
    </View>
  );
}
