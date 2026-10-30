// Relic motion system. Profile: calm but responsive; critically damped by
// default; expressive only on onboarding, sealing, reveal and unearthing.
// Signature moves: descend, lift, seal, develop. All motion reads from here.
import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";
import {
  Easing,
  ReduceMotion,
  type WithSpringConfig,
  type WithTimingConfig,
} from "react-native-reanimated";

export const duration = {
  instant: 80,
  quick: 120,
  short: 220,
  medium: 420,
  long: 900,
  // Seal hold: long enough to feel deliberate, short enough not to frustrate.
  sealHold: 1200,
} as const;

export const ease = {
  enter: Easing.bezier(0.16, 1, 0.3, 1),
  exit: Easing.bezier(0.4, 0, 1, 1),
  move: Easing.bezier(0.65, 0, 0.35, 1),
  develop: Easing.bezier(0.33, 0, 0.15, 1),
} as const;

export const spring = {
  // Critically damped: no overshoot. Default for UI.
  settle: { damping: 26, stiffness: 240, mass: 1, reduceMotion: ReduceMotion.System } satisfies WithSpringConfig,
  lift: { damping: 22, stiffness: 320, mass: 0.8, reduceMotion: ReduceMotion.System } satisfies WithSpringConfig,
  // The relic landing in its niche: the one sanctioned overshoot.
  drop: { damping: 14, stiffness: 180, mass: 1, reduceMotion: ReduceMotion.System } satisfies WithSpringConfig,
  descend: { damping: 30, stiffness: 90, mass: 1.2, reduceMotion: ReduceMotion.System } satisfies WithSpringConfig,
} as const;

export const timing = (ms: number, easing = ease.enter): WithTimingConfig => ({
  duration: ms,
  easing,
  reduceMotion: ReduceMotion.System,
});

export const scale = { pressed: 0.97, lifted: 1.04 } as const;
export const distance = { nudge: 6, enter: 16, page: 48 } as const;
export const stagger = 45;

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => sub.remove();
  }, []);
  return reduced;
}
