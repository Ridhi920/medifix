import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

const TIME_SLOTS = [
  "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM",
  "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
  "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM",
  "08:00 PM",
];

type TimePickerDropdownProps = {
  readonly value: string;
  readonly onChange: (time: string) => void;
  readonly hasError?: boolean;
};

export default function TimePickerDropdown({ value, onChange, hasError }: Readonly<TimePickerDropdownProps>) {
  const [open, setOpen] = useState(false);

  return (
    <View style={{ marginBottom: 16 }}>
      <Pressable
        onPress={() => setOpen(prev => !prev)}
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderWidth: 1,
          borderColor: hasError ? "#ef4444" : open ? "#FF6B35" : "#e2e8f0",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 14, color: value ? "#0f172a" : "#94a3b8" }}>
          {value || "Select time slot"}
        </Text>
        <Text style={{ fontSize: 11, color: "#64748b" }}>{open ? "▲" : "▼"}</Text>
      </Pressable>

      {open && (
        <View style={{
          backgroundColor: "#ffffff",
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#e2e8f0",
          marginTop: 4,
          maxHeight: 200,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}>
          <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
            {TIME_SLOTS.map(slot => (
              <Pressable
                key={slot}
                onPress={() => { onChange(slot); setOpen(false); }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: "#f1f5f9",
                  backgroundColor: value === slot ? "#fff4ef" : "transparent",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{
                  fontSize: 14,
                  color: value === slot ? "#FF6B35" : "#0f172a",
                  fontWeight: value === slot ? "600" : "400",
                }}>
                  {slot}
                </Text>
                {value === slot && (
                  <Text style={{ fontSize: 12, color: "#FF6B35" }}>✓</Text>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
