// The full-bleed relic object: drag to tilt it and catch the light, plus each
// vessel's reveal motion on open. Reduced motion collapses every reveal to a fade.
import { Image } from "expo-image";
import { memo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { art } from "@/design/art";
import { duration, ease, spring, timing } from "@/design/motion";
import { color, moodLight, space, type Mood, type Vessel } from "@/design/tokens";
import { Glow } from "@/ui/Glow";
import { Text } from "@/ui/Text";
import { Vignette } from "@/features/vault/Vignette";
import { WaxSeal } from "@/features/vault/WaxSeal";
import "./i18n";

const TILT_DEGREES = 12;
const TILT_RANGE = 160;
const SPECULAR = 0.3;
const REVEAL_MS = duration.long + duration.medium;
const CLAMP = Extrapolation.CLAMP;
// Where the pin sits on the generated map shard, as a share of its width and height.
const PIN = { x: 0.53, y: 0.56 };

export function useTilt(enabled: boolean) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const touched = useSharedValue(0);
  const gesture = usePanGesture({
    enabled,
    // Vertical drags belong to the page; a sideways drag takes the object.
    activeOffsetX: [-space.xs, space.xs],
    failOffsetY: [-space.sm, space.sm],
    onUpdate: (e) => {
      'worklet';
      tx.set(Math.max(-1, Math.min(1, e.translationX / TILT_RANGE)));
      ty.set(Math.max(-1, Math.min(1, e.translationY / TILT_RANGE)));
      touched.set(withTiming(1, timing(duration.short)));
    },
    onFinalize: () => {
      'worklet';
      tx.set(withSpring(0, spring.settle));
      ty.set(withSpring(0, spring.settle));
    },
  });
  return { tx, ty, touched, gesture };
}

function useReveal(enabled: boolean, reduced: boolean) {
  const p = useSharedValue(enabled ? 0 : 1);
  useEffect(() => {
    if (!enabled) {
      p.set(1);
      return;
    }
    p.set(withDelay(duration.quick, withTiming(1, timing(reduced ? duration.medium : REVEAL_MS, ease.develop))));
    return () => cancelAnimation(p);
  }, [enabled, reduced, p]);
  return p;
}

type Props = {
  vessel: Vessel;
  mood: Mood;
  sealed: boolean;
  reduced: boolean;
  width: number;
  height: number;
  scrollY: SharedValue<number>;
  tilt: ReturnType<typeof useTilt>;
  /** Voice playback progress (0..1) and whether it is in play; the shell's grooves follow it. */
  voiceProgress: SharedValue<number>;
  voiceActive: SharedValue<number>;
};

