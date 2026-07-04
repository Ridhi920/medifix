import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const FULL_WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

type DatePickerModalProps = {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSelect: (dateStr: string) => void; // DD/MM/YYYY
  readonly selectedDate?: string; // DD/MM/YYYY
  readonly allowedWeekdays?: readonly string[]; // e.g. ["Monday", "Wednesday"] — only these weekdays selectable
};

function parseDate(str?: string): Date | null {
  if (!str) return null;
  const parts = str.split("/");
  if (parts.length !== 3) return null;
  const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  d.setHours(0, 0, 0, 0);
  return isNaN(d.getTime()) ? null : d;
}

export default function DatePickerModal({ visible, onClose, onSelect, selectedDate, allowedWeekdays }: Readonly<DatePickerModalProps>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isAllowedWeekday = (day: number) => {
    if (!allowedWeekdays || allowedWeekdays.length === 0) return true;
    const weekday = FULL_WEEKDAYS[new Date(viewYear, viewMonth, day).getDay()];
    return allowedWeekdays.includes(weekday);
  };

  const selected = parseDate(selectedDate);

  const [viewYear, setViewYear] = useState(() => selected?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => selected?.getMonth() ?? today.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const handleDay = (day: number) => {
    const date = new Date(viewYear, viewMonth, day);
    date.setHours(0, 0, 0, 0);
    if (date < today) return;
    if (!isAllowedWeekday(day)) return;
    const dd = String(day).padStart(2, "0");
    const mm = String(viewMonth + 1).padStart(2, "0");
    onSelect(`${dd}/${mm}/${viewYear}`);
    onClose();
  };

  const isSelected = (day: number) =>
    selected?.getFullYear() === viewYear &&
    selected?.getMonth() === viewMonth &&
    selected?.getDate() === day;

  const isPast = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    return d < today;
  };

  const isToday = (day: number) =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === day;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const rows = cells.length / 7;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }}
        onPress={onClose}
      >
        <Pressable
          style={{ backgroundColor: "#ffffff", borderRadius: 20, padding: 20, width: 320 }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Month navigation */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <Pressable onPress={handlePrevMonth} style={{ padding: 8, borderRadius: 8, backgroundColor: "#f1f5f9" }}>
              <Text style={{ fontSize: 16, color: "#0f172a", fontWeight: "700" }}>‹</Text>
            </Pressable>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#0f172a" }}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>
            <Pressable onPress={handleNextMonth} style={{ padding: 8, borderRadius: 8, backgroundColor: "#f1f5f9" }}>
              <Text style={{ fontSize: 16, color: "#0f172a", fontWeight: "700" }}>›</Text>
            </Pressable>
          </View>

          {/* Day-of-week headers */}
          <View style={{ flexDirection: "row", marginBottom: 8 }}>
            {DAY_LABELS.map(d => (
              <View key={d} style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: "#94a3b8" }}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          {Array.from({ length: rows }, (_, row) => (
            <View key={row} style={{ flexDirection: "row", marginBottom: 4 }}>
              {cells.slice(row * 7, row * 7 + 7).map((day, col) => (
                <Pressable
                  key={col}
                  onPress={() => day !== null && handleDay(day)}
                  disabled={day === null || isPast(day) || !isAllowedWeekday(day)}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: day !== null && isSelected(day) ? "#FF6B35" : "transparent",
                  }}
                >
                  <Text style={{
                    fontSize: 14,
                    fontWeight: day !== null && (isSelected(day) || isToday(day)) ? "700" : "400",
                    color: day === null
                      ? "transparent"
                      : isSelected(day) ? "#ffffff"
                      : (isPast(day) || !isAllowedWeekday(day)) ? "#cbd5e1"
                      : isToday(day) ? "#FF6B35"
                      : "#0f172a"
                  }}>
                    {day ?? ""}
                  </Text>
                  {day !== null && isToday(day) && !isSelected(day) && isAllowedWeekday(day) && (
                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: "#FF6B35", marginTop: 2 }} />
                  )}
                </Pressable>
              ))}
            </View>
          ))}

          <Pressable
            onPress={onClose}
            style={{ marginTop: 12, alignItems: "center", paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#f1f5f9" }}
          >
            <Text style={{ fontSize: 14, color: "#64748b", fontWeight: "600" }}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
