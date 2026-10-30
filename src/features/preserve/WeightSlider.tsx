// Feather to stone in five stops, dragged or tapped. Weight sets the relic's size and glow in the
// Vault, and how often it resurfaces.
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { haptic } from "@/design/haptics";
import { spring } from "@/design/motion";
import { color, minTarget, space } from "@/design/tokens";
import { Icon } from "@/ui/Icon";
import { Text } from "@/ui/Text";
import "./i18n";

const STEPS = 5;
const THUMB = 44;
const PAD = THUMB / 2;
const THUMB_SMALLEST = 0.6;

export function WeightSlider({ value, onChange }: { value: number; onChange: (weight: number) => void }) {
  const { t } = useTranslation("preserve");
  const [width, setWidth] = useState(0);
  const usable = Math.max(0, width - PAD * 2);
  const x = useSharedValue(PAD);
  const dragging = useRef(false);
  const step = useRef(value);
  const originPageX = useRef(0);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (!usable || dragging.current) return;
    step.current = value;
    x.set(withSpring(PAD + ((value - 1) / (STEPS - 1)) * usable, spring.lift));
  }, [value, usable, x]);

  const stepX = (n: number) => PAD + ((n - 1) / (STEPS - 1)) * usable;

  const moveTo = (px: number) => {
    if (!usable) return;
    const clamped = Math.min(Math.max(px, PAD), PAD + usable);
    x.set(clamped);
    const next = Math.round(((clamped - PAD) / usable) * (STEPS - 1)) + 1;
    if (next !== step.current) {
      step.current = next;
      haptic.select();
      onChangeRef.current(next);
    }
  };

  const settle = () => {
    dragging.current = false;
    x.set(withSpring(stepX(step.current), spring.lift));
  };

  const thumbStyle = useAnimatedStyle(() => {
    const t01 = usable ? (x.get() - PAD) / usable : 0;
    return { transform: [{ translateX: x.get() - PAD }, { scale: THUMB_SMALLEST + (1 - THUMB_SMALLEST) * t01 }] };
  });
  const fillStyle = useAnimatedStyle(() => ({ width: x.get() }));

  const nudge = (delta: number) => {
    const next = Math.min(STEPS, Math.max(1, value + delta));
    if (next !== value) {
      haptic.select();
      onChange(next);
    }
  };

  return (
    <View style={styles.root}>
      <View
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={(e) => {
          dragging.current = true;
          originPageX.current = e.nativeEvent.pageX - e.nativeEvent.locationX;
          moveTo(e.nativeEvent.locationX);
        }}
        onResponderMove={(e) => moveTo(e.nativeEvent.pageX - originPageX.current)}
        onResponderRelease={settle}
        onResponderTerminate={settle}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={t("weight.label")}
        accessibilityValue={{ min: 1, max: STEPS, now: value, text: t(`weight.step.${value}`) }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={(e) => nudge(e.nativeEvent.actionName === "increment" ? 1 : -1)}
        style={styles.track}
      >
        <View pointerEvents="none" style={styles.line} />
        <Animated.View pointerEvents="none" style={[styles.fill, fillStyle]} />
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {Array.from({ length: STEPS }, (_, i) => (
            <View key={i} style={[styles.notch, { left: usable ? stepX(i + 1) - 2 : 0 }]} />
          ))}
        </View>
        <Animated.View pointerEvents="none" style={[styles.thumb, thumbStyle]}>
          <Icon name="stone" size={22} color={color.onLamp} />
        </Animated.View>
      </View>
      <View style={styles.ends}>
        <View style={styles.end}>
          <Icon name="feather" size={20} color={color.ash} />
          <Text variant="label">{t("weight.feather")}</Text>
        </View>
        <View style={styles.end}>
          <Text variant="label">{t("weight.stone")}</Text>
          <Icon name="stone" size={20} color={color.ash} />
        </View>
      </View>
      <Text variant="heading" style={styles.step}>
        {t(`weight.step.${value}`)}
      </Text>
      <Text variant="bodySmall" style={styles.effect}>
        {t("weight.effect")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.xs },
  track: { height: minTarget + 8, justifyContent: "center" },
  line: { position: "absolute", left: PAD, right: PAD, height: 2, borderRadius: 1, backgroundColor: color.ironHigh },
  fill: { position: "absolute", left: 0, height: 2, borderRadius: 1, backgroundColor: color.lampDeep },
  notch: { position: "absolute", top: (minTarget + 8) / 2 - 4, width: 4, height: 8, borderRadius: 2, backgroundColor: color.faint },
  thumb: {
    position: "absolute",
    left: 0,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: color.lamp,
    alignItems: "center",
    justifyContent: "center",
  },
  ends: { flexDirection: "row", justifyContent: "space-between" },
  end: { flexDirection: "row", alignItems: "center", gap: space.xs },
  step: { textAlign: "center" },
  effect: { textAlign: "center" },
});
