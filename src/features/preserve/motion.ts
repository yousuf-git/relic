// Preserve-specific motion built only from src/design/motion.ts tokens. Fades
// ignore the system reduce-motion setting on purpose: under reduced motion every
// movement becomes a crossfade, so opacity must still animate.
import { Easing, Keyframe, ReduceMotion, type WithTimingConfig } from "react-native-reanimated";
import { distance, duration, ease, stagger } from "@/design/motion";

export const fadeTiming = (ms: number, easing: WithTimingConfig["easing"] = ease.enter): WithTimingConfig => ({
  duration: ms,
  easing,
  reduceMotion: ReduceMotion.Never,
});

/** Functional progress (hold ring, countdown): linear, and always shown. */
export const linearTiming = (ms: number): WithTimingConfig => fadeTiming(ms, Easing.linear);

export function enterUp(reduced: boolean, index = 0) {
  const frames = reduced
    ? { 0: { opacity: 0 }, 100: { opacity: 1 } }
    : {
        0: { opacity: 0, transform: [{ translateY: distance.enter }] },
        100: { opacity: 1, transform: [{ translateY: 0 }], easing: ease.enter },
      };
  return new Keyframe(frames)
    .duration(reduced ? duration.short : duration.medium)
    .delay(reduced ? 0 : index * stagger)
    .reduceMotion(ReduceMotion.Never);
}

export function fadeIn(ms: number = duration.short) {
  return new Keyframe({ 0: { opacity: 0 }, 100: { opacity: 1 } }).duration(ms).reduceMotion(ReduceMotion.Never);
}

export function fadeOut(ms: number = duration.quick) {
  return new Keyframe({ 0: { opacity: 1 }, 100: { opacity: 0 } }).duration(ms).reduceMotion(ReduceMotion.Never);
}
