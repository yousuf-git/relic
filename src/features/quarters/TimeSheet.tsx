// Time picker without a package: two snapping wheels (hour, minutes in fives) and
// four common hours as chips. Each wheel is an "adjustable" for screen readers.
import { useEffect, useRef, useState } from "react";
import { FlatList, Pressable as RNPressable, StyleSheet, View } from "react-native";
import { haptic } from "@/design/haptics";
import { useReducedMotion } from "@/design/motion";
import { color, minTarget, radius, space } from "@/design/tokens";
import { Button } from "@/ui/Button";
import { Pressable } from "@/ui/Pressable";
import { Text } from "@/ui/Text";
import { Sheet } from "./Sheet";
import { useQ } from "./strings";
import { EdgeFade } from "./ui";

const ITEM = minTarget;
const ROWS = 5;
const PAD = ITEM * Math.floor(ROWS / 2);
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

const pad = (n: number) => String(n).padStart(2, "0");
const snapToFive = (m: number) => (Math.round(m / 5) * 5) % 60;

function Wheel({ values, value, label, onChange }: { values: number[]; value: number; label: string; onChange: (v: number) => void }) {
  const listRef = useRef<FlatList<number>>(null);
  const reduced = useReducedMotion();
  const index = Math.max(0, values.indexOf(value));
  const settled = useRef(index);

  // Chips and screen-reader steps move the wheel; a finger settling it already did.
  useEffect(() => {
    if (settled.current === index) return;
    settled.current = index;
    listRef.current?.scrollToOffset({ offset: index * ITEM, animated: !reduced });
  }, [index, reduced]);

  const settle = (y: number) => {
    const i = Math.min(values.length - 1, Math.max(0, Math.round(y / ITEM)));
    settled.current = i;
    if (values[i] !== value) {
      haptic.select();
      onChange(values[i]);
    }
  };

  const step = (delta: number) => onChange(values[(index + delta + values.length) % values.length]);

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: pad(value) }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(e) => step(e.nativeEvent.actionName === "increment" ? 1 : -1)}
      style={styles.wheel}
    >
      <FlatList
        ref={listRef}
        data={values}
        keyExtractor={(v) => String(v)}
        getItemLayout={(_, i) => ({ length: ITEM, offset: ITEM * i, index: i })}
        initialScrollIndex={index}
        snapToInterval={ITEM}
        snapToAlignment="start"
        decelerationRate="fast"
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: PAD }}
        onMomentumScrollEnd={(e) => settle(e.nativeEvent.contentOffset.y)}
        onScrollEndDrag={(e) => {
          const v = e.nativeEvent.velocity?.y;
          if (v !== undefined && Math.abs(v) < 0.1) settle(e.nativeEvent.contentOffset.y);
        }}
        renderItem={({ item }) => (
          <RNPressable accessible={false} onPress={() => onChange(item)} style={styles.item}>
            <Text variant="heading" style={{ color: item === value ? color.paper : color.ash }}>
              {pad(item)}
            </Text>
          </RNPressable>
        )}
      />
      <EdgeFade edge="top" tint={color.stone} style={styles.fadeTop} />
      <EdgeFade edge="bottom" tint={color.stone} style={styles.fadeBottom} />
    </View>
  );
}

export function TimeSheet({ initial, onCancel, onSet }: { initial: string; onCancel: () => void; onSet: (time: string) => void }) {
  const { t } = useQ();
  const [h, m] = initial.split(":").map(Number);
  const [hour, setHour] = useState(h);
  const [minute, setMinute] = useState(snapToFive(m));
  const time = `${pad(hour)}:${pad(minute)}`;

  const presets = [
    { name: t("time.presetMorning"), time: "08:00" },
    { name: t("time.presetMidday"), time: "12:00" },
    { name: t("time.presetEvening"), time: "20:00" },
    { name: t("time.presetLate"), time: "22:00" },
  ];
  const choose = (preset: string) => {
    const [ph, pm] = preset.split(":").map(Number);
    setHour(ph);
    setMinute(pm);
  };

  return (
    <Sheet onClose={onCancel} closeLabel={t("time.title")}>
      <View style={styles.head}>
        <Text variant="heading" accessibilityRole="header">
          {t("time.title")}
        </Text>
        <Text variant="bodySmall">{t("time.body")}</Text>
      </View>

      <View style={styles.wheels}>
        <View pointerEvents="none" style={styles.band} />
        <Wheel values={HOURS} value={hour} label={t("time.hour")} onChange={setHour} />
        <Text variant="heading" style={styles.colon}>
          :
        </Text>
        <Wheel values={MINUTES} value={minute} label={t("time.minute")} onChange={setMinute} />
      </View>

      <View accessibilityRole="radiogroup" accessibilityLabel={t("time.presets")} style={styles.presets}>
        {presets.map((p) => {
          const selected = p.time === time;
          return (
            <Pressable
              key={p.time}
              accessibilityRole="radio"
              accessibilityLabel={`${p.name}, ${p.time}`}
              accessibilityState={{ selected }}
              onPress={() => choose(p.time)}
              style={[styles.chip, selected && styles.chipOn]}
            >
              <Text variant="catalog" style={{ color: selected ? color.paper : color.ash }}>
                {p.name} {p.time}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.actions}>
        <Button tone="quiet" label={t("cancel")} onPress={onCancel} style={styles.action} />
        <Button label={t("time.set")} onPress={() => onSet(time)} style={styles.action} />
      </View>
    </Sheet>
  );
}

const WHEEL_W = 96;
const styles = StyleSheet.create({
  head: { gap: space.xxs },
  wheels: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.xs, height: ITEM * ROWS },
  band: {
    position: "absolute",
    left: 0,
    right: 0,
    top: PAD,
    height: ITEM,
    borderRadius: radius.md,
    backgroundColor: color.iron,
    borderWidth: 1,
    borderColor: color.ironHigh,
  },
  wheel: { width: WHEEL_W, height: ITEM * ROWS },
  item: { height: ITEM, alignItems: "center", justifyContent: "center" },
  fadeTop: { position: "absolute", top: 0, left: 0, right: 0, height: PAD },
  fadeBottom: { position: "absolute", bottom: 0, left: 0, right: 0, height: PAD },
  colon: { width: space.md, textAlign: "center" },
  presets: { flexDirection: "row", flexWrap: "wrap", gap: space.xs },
  chip: {
    minHeight: minTarget,
    paddingHorizontal: space.md,
    justifyContent: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.ironHigh,
    backgroundColor: color.shaft,
  },
  chipOn: { borderColor: color.lamp },
  actions: { flexDirection: "row", gap: space.sm, justifyContent: "flex-end" },
  action: { flex: 1 },
});
