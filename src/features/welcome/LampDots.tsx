// Progress as lamps on a shaft gauge: the lit one is where the camera is.
import { StyleSheet, View } from "react-native";
import Animated, { Extrapolation, interpolate, useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import { color, space } from "@/design/tokens";
import { Glow } from "@/ui/Glow";

const DOT = 8;
const GLOW = 30;

export function LampDots({ depth, count, current, label }: { depth: SharedValue<number>; count: number; current: number; label: string }) {
  return (
    <View
      style={styles.gauge}
      pointerEvents="none"
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 1, max: count, now: current }}
    >
      <View style={styles.rail} />
      {Array.from({ length: count }, (_, i) => (
        <Dot key={i} index={i} depth={depth} />
      ))}
    </View>
  );
}

function Dot({ index, depth }: { index: number; depth: SharedValue<number> }) {
  const lit = useAnimatedStyle(() => ({
    opacity: interpolate(depth.get(), [index - 1, index, index + 1], [0, 1, 0], Extrapolation.CLAMP),
  }));
  return (
    <View style={styles.slot}>
      <View style={styles.unlit} />
      <Animated.View style={[styles.lit, lit]}>
        <Glow size={GLOW} tint={color.lamp} intensity={0.6} style={styles.halo} />
        <View style={styles.flame} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  gauge: { alignItems: "center", gap: space.lg },
  rail: { position: "absolute", top: DOT, bottom: DOT, width: 1, backgroundColor: color.iron },
  slot: { width: DOT, height: DOT, alignItems: "center", justifyContent: "center" },
  unlit: { width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: color.iron, borderWidth: 1, borderColor: color.ironHigh },
  lit: { position: "absolute", width: DOT, height: DOT, alignItems: "center", justifyContent: "center" },
  halo: { position: "absolute", left: (DOT - GLOW) / 2, top: (DOT - GLOW) / 2 },
  flame: { width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: color.lamp },
});
