// Beat 1: the six vessels drift down out of the dark and settle, each in its own mood light.
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { art } from "@/design/art";
import { distance, duration, ease, spring, stagger, timing } from "@/design/motion";
import { moodLight, type Mood, type Vessel } from "@/design/tokens";
import { Glow } from "@/ui/Glow";
import { Vignette } from "./Scene";

type Piece = { vessel: Vessel; mood: Mood; x: number; y: number; size: number; tilt: number };

// Centres as fractions of the stage; sizes as fractions of its base unit. Hand-placed so the
// scatter reads as objects set down, not a grid.
const PIECES: Piece[] = [
  { vessel: "letter", mood: "honey", x: 0.3, y: 0.18, size: 1, tilt: -6 },
  { vessel: "plate", mood: "tide", x: 0.72, y: 0.24, size: 0.86, tilt: 5 },
  { vessel: "map", mood: "moss", x: 0.17, y: 0.6, size: 0.74, tilt: 4 },
  { vessel: "shell", mood: "ember", x: 0.5, y: 0.5, size: 0.8, tilt: -3 },
  { vessel: "locket", mood: "dusk", x: 0.84, y: 0.6, size: 0.7, tilt: -5 },
  { vessel: "reel", mood: "ash", x: 0.5, y: 0.88, size: 0.74, tilt: 3 },
];

const FLOAT = duration.long * 4;
const GLOW_SCALE = 1.7;
const ARRIVE_SCALE = 0.7;

export function VesselDrift({ active, reduced }: { active: boolean; reduced: boolean }) {
  const [stage, setStage] = useState<{ w: number; h: number } | null>(null);
  const onLayout = (e: LayoutChangeEvent) => setStage({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
  const base = stage ? Math.min(stage.w * 0.36, stage.h * 0.38) : 0;
  return (
    <View style={styles.stage} onLayout={onLayout} pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {stage
        ? PIECES.map((p, i) => <Drifter key={p.vessel} piece={p} index={i} stage={stage} base={base} active={active} reduced={reduced} />)
        : null}
    </View>
  );
}

function Drifter({ piece, index, stage, base, active, reduced }: { piece: Piece; index: number; stage: { w: number; h: number }; base: number; active: boolean; reduced: boolean }) {
  const arrive = useSharedValue(0);
  const bob = useSharedValue(0);
  const size = piece.size * base;

  useEffect(() => {
    if (reduced) {
      arrive.set(withTiming(active ? 1 : 0, timing(duration.medium, ease.develop)));
      return;
    }
    arrive.set(active ? withDelay(index * stagger * 3, withSpring(1, spring.drop)) : withTiming(0, timing(duration.short, ease.exit)));
  }, [active, reduced, index, arrive]);

  useEffect(() => {
    if (reduced || !active) return;
    bob.set(withDelay(index * stagger * 4, withRepeat(withTiming(1, timing(FLOAT, ease.move)), -1, true)));
    return () => bob.set(0);
  }, [active, reduced, index, bob]);

  const style = useAnimatedStyle(() => {
    const a = arrive.get();
    if (reduced) return { opacity: a };
    return {
      opacity: interpolate(a, [0, 0.4, 1], [0, 1, 1], "clamp"),
      transform: [
        { translateY: interpolate(a, [0, 1], [-distance.page * 2, 0]) - interpolate(bob.get(), [0, 1], [0, distance.nudge]) },
        { rotate: `${piece.tilt}deg` },
        { scale: interpolate(a, [0, 1], [ARRIVE_SCALE, 1]) },
      ],
    };
  });

  return (
    <Animated.View style={[styles.piece, { width: size, height: size, left: piece.x * stage.w - size / 2, top: piece.y * stage.h - size / 2 }, style]}>
      <Glow
        size={size * GLOW_SCALE}
        tint={moodLight[piece.mood]}
        intensity={0.32}
        style={{ position: "absolute", left: (size - size * GLOW_SCALE) / 2, top: (size - size * GLOW_SCALE) / 2 }}
      />
      <Image source={art.vessel[piece.vessel]} contentFit="cover" style={StyleSheet.absoluteFill} />
      <Vignette size={size} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1 },
  piece: { position: "absolute" },
});
