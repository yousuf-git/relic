// The depth gauge on the right edge: a rule with one tick per level, a lamp
// marker that tracks the scroll, and the current level in catalog type.
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import { color, minTarget, radius, space } from "@/design/tokens";
import { Pressable } from "@/ui/Pressable";
import { Text } from "@/ui/Text";
import { GAUGE_WIDTH, type LevelStop } from "./layout";
import "./i18n";

const TRACK_X = space.sm;
const LABEL_LENGTH = 176;
const LABEL_THICKNESS = 20;
const YEAR = 12;

type Props = {
  scrollY: SharedValue<number>;
  contentHeight: number;
  viewHeight: number;
  top: number;
  bottom: number;
  stops: LevelStop[];
  current: LevelStop | undefined;
  onPress: () => void;
};

const Ticks = memo(function Ticks({ stops, range, trackHeight }: { stops: LevelStop[]; range: number; trackHeight: number }) {
  return (
    <>
      {stops.map((s) => {
        const year = s.level % YEAR === 1 && s.level > 1;
        return (
          <View
            key={s.levelIndex}
            style={[styles.tick, { top: Math.min(1, s.offset / range) * trackHeight, width: year ? space.sm : space.xs, backgroundColor: year ? color.ash : color.ironHigh }]}
          />
        );
      })}
    </>
  );
});

export const DepthGauge = memo(function DepthGauge({ scrollY, contentHeight, viewHeight, top, bottom, stops, current, onPress }: Props) {
  const { t } = useTranslation("vault");
  const trackHeight = Math.max(1, viewHeight - top - bottom);
  const range = Math.max(1, contentHeight - viewHeight);

  const marker = useAnimatedStyle(() => ({
    transform: [{ translateY: Math.min(1, Math.max(0, scrollY.get() / range)) * trackHeight }],
  }));
  // The label hangs below the marker at the top of the shaft and rises above it at the bottom, so it never leaves the track.
  const labelShift = useAnimatedStyle(() => ({
    transform: [{ translateY: -Math.min(1, Math.max(0, scrollY.get() / range)) * LABEL_LENGTH }],
  }));
  const text = current ? t("gauge.label", { level: current.level, month: current.month }) : "";

  return (
    <Pressable
      accessibilityLabel={t("gauge.a11y", { level: current?.level ?? 1, month: current?.month ?? "" })}
      accessibilityHint={t("gauge.hint")}
      haptics={false}
      pressScale={1}
      onPress={onPress}
      style={[styles.hit, { top, bottom, width: GAUGE_WIDTH }]}
    >
      <View style={[styles.track, { height: trackHeight, right: TRACK_X }]} pointerEvents="none">
        <Ticks stops={stops} range={range} trackHeight={trackHeight} />
        <Animated.View style={[styles.marker, marker]}>
          <View style={styles.markerBar} />
          <Animated.View style={[styles.labelBox, labelShift]}>
            <Text variant="catalog" numberOfLines={1} style={styles.label}>
              {text}
            </Text>
          </Animated.View>
        </Animated.View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  hit: { position: "absolute", right: 0, minWidth: minTarget },
  track: { position: "absolute", width: 1, backgroundColor: color.ironHigh },
  tick: { position: "absolute", right: 0, height: 1 },
  marker: { position: "absolute", right: -space.xs, top: 0, width: space.md },
  markerBar: { position: "absolute", right: 0, top: -1, width: space.md, height: 2, borderRadius: radius.pill, backgroundColor: color.lamp },
  labelBox: { position: "absolute", top: 0, right: space.md, width: LABEL_THICKNESS, height: LABEL_LENGTH, alignItems: "center", justifyContent: "flex-start" },
  label: {
    position: "absolute",
    width: LABEL_LENGTH,
    top: (LABEL_LENGTH - LABEL_THICKNESS) / 2,
    left: (LABEL_THICKNESS - LABEL_LENGTH) / 2,
    textAlign: "left",
    transform: [{ rotate: "90deg" }],
    color: color.paper,
  },
});
