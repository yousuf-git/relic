// A single month, large enough to tap a day. Pinch inward to return to the year.
import { useMemo } from "react";
import { Pressable as RNPressable, StyleSheet, View } from "react-native";
import { GestureDetector, usePinchGesture } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";
import Animated from "react-native-reanimated";
import { haptic } from "@/design/haptics";
import { color, radius, space } from "@/design/tokens";
import { Text } from "@/ui/Text";
import { lampLevel, type DayEntry } from "./calendar-source";
import { monthMatrix, parseDate, toLocalDate } from "./dates";
import { LampField, type LampDot } from "./LampField";
import { formatLong } from "./text";
import { develop } from "./transitions";
import i18n from "@/i18n";

const PAD_X = space.xs;
const NUMBER_H = 20;
const CELL_H = 60;
const LAMP_SIZE = 32;
const PINCH_IN = 0.85;

type Props = {
  year: number;
  month: number;
  today: string;
  width: number;
  days: Map<string, DayEntry>;
  selected: string | null;
  onSelectDay: (date: string) => void;
  onZoomOut: () => void;
};

export function MonthGrid({ year, month, today, width, days, selected, onSelectDay, onZoomOut }: Props) {
  const { t } = useTranslation("ledger");
  const cellW = (width - PAD_X * 2) / 7;
  const weeks = useMemo(() => monthMatrix(year, month), [year, month]);
  const height = weeks.length * CELL_H;

  // 2024-01-01 is a Monday, so index 0 is Monday.
  const weekdays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => toLocalDate(`2024-01-0${i + 1}`).toLocaleDateString(i18n.language, { weekday: "narrow" })),
    [],
  );

  const lamps = useMemo(() => {
    const out: LampDot[] = [];
    weeks.forEach((week, r) =>
      week.forEach((date, c) => {
        if (!date) return;
        const entry = days.get(date);
        out.push({
          key: date,
          x: PAD_X + (c + 0.5) * cellW,
          y: r * CELL_H + NUMBER_H + (CELL_H - NUMBER_H) / 2,
          level: lampLevel(entry),
          mood: entry?.mood,
          today: date === today,
          future: date > today,
          selected: date === selected,
        });
      }),
    );
    return out;
  }, [weeks, days, today, selected, cellW]);

  const pinch = usePinchGesture({
    runOnJS: true,
    onDeactivate: (e) => {
      if (e.canceled || e.scale > PINCH_IN) return;
      haptic.select();
      onZoomOut();
    },
  });

  return (
    <View>
      <View style={[styles.weekdays, { paddingHorizontal: PAD_X }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {weekdays.map((w, i) => (
          <Text key={i} variant="label" style={{ width: cellW, textAlign: "center" }}>
            {w}
          </Text>
        ))}
      </View>
      <GestureDetector gesture={pinch}>
        <Animated.View entering={develop} style={{ width, height }}>
          <LampField width={width} height={height} lampSize={LAMP_SIZE} lamps={lamps} />
          {weeks.map((week, r) =>
            week.map((date, c) => {
              if (!date) return null;
              const entry = days.get(date);
              const count = entry?.count ?? 0;
              const full = formatLong(date, { weekday: "long", day: "numeric", month: "long" });
              const isToday = date === today;
              return (
                <RNPressable
                  key={date}
                  accessibilityRole="button"
                  accessibilityLabel={
                    isToday
                      ? t("day.labelToday", { date: full })
                      : count > 0
                        ? t("day.label", { date: full, count })
                        : t("day.labelEmpty", { date: full })
                  }
                  accessibilityHint={t("day.hint")}
                  accessibilityState={{ selected: date === selected }}
                  onPress={() => {
                    haptic.select();
                    onSelectDay(date);
                  }}
                  style={({ pressed }) => [
                    styles.cell,
                    { left: PAD_X + c * cellW, top: r * CELL_H, width: cellW, height: CELL_H },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text variant="catalog" style={[styles.number, isToday && { color: color.lamp }, date > today && { color: color.faint }]}>
                    {parseDate(date).d}
                  </Text>
                </RNPressable>
              );
            }),
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  weekdays: { flexDirection: "row", paddingBottom: space.xs },
  cell: { position: "absolute", alignItems: "center", borderRadius: radius.md },
  pressed: { backgroundColor: color.stone },
  number: { height: NUMBER_H, lineHeight: NUMBER_H, textAlign: "center" },
});
