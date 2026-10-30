// The dispense moment. The duck's head tilts back and an amber token slides out and
// waits while the relic is carried down; once it is safely kept the token drops and
// the relic descends behind the dispenser. If sealing fails the scene rewinds.
import { Image } from "expo-image";
import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { art } from "@/design/art";
import { haptic } from "@/design/haptics";
import { duration, ease, spring, useReducedMotion } from "@/design/motion";
import { color, moodLight, radius, space, type Mood, type Vessel } from "@/design/tokens";
import { Glow } from "@/ui/Glow";
import { Text } from "@/ui/Text";
import { fadeIn, fadeOut, fadeTiming } from "./motion";

export type SealStage = "idle" | "dispense" | "land" | "rewind";

const DUCK_W = 216;
const DUCK_H = 288;
const RELIC = 120;
const TOKEN = 44;
// Where the amber token sits in the tilted-duck art, as fractions of its frame.
const MOUTH = { x: 0.52, y: 0.43 };
const LAND_HOLD_MS = duration.long + duration.short;

export function SealingScene({
  stage,
  vessel,
  mood,
  duck,
  status,
  onLanded,
}: {
  stage: SealStage;
  vessel: Vessel;
  mood: Mood;
  duck: keyof typeof art.duck;
  status: string;
  onLanded: () => void;
}) {
  if (stage === "idle") return null;
  return (
    <Animated.View entering={fadeIn(duration.short)} exiting={fadeOut(duration.short)} style={styles.root}>
      <Scene stage={stage} vessel={vessel} mood={mood} duck={duck} status={status} onLanded={onLanded} />
    </Animated.View>
  );
}

function Scene({ stage, vessel, mood, duck, status, onLanded }: Parameters<typeof SealingScene>[0]) {
  const reduced = useReducedMotion();
  const tilt = useSharedValue(0);
  const token = useSharedValue(0);
  const drop = useSharedValue(0);
  const relic = useSharedValue(0);
  const landed = useRef(onLanded);
  useEffect(() => {
    landed.current = onLanded;
  });

  useEffect(() => {
    if (stage === "dispense") {
      tilt.set(withTiming(1, fadeTiming(duration.medium, ease.develop)));
      token.set(withDelay(duration.short, withTiming(1, fadeTiming(duration.medium))));
      return;
    }
    if (stage === "rewind") {
      token.set(withTiming(0, fadeTiming(duration.short)));
      tilt.set(withTiming(0, fadeTiming(duration.medium)));
      return;
    }
    if (reduced) {
      drop.set(withTiming(1, fadeTiming(duration.medium)));
      relic.set(withTiming(1, fadeTiming(duration.medium)));
    } else {
      drop.set(withSpring(1, spring.drop));
      relic.set(withSpring(1, spring.descend));
    }
    const impact = setTimeout(haptic.land, duration.medium / 2);
    const done = setTimeout(() => landed.current(), LAND_HOLD_MS);
    return () => {
      clearTimeout(impact);
      clearTimeout(done);
    };
  }, [stage, reduced, tilt, token, drop, relic]);

  const tiltStyle = useAnimatedStyle(() => ({ opacity: tilt.get() }));
  const tokenStyle = useAnimatedStyle(() => ({
    opacity: token.get() * (1 - drop.get() * 0.9),
    transform: [{ translateY: reduced ? 0 : drop.get() * DUCK_H * 0.6 }, { scale: 0.7 + 0.3 * token.get() }],
  }));
  const relicStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.min(1, relic.get()),
    transform: [{ translateY: reduced ? 0 : relic.get() * (RELIC + space.lg + DUCK_H) }],
  }));

  return (
    <>
      <Animated.View style={[styles.relic, relicStyle]}>
        <View style={styles.relicGlow} pointerEvents="none">
          <Glow size={RELIC * 2.6} tint={moodLight[mood]} intensity={0.7} />
        </View>
        <Image source={art.vessel[vessel]} contentFit="cover" style={styles.relicTile} />
      </Animated.View>
      <View style={styles.duck}>
        <Image source={art.duck[duck]} contentFit="cover" style={StyleSheet.absoluteFill} />
        <Animated.View style={[StyleSheet.absoluteFill, tiltStyle]}>
          <Image source={art.duck.tilt} contentFit="cover" style={StyleSheet.absoluteFill} />
        </Animated.View>
        <Animated.View style={[styles.token, tokenStyle]}>
          <Image source={art.waxSeal} contentFit="cover" style={styles.tokenArt} />
        </Animated.View>
      </View>
      <Text variant="bodySmall" style={styles.status} accessibilityLiveRegion="polite">
        {status}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: color.shaft, alignItems: "center", justifyContent: "center", gap: space.lg },
  relic: { width: RELIC, height: RELIC, alignItems: "center", justifyContent: "center" },
  relicGlow: { position: "absolute", width: RELIC * 2.6, height: RELIC * 2.6 },
  relicTile: { width: RELIC, height: RELIC, borderRadius: radius.lg, borderWidth: 1, borderColor: color.iron },
  duck: {
    width: DUCK_W,
    height: DUCK_H,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: color.iron,
    backgroundColor: color.shaft,
  },
  token: {
    position: "absolute",
    left: DUCK_W * MOUTH.x - TOKEN / 2,
    top: DUCK_H * MOUTH.y - TOKEN / 2,
    width: TOKEN,
    height: TOKEN,
    borderRadius: TOKEN / 2,
    overflow: "hidden",
  },
  tokenArt: { position: "absolute", width: TOKEN * 1.5, height: TOKEN * 1.5, left: -TOKEN * 0.256, top: -TOKEN * 0.226 },
  status: { textAlign: "center", paddingHorizontal: space.xl, minHeight: 48 },
});
