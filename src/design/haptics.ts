import * as Haptics from "expo-haptics";
import type { Vessel } from "./tokens";

// Material haptics: each vessel has its own texture on lift and seal.
const vesselImpact: Record<Vessel, Haptics.ImpactFeedbackStyle> = {
  letter: Haptics.ImpactFeedbackStyle.Soft,
  plate: Haptics.ImpactFeedbackStyle.Rigid,
  shell: Haptics.ImpactFeedbackStyle.Medium,
  map: Haptics.ImpactFeedbackStyle.Light,
  locket: Haptics.ImpactFeedbackStyle.Rigid,
  reel: Haptics.ImpactFeedbackStyle.Medium,
};

export const haptic = {
  press: () => Haptics.selectionAsync(),
  select: () => Haptics.selectionAsync(),
  lift: (vessel: Vessel) => Haptics.impactAsync(vesselImpact[vessel]),
  sealTick: (progress: number) =>
    Haptics.impactAsync(progress < 0.5 ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium),
  sealed: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  land: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  warn: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
};