export const HeroLayer = memo(function HeroLayer({ vessel, mood, sealed, reduced, width, height, scrollY, tilt, voiceProgress, voiceActive }: Props) {
  const { t } = useTranslation("relic");
  const size = Math.round(Math.min(width * 0.92, height * 0.92));
  const p = useReveal(!sealed, reduced);
  const pin = useSharedValue(1);
  const tint = moodLight[mood];
  const { tx, ty, touched } = tilt;

  useEffect(() => {
    if (reduced || vessel !== "map") return;
    pin.set(withRepeat(withTiming(0.55, timing(duration.long + duration.medium, ease.move)), -1, true));
    return () => cancelAnimation(pin);
  }, [reduced, vessel, pin]);

  const layer = useAnimatedStyle(() => {
    const y = scrollY.get();
    return {
      opacity: interpolate(y, [0, height * 0.75], [1, 0.15], CLAMP),
      transform: [{ translateY: reduced ? 0 : -y * 0.45 }],
    };
  });

  const tiltStyle = useAnimatedStyle(() => ({
    transform: reduced
      ? []
      : [{ perspective: size * 2.4 }, { rotateX: `${-ty.get() * TILT_DEGREES}deg` }, { rotateY: `${tx.get() * TILT_DEGREES}deg` }],
  }));

  const specular = useAnimatedStyle(() => {
    const strength = Math.min(1, Math.hypot(tx.get(), ty.get()));
    return {
      opacity: 0.1 + strength * 0.55,
      transform: [{ translateX: tx.get() * size * SPECULAR }, { translateY: ty.get() * size * SPECULAR }],
    };
  });

  const hint = useAnimatedStyle(() => ({ opacity: 1 - touched.get() }));

  const body = useAnimatedStyle(() => {
    const k = p.get();
    if (reduced || sealed) return { opacity: k };
    switch (vessel) {
      case "letter":
        return {
          opacity: interpolate(k, [0, 0.25], [0, 1], CLAMP),
          transform: [{ perspective: size * 2 }, { rotateX: `${interpolate(k, [0, 1], [-74, 0])}deg` }],
        };
      case "shell":
        return { opacity: interpolate(k, [0, 0.4], [0, 1], CLAMP), transform: [{ scale: interpolate(k, [0, 1], [0.96, 1]) }] };
      case "reel":
        return {
          opacity: interpolate(k, [0, 0.3], [0, 1], CLAMP),
          transform: [{ scale: interpolate(k, [0, 1], [0.9, 1]) }, { rotateZ: `${interpolate(k, [0, 1], [-24, 0])}deg` }],
        };
      default:
        return { opacity: 1 };
    }
  });

  // The plate develops: a darkness lifts from the glass.
  const darkness = useAnimatedStyle(() => ({
    opacity: reduced || sealed || vessel !== "plate" ? 0 : interpolate(p.get(), [0, 1], [0.92, 0], CLAMP),
  }));

  // The map draws: a curtain of rock slides away to the right.
  const curtain = useAnimatedStyle(() => ({
    transform: [{ translateX: reduced || sealed || vessel !== "map" ? size : interpolate(p.get(), [0, 1], [0, size], CLAMP) }],
  }));
  const pinGlow = useAnimatedStyle(() => ({
    opacity: vessel === "map" && !sealed ? interpolate(p.get(), [0.7, 1], [0, 1], CLAMP) * pin.get() : 0,
  }));

  // The shell's grooves light as a lamp passes along them, and again as it plays.
  const sweep = useAnimatedStyle(() => {
    const k = p.get();
    const playing = vessel === "shell" && !sealed ? voiceActive.get() : 0;
    const reveal = vessel === "shell" && !sealed && !reduced ? interpolate(k, [0, 0.2, 0.8, 1], [0, 0.85, 0.85, 0], CLAMP) : 0;
    const lit = playing > 0 ? voiceProgress.get() : k;
    return {
      opacity: Math.max(reveal * (1 - playing), playing * 0.85),
      transform: [{ translateX: (lit - 0.5) * size * 0.7 }],
    };
  });
  const shellDim = useAnimatedStyle(() => ({
    opacity: vessel === "shell" && !sealed && !reduced ? interpolate(p.get(), [0, 1], [0.7, 0], CLAMP) : 0,
  }));

  // The locket opens: two halves swing out from the hinge.
  const leftHalf = useAnimatedStyle(() => ({
    transform: [{ perspective: size * 2 }, { rotateY: `${interpolate(p.get(), [0, 1], [84, 0], CLAMP)}deg` }],
  }));
  const rightHalf = useAnimatedStyle(() => ({
    transform: [{ perspective: size * 2 }, { rotateY: `${interpolate(p.get(), [0, 1], [-84, 0], CLAMP)}deg` }],
  }));
  const halves = vessel === "locket" && !reduced && !sealed;

  return (
    <>
      <Animated.View pointerEvents="none" style={[styles.layer, { width, height }, layer]}>
        <View style={[styles.center, { width, height }]}>
          <Glow size={size * 1.35} tint={tint} intensity={sealed ? 0.16 : 0.42} style={styles.ambient} />
          <Animated.View style={tiltStyle}>
            <Animated.View style={[{ width: size, height: size, transformOrigin: vessel === "letter" ? "50% 0%" : "50% 50%" }, body]}>
              {halves ? (
                <View style={{ width: size, height: size, flexDirection: "row" }}>
                  <Animated.View style={[{ width: size / 2, height: size, overflow: "hidden", transformOrigin: "100% 50%" }, leftHalf]}>
                    <Image source={art.vessel.locket} contentFit="cover" accessible={false} style={{ width: size, height: size }} />
                  </Animated.View>
                  <Animated.View style={[{ width: size / 2, height: size, overflow: "hidden", transformOrigin: "0% 50%" }, rightHalf]}>
                    <Image source={art.vessel.locket} contentFit="cover" accessible={false} style={{ width: size, height: size, marginLeft: -size / 2 }} />
                  </Animated.View>
                  <Vignette width={size} height={size} />
                </View>
              ) : (
                <View style={{ width: size, height: size, overflow: "hidden" }}>
                  <Image source={art.vessel[vessel]} contentFit="cover" accessible={false} style={{ width: size, height: size, opacity: sealed ? 0.34 : 1 }} />
                  <Animated.View style={[StyleSheet.absoluteFill, styles.shaft, darkness]} />
                  <Animated.View style={[StyleSheet.absoluteFill, styles.shaft, shellDim]} />
                  <Animated.View style={[styles.curtain, { width: size, height: size }, curtain]} />
                  <Animated.View style={[styles.pin, { left: size * PIN.x - size * 0.15, top: size * PIN.y - size * 0.15 }, pinGlow]}>
                    <Glow size={size * 0.3} tint={moodLight.ember} intensity={0.9} />
                  </Animated.View>
                  <Animated.View style={[styles.sweep, { width: size * 0.7, height: size * 0.7, left: size * 0.15, top: size * 0.15 }, sweep]}>
                    <Glow size={size * 0.7} tint={tint} intensity={0.7} />
                  </Animated.View>
                  <Vignette width={size} height={size} />
                </View>
              )}
              {sealed ? (
                <View style={[StyleSheet.absoluteFill, styles.center]}>
                  <View style={[styles.cord, { width: size * 1.3, transform: [{ rotate: "38deg" }] }]} />
                  <View style={[styles.cord, { width: size * 1.3, transform: [{ rotate: "-38deg" }] }]} />
                  <WaxSeal size={Math.round(size * 0.26)} />
                </View>
              ) : null}
              {sealed ? null : (
                <Animated.View style={[styles.specular, { width: size * 0.55, height: size * 0.55, left: size * 0.225, top: size * 0.12 }, specular]}>
                  <Glow size={size * 0.55} tint={color.paper} intensity={0.55} />
                </Animated.View>
              )}
            </Animated.View>
          </Animated.View>
        </View>
        {sealed ? null : (
          <Animated.View style={[styles.hint, hint]}>
            <Text variant="label">{t("hero.hint")}</Text>
          </Animated.View>
        )}
      </Animated.View>
    </>
  );
});

/** The touch surface for tilting; it sits in the scroll content, over the hero layer. */
export function HeroTouch({ tilt, height, vessel, sealed }: { tilt: ReturnType<typeof useTilt>; height: number; vessel: Vessel; sealed: boolean }) {
  const { t } = useTranslation("relic");
  return (
    <GestureDetector gesture={tilt.gesture}>
      <View
        style={{ height }}
        accessible
        accessibilityLabel={t("hero.a11y", { vessel: t(`vessel.${vessel}`) })}
        accessibilityHint={sealed ? undefined : t("hero.a11yHint")}
      />
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  layer: { position: "absolute", left: 0, top: 0 },
  center: { alignItems: "center", justifyContent: "center" },
  ambient: { position: "absolute" },
  shaft: { backgroundColor: color.shaft },
  curtain: { position: "absolute", left: 0, top: 0, backgroundColor: color.shaft },
  pin: { position: "absolute" },
  sweep: { position: "absolute" },
  specular: { position: "absolute" },
  cord: { position: "absolute", height: 2, backgroundColor: color.ash, opacity: 0.5 },
  hint: { position: "absolute", bottom: space.xl, left: 0, right: 0, alignItems: "center" },
});
