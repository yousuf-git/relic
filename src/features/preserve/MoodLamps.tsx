// Six lamps; the one you light tints the relic's glow. The only place colour varies.
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { duration } from "@/design/motion";
import { haptic } from "@/design/haptics";
import { color, minTarget, moodLight, moods, type Mood } from "@/design/tokens";
import { Glow } from "@/ui/Glow";
import { Pressable } from "@/ui/Pressable";
import { Text } from "@/ui/Text";
import { fadeTiming } from "./motion";
import "./i18n";

const POOL = 72;
const BULB = 26;

export function MoodLamps({ value, onChange }: { value: Mood; onChange: (mood: Mood) => void }) {
  const { t } = useTranslation("preserve");
  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel={t("mood.label")}>
      {moods.map((mood) => (
        <Lamp
          key={mood}
          mood={mood}
          label={t(`mood.${mood}`)}
          selected={mood === value}
          onPress={() => {
            haptic.select();
            onChange(mood);
          }}
        />
      ))}
    </View>
  );
}

function Lamp({ mood, label, selected, onPress }: { mood: Mood; label: string; selected: boolean; onPress: () => void }) {
  const lit = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    lit.set(withTiming(selected ? 1 : 0, fadeTiming(duration.short)));
  }, [selected, lit]);
  const pool = useAnimatedStyle(() => ({ opacity: 0.12 + 0.88 * lit.get() }));
  const bulb = useAnimatedStyle(() => ({ opacity: 0.45 + 0.55 * lit.get() }));
  return (
    <Pressable
      haptics={false}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={styles.lamp}
    >
      <View style={styles.well}>
        <Animated.View pointerEvents="none" style={[styles.pool, pool]}>
          <Glow size={POOL} tint={moodLight[mood]} intensity={0.85} />
        </Animated.View>
        <Animated.View
          style={[styles.bulb, { backgroundColor: moodLight[mood], borderColor: selected ? color.paper : "transparent" }, bulb]}
        />
      </View>
      <Text variant="label" style={{ color: selected ? color.paper : color.ash }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between" },
  lamp: { flex: 1, minWidth: minTarget, alignItems: "center", gap: 2 },
  well: { width: POOL, height: POOL - 16, alignItems: "center", justifyContent: "center" },
  pool: { position: "absolute", top: -8, width: POOL, height: POOL },
  bulb: { width: BULB, height: BULB, borderRadius: BULB / 2, borderWidth: 2 },
});
