// The year as twelve small calendars of lamps. Tap a month, or pinch outward
// over it, to look closer.
import { useMemo } from "react";
import { Pressable as RNPressable, StyleSheet, View } from "react-native";
import { GestureDetector, usePinchGesture } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";
import Animated from "react-native-reanimated";
import { haptic } from "@/design/haptics";
import { color, radius, space } from "@/design/tokens";
import { Text } from "@/ui/Text";
import { lampLevel, type DayEntry } from "./calendar-source";
import { monthMatrix } from "./dates";
import { LampField, type LampDot } from "./LampField";
import { monthName } from "./text";
import { develop } from "./transitions";

const COLUMNS = 3;
const ROWS = 4;
const PAD_X = space.md;
const GAP_X = space.md;
const GAP_Y = space.sm;
const LABEL_H = 28;
const PINCH_OUT = 1.15;

export function yearMetrics(width: number) {
  const blockW = (width - PAD_X * 2 - GAP_X * (COLUMNS - 1)) / COLUMNS;
  const cell = blockW / 7;
  const blockH = LABEL_H + cell * 6;
  return { blockW, blockH, cell, height: ROWS * blockH + (ROWS - 1) * GAP_Y };
}

const origin = (month: number, m: ReturnType<typeof yearMetrics>) => ({
  x: PAD_X + ((month - 1) % COLUMNS) * (m.blockW + GAP_X),
  y: Math.floor((month - 1) / COLUMNS) * (m.blockH + GAP_Y),
});

type Props = {
  year: number;
  today: string;
  width: number;
  days: Map<string, DayEntry>;
  onOpenMonth: (month: number) => void;
};

export function YearWall({ year, today, width, days, onOpenMonth }: Props) {
  const { t } = useTranslation("ledger");
  const metrics = useMemo(() => yearMetrics(width), [width]);

  const lamps = useMemo(() => {
    const out: LampDot[] = [];
    for (let month = 1; month <= 12; month++) {
      const o = origin(month, metrics);
      monthMatrix(year, month).forEach((week, r) =>
        week.forEach((date, c) => {
          if (!date) return;
          const entry = days.get(date);
          out.push({
            key: date,
            x: o.x + (c + 0.5) * metrics.cell,
            y: o.y + LABEL_H + (r + 0.5) * metrics.cell,
            level: lampLevel(entry),
            mood: entry?.mood,
            today: date === today,
            future: date > today,
          });
        }),
      );
    }
    return out;
  }, [year, days, today, metrics]);

  const pinch = usePinchGesture({
    runOnJS: true,
    onDeactivate: (e) => {
      if (e.canceled || e.scale < PINCH_OUT) return;
      const col = Math.min(COLUMNS - 1, Math.max(0, Math.floor((e.focalX - PAD_X) / (metrics.blockW + GAP_X))));
      const row = Math.min(ROWS - 1, Math.max(0, Math.floor(e.focalY / (metrics.blockH + GAP_Y))));
      haptic.select();
      onOpenMonth(row * COLUMNS + col + 1);
    },
  });

  return (
    <GestureDetector gesture={pinch}>
      <Animated.View entering={develop} style={{ width, height: metrics.height }}>
        <LampField width={width} height={metrics.height} lampSize={metrics.cell} lamps={lamps} />
        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
          const o = origin(month, metrics);
          const count = monthMatrix(year, month)
            .flat()
            .reduce((sum, date) => sum + (date ? (days.get(date)?.count ?? 0) : 0), 0);
          const name = monthName(year, month);
          return (
            <RNPressable
              key={month}
              accessibilityRole="button"
              accessibilityLabel={count > 0 ? t("wall.monthLabel", { month: name, year, count }) : t("wall.monthLabelEmpty", { month: name, year })}
              accessibilityHint={t("wall.monthHint")}
              onPress={() => {
                haptic.select();
                onOpenMonth(month);
              }}
              style={({ pressed }) => [
                styles.block,
                { left: o.x - space.xxs, top: o.y, width: metrics.blockW + space.xs, height: metrics.blockH },
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.label}>
                <Text variant="catalog" style={{ color: color.paper }}>
                  {monthName(year, month, "short").toUpperCase()}
                </Text>
                {count > 0 ? <Text variant="catalog">{count}</Text> : null}
              </View>
            </RNPressable>
          );
        })}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  block: { position: "absolute", borderRadius: radius.md, paddingHorizontal: space.xxs },
  pressed: { backgroundColor: color.stone },
  label: { height: LABEL_H, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: space.xxs },
});
