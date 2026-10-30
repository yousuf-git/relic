// One lit niche: an arch cut into the stone, a vessel resting in it, a lamp glow
// tinted by the relic's mood. Sealed relics are wrapped and dimmed.
import { Image } from "expo-image";
import { memo, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { art } from "@/design/art";
import { duration, ease, timing } from "@/design/motion";
import { color, moodLight, radius, space, type Mood, type Vessel } from "@/design/tokens";
import { Glow } from "@/ui/Glow";
import { LEDGE } from "./layout";
import { WaxSeal } from "./WaxSeal";

const FLICKER_LOW = 0.86;
const SEAL_SIZE = 44;

/** A very slight lamp flicker, out of phase per relic; flat when motion is reduced. */
function useFlicker(seed: number, enabled: boolean) {
  const o = useSharedValue(1);
  useEffect(() => {
    if (!enabled) {
      o.set(1);
      return;
    }
    const breath = duration.long + (seed % 5) * duration.short;
    o.set(
      withDelay(
        (seed % 9) * duration.short,
        withRepeat(
          withSequence(
            withTiming(FLICKER_LOW, timing(breath, ease.move)),
            withTiming(1, timing(breath * 0.6, ease.move)),
            withTiming((1 + FLICKER_LOW) / 2, timing(duration.long, ease.move)),
            withTiming(1, timing(breath, ease.move)),
          ),
          -1,
        ),
      ),
    );
    return () => cancelAnimation(o);
  }, [enabled, seed, o]);
  return useAnimatedStyle(() => ({ opacity: o.get() }));
}

type Props = {
  vessel: Vessel;
  mood: Mood;
  weight: number;
  sealed: boolean;
  width: number;
  height: number;
  seed: number;
  flicker: boolean;
};

export const Niche = memo(function Niche({ vessel, mood, weight, sealed, width, height, seed, flicker }: Props) {
  const flickerStyle = useFlicker(seed, flicker && !sealed);
  const glowSize = Math.round(width * 1.9);
  const cord = Math.hypot(width, height);
  return (
    <View style={{ width, height: height + LEDGE }}>
      <Animated.View
        pointerEvents="none"
        style={[{ position: "absolute", width: glowSize, height: glowSize, left: (width - glowSize) / 2, top: (height - glowSize) / 2 }, flickerStyle]}
      >
        <Glow size={glowSize} tint={moodLight[mood]} intensity={sealed ? 0.1 : 0.2 + weight * 0.05} />
      </Animated.View>
      <View style={[styles.arch, { width, height, borderTopLeftRadius: width / 2, borderTopRightRadius: width / 2 }]}>
        <Image
          source={art.vessel[vessel]}
          contentFit="cover"
          transition={duration.short}
          accessible={false}
          style={{ width, height, opacity: sealed ? 0.34 : 1 }}
        />
        {sealed ? (
          <View style={styles.wrap} pointerEvents="none">
            <View style={[styles.cord, { width: cord, transform: [{ rotate: "38deg" }] }]} />
            <View style={[styles.cord, { width: cord, transform: [{ rotate: "-38deg" }] }]} />
            <WaxSeal size={SEAL_SIZE} />
          </View>
        ) : null}
      </View>
      <View style={[styles.ledge, { width: width + space.sm, left: -space.xs, backgroundColor: color.ironHigh }]} />
    </View>
  );
});

const styles = StyleSheet.create({
  arch: {
    overflow: "hidden",
    borderBottomLeftRadius: radius.sm,
    borderBottomRightRadius: radius.sm,
    borderWidth: 1,
    borderColor: color.iron,
    backgroundColor: color.shaft,
  },
  wrap: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
  cord: { position: "absolute", height: 2, backgroundColor: color.ash, opacity: 0.5 },
  ledge: { position: "absolute", bottom: 0, height: LEDGE, borderRadius: radius.sm },
});
