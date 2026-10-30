// A slim overlay drawer: scrim plus a panel from one edge. Closes on scrim tap
// and the Android back button. Motion becomes a crossfade under reduced motion.
import { useEffect, type ReactNode } from "react";
import { BackHandler, Pressable as RNPressable, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn, FadeOut, SlideInLeft, SlideInRight, SlideOutLeft, SlideOutRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { duration, ease, useReducedMotion } from "@/design/motion";
import { color, space } from "@/design/tokens";

const MAX_PANEL = 360;
const PANEL_SHARE = 0.86;

export function Drawer({
  open,
  onClose,
  side,
  closeLabel,
  children,
}: {
  open: boolean;
  onClose: () => void;
  side: "left" | "right";
  closeLabel: string;
  children: ReactNode;
}) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [open, onClose]);

  const entering = reduced
    ? FadeIn.duration(duration.short)
    : (side === "left" ? SlideInLeft : SlideInRight).duration(duration.medium).easing(ease.enter);
  const exiting = reduced
    ? FadeOut.duration(duration.quick)
    : (side === "left" ? SlideOutLeft : SlideOutRight).duration(duration.short).easing(ease.exit);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={open ? "auto" : "none"}>
      {open ? (
        <Animated.View key="scrim" entering={FadeIn.duration(duration.short)} exiting={FadeOut.duration(duration.quick)} style={[StyleSheet.absoluteFill, styles.scrim]}>
          <RNPressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel={closeLabel} />
        </Animated.View>
      ) : null}
      {open ? (
        <Animated.View
          key="panel"
          entering={entering}
          exiting={exiting}
          accessibilityViewIsModal
          style={[
            styles.panel,
            side === "left" ? { left: 0, borderRightWidth: 1 } : { right: 0, borderLeftWidth: 1 },
            { width: Math.min(MAX_PANEL, width * PANEL_SHARE), paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.md },
          ]}
        >
          {children}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { backgroundColor: color.scrim },
  panel: { position: "absolute", top: 0, bottom: 0, backgroundColor: color.stone, borderColor: color.iron },
});
