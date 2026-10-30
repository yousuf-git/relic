// Shared pieces of the quarters: stone panels, the lamp-oil gauge, wax-seal pips,
// switch and link rows. Everything is deliberately still; the one motion is the
// oil settling to its level.
import { Canvas, LinearGradient, Rect, vec } from "@shopify/react-native-skia";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Switch, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { art } from "@/design/art";
import { duration, ease, stagger, timing } from "@/design/motion";
import { color, minTarget, radius, space } from "@/design/tokens";
import { Button } from "@/ui/Button";
import { Icon, type IconName } from "@/ui/Icon";
import { Pressable } from "@/ui/Pressable";
import { Text } from "@/ui/Text";

export function Panel({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function PanelHead({ label, title, body }: { label: string; title?: string; body?: string }) {
  return (
    <View style={styles.head}>
      <Text variant="label" accessibilityRole={title ? undefined : "header"}>
        {label}
      </Text>
      {title ? (
        <Text variant="heading" accessibilityRole="header">
          {title}
        </Text>
      ) : null}
      {body ? <Text variant="bodySmall">{body}</Text> : null}
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

/** A static stand-in while data loads; no shimmer, the quarters stay calm. */
export function Bone({ width, height = space.md, style }: { width: number | `${number}%`; height?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.bone, { width, height }, style]} />;
}

export function RetryNote({ message, retryLabel, onRetry }: { message: string; retryLabel: string; onRetry: () => void }) {
  return (
    <View style={styles.retry} accessibilityLiveRegion="polite">
      <Text variant="bodySmall">{message}</Text>
      <Button tone="ghost" label={retryLabel} onPress={onRetry} />
    </View>
  );
}

/** Lamp-oil gauge: a glass vial with quarter marks. `tone="low"` turns the oil red. */
export function Gauge({
  fraction,
  tone = "lamp",
  label,
  valueText,
}: {
  fraction: number;
  tone?: "lamp" | "low";
  label: string;
  valueText: string;
}) {
  const level = Math.min(1, Math.max(0, fraction));
  // A sliver of oil stays visible once anything is stored.
  const shown = level > 0 ? Math.max(level, 0.02) : 0;
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withTiming(shown, timing(duration.long, ease.develop)));
  }, [p, shown]);
  const fill = useAnimatedStyle(() => ({ transform: [{ scaleX: p.get() }] }));
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(level * 100), text: valueText }}
      style={styles.vial}
    >
      <Animated.View style={[styles.oil, { backgroundColor: tone === "low" ? color.danger : color.lamp }, fill]} />
      {[0.25, 0.5, 0.75].map((mark) => (
        <View key={mark} style={[styles.mark, { left: `${mark * 100}%` }]} />
      ))}
    </View>
  );
}

const SEAL = 44;
const SEAL_ART = 64;

/** One wax seal per relic kept today; empty recesses for the ones still free. */
export function WaxSeals({ used, total, label }: { used: number; total: number; label: string }) {
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label} style={styles.seals}>
      {Array.from({ length: total }, (_, i) =>
        i < used ? (
          <Animated.View key={i} entering={FadeIn.delay(i * stagger).duration(duration.medium)} style={styles.seal}>
            <Image source={art.waxSeal} contentFit="cover" style={styles.sealArt} />
          </Animated.View>
        ) : (
          <View key={i} style={[styles.seal, styles.sealEmpty]} />
        ),
      )}
    </View>
  );
}

export function SwitchRow({
  label,
  hint,
  value,
  onValueChange,
  disabled,
  busy,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ checked: value, disabled: !!disabled, busy: !!busy }}
      disabled={disabled || busy}
      onPress={() => onValueChange(!value)}
      pressScale={0.99}
      style={styles.row}
    >
      <View style={styles.rowText}>
        <Text variant="body">{label}</Text>
        {hint ? <Text variant="bodySmall">{hint}</Text> : null}
      </View>
      {busy ? (
        <ActivityIndicator color={color.lamp} />
      ) : (
        <View pointerEvents="none" importantForAccessibility="no-hide-descendants">
          <Switch value={value} trackColor={{ false: color.iron, true: color.lampDeep }} thumbColor={value ? color.lamp : color.ash} />
        </View>
      )}
    </Pressable>
  );
}

export function LinkRow({
  label,
  hint,
  icon = "link",
  onPress,
  role = "link",
}: {
  label: string;
  hint?: string;
  icon?: IconName;
  onPress: () => void;
  role?: "link" | "button";
}) {
  return (
    <Pressable accessibilityRole={role} accessibilityLabel={label} accessibilityHint={hint} onPress={onPress} pressScale={0.99} style={styles.row}>
      <Text variant="body" style={styles.rowText}>
        {label}
      </Text>
      <Icon name={icon} color={color.ash} />
    </Pressable>
  );
}

/** A soft dissolve into `tint` from one edge, so images and wheels melt into their panel. */
export function EdgeFade({ edge, tint, style }: { edge: "top" | "bottom" | "left" | "right"; tint: string; style?: StyleProp<ViewStyle> }) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const horizontal = edge === "left" || edge === "right";
  const solidAtStart = edge === "top" || edge === "left";
  const length = horizontal ? size.w : size.h;
  const from = solidAtStart ? 0 : length;
  const to = solidAtStart ? length : 0;
  return (
    <View
      pointerEvents="none"
      style={style}
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {size.w > 0 && size.h > 0 ? (
        <Canvas style={{ width: size.w, height: size.h }}>
          <Rect x={0} y={0} width={size.w} height={size.h}>
            <LinearGradient
              start={horizontal ? vec(from, 0) : vec(0, from)}
              end={horizontal ? vec(to, 0) : vec(0, to)}
              colors={[tint, `${tint}00`]}
            />
          </Rect>
        </Canvas>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: color.stone,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.iron,
    padding: space.lg,
    gap: space.md,
    overflow: "hidden",
  },
  head: { gap: space.xxs },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: color.ironHigh },
  bone: { backgroundColor: color.iron, borderRadius: radius.sm },
  retry: { gap: space.xs, alignItems: "flex-start" },
  vial: {
    height: space.md,
    borderRadius: radius.pill,
    backgroundColor: color.shaft,
    borderWidth: 1,
    borderColor: color.ironHigh,
    overflow: "hidden",
    justifyContent: "center",
  },
  oil: { ...StyleSheet.absoluteFill, transformOrigin: "left center" },
  mark: { position: "absolute", top: 0, bottom: 0, width: 1, backgroundColor: color.ironHigh },
  seals: { flexDirection: "row", gap: space.sm },
  seal: { width: SEAL, height: SEAL, borderRadius: SEAL / 2, overflow: "hidden", backgroundColor: color.shaft },
  sealArt: { position: "absolute", width: SEAL_ART, height: SEAL_ART, left: (SEAL - SEAL_ART) / 2, top: (SEAL - SEAL_ART) / 2 },
  sealEmpty: { borderWidth: 1, borderColor: color.ironHigh, borderStyle: "dashed", backgroundColor: color.shaft },
  row: {
    minHeight: minTarget + space.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingVertical: space.xs,
  },
  rowText: { flex: 1, gap: space.xxs },
});
