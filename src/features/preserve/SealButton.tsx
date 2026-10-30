// Press and hold the seal for a beat to keep the relic. A ring fills while the
// haptics quicken; letting go early cancels. Screen readers get a plain activate.
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Pressable as RNPressable, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { art } from "@/design/art";
import { haptic } from "@/design/haptics";
import { duration, useReducedMotion } from "@/design/motion";
import { color, space } from "@/design/tokens";
import { Glow } from "@/ui/Glow";
import { Text } from "@/ui/Text";
import { fadeTiming, linearTiming } from "./motion";
import { ProgressRing } from "./ProgressRing";
import "./i18n";

const SEAL = 112;
const RING = SEAL + 24;
const TICK_SLOWEST = 170;
const TICK_FASTEST = 55;
// Where the disc sits inside the square wax-seal art, as fractions of its width.
const DISC = { scale: 1.5, cx: 0.504, cy: 0.484 };

/** Runs one hold: escalating haptic ticks, then `onDone` after the hold duration. Returns a canceller. */
function runHold(onDone: () => void): () => void {
  const startedAt = Date.now();
  let tickTimer: ReturnType<typeof setTimeout> | undefined;
  const tick = () => {
    const p = Math.min(1, (Date.now() - startedAt) / duration.sealHold);
    haptic.sealTick(p);
    tickTimer = setTimeout(tick, TICK_SLOWEST - (TICK_SLOWEST - TICK_FASTEST) * p);
  };
  tick();
  const doneTimer = setTimeout(() => {
    clearTimeout(tickTimer);
    onDone();
  }, duration.sealHold);
  return () => {
    clearTimeout(tickTimer);
    clearTimeout(doneTimer);
  };
}

export function SealButton({
  disabled,
  disabledHint,
  busy,
  onComplete,
}: {
  disabled: boolean;
  disabledHint: string;
  busy: boolean;
  onComplete: () => void;
}) {
  const { t } = useTranslation("preserve");
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);
  const [holding, setHolding] = useState(false);
  const [screenReader, setScreenReader] = useState(false);
  const finished = useRef(false);
  const cancelHold = useRef<(() => void) | null>(null);

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(setScreenReader);
    const sub = AccessibilityInfo.addEventListener("screenReaderChanged", setScreenReader);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (busy) return;
    finished.current = false;
    progress.set(withTiming(0, fadeTiming(duration.short)));
  }, [busy, progress]);

  useEffect(() => () => cancelHold.current?.(), []);

  const begin = () => {
    if (disabled || busy || finished.current || cancelHold.current) return;
    setHolding(true);
    progress.set(withTiming(1, linearTiming(duration.sealHold)));
    cancelHold.current = runHold(() => {
      cancelHold.current = null;
      finished.current = true;
      setHolding(false);
      onComplete();
    });
  };

  const cancel = () => {
    if (!cancelHold.current) return;
    cancelHold.current();
    cancelHold.current = null;
    setHolding(false);
    progress.set(withTiming(0, fadeTiming(duration.short)));
  };

  const sealStyle = useAnimatedStyle(() => ({ transform: [{ scale: reduced ? 1 : 1 - 0.06 * progress.get() }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.15 + 0.85 * progress.get() }));

  const caption = disabled ? disabledHint : holding ? t("seal.holding") : t("seal.hold");

  return (
    <View style={styles.root}>
      <RNPressable
        onPressIn={begin}
        onPressOut={cancel}
        onPress={() => {
          if (screenReader && !disabled && !busy && !finished.current) {
            finished.current = true;
            onComplete();
          }
        }}
        disabled={disabled || busy}
        accessibilityRole="button"
        accessibilityLabel={t("seal.label")}
        accessibilityHint={t("seal.hint")}
        accessibilityState={{ disabled: disabled || busy, busy }}
        style={[styles.press, (disabled || busy) && styles.dim]}
      >
        <Animated.View pointerEvents="none" style={[styles.glow, glowStyle]}>
          <Glow size={RING * 1.7} tint={color.lamp} intensity={0.5} />
        </Animated.View>
        <ProgressRing size={RING} stroke={4} progress={progress} tint={color.lamp} track={color.iron} />
        <Animated.View pointerEvents="none" style={[styles.seal, sealStyle]}>
          <Image
            source={art.waxSeal}
            contentFit="cover"
            style={{
              position: "absolute",
              width: SEAL * DISC.scale,
              height: SEAL * DISC.scale,
              left: SEAL * (0.5 - DISC.cx * DISC.scale),
              top: SEAL * (0.5 - DISC.cy * DISC.scale),
            }}
          />
        </Animated.View>
      </RNPressable>
      <Text variant="button" style={{ color: disabled ? color.ash : color.paper }} accessibilityLiveRegion="polite">
        {caption}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: "center", gap: space.xs },
  press: { width: RING, height: RING, alignItems: "center", justifyContent: "center" },
  dim: { opacity: 0.5 },
  glow: { position: "absolute", width: RING * 1.7, height: RING * 1.7 },
  seal: { position: "absolute", width: SEAL, height: SEAL, borderRadius: SEAL / 2, overflow: "hidden", backgroundColor: color.shaft },
});
