// The mic on the letter. Press and hold to speak and release to stop; a quick tap
// leaves it listening until the next tap. Screen readers get a plain toggle.
import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { duration } from "@/design/motion";
import { haptic } from "@/design/haptics";
import { color, minTarget } from "@/design/tokens";
import { Icon } from "@/ui/Icon";
import { Pressable } from "@/ui/Pressable";
import { fadeTiming } from "./motion";
import "./i18n";

const HOLD_MS = 350;
const BUTTON = minTarget + 8;
const RING = BUTTON + 16;

export function HoldToSpeak({
  active,
  level,
  disabled,
  onBegin,
  onEnd,
}: {
  active: boolean;
  level: SharedValue<number>;
  disabled?: boolean;
  onBegin: () => void;
  onEnd: () => void;
}) {
  const { t } = useTranslation("preserve");
  const pressedAt = useRef(0);
  const wasActive = useRef(false);
  const lit = useSharedValue(0);

  useEffect(() => {
    lit.set(withTiming(active ? 1 : 0, fadeTiming(duration.short)));
  }, [active, lit]);

  const ring = useAnimatedStyle(() => ({
    opacity: lit.get() * 0.7,
    transform: [{ scale: 0.86 + 0.14 * lit.get() + 0.4 * level.get() }],
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View pointerEvents="none" style={[styles.ring, ring]} />
      <Pressable
        haptics={false}
        disabled={disabled}
        accessibilityLabel={t("speak.label")}
        accessibilityHint={t("speak.hint")}
        accessibilityState={{ selected: active, disabled: !!disabled }}
        accessibilityActions={[{ name: "activate" }]}
        onAccessibilityAction={() => (active ? onEnd() : onBegin())}
        onPressIn={() => {
          pressedAt.current = Date.now();
          wasActive.current = active;
          if (!active) {
            haptic.select();
            onBegin();
          }
        }}
        onPressOut={() => {
          if (wasActive.current || Date.now() - pressedAt.current >= HOLD_MS) onEnd();
        }}
        style={[styles.button, active && styles.buttonOn]}
      >
        <Icon name="mic" size={26} color={active ? color.onLamp : color.paper} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: RING, height: RING, alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", width: RING, height: RING, borderRadius: RING / 2, borderWidth: 2, borderColor: color.lamp },
  button: {
    width: BUTTON,
    height: BUTTON,
    borderRadius: BUTTON / 2,
    backgroundColor: color.iron,
    borderWidth: 1,
    borderColor: color.ironHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonOn: { backgroundColor: color.lamp, borderColor: color.lamp },
});
