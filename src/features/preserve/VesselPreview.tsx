// The relic as it forms: the vessel it will keep as, lit by the chosen mood lamp and
// sized by its weight. Changing mood cross-fades the light; changing vessel
// cross-dissolves the object.
import { Image } from "expo-image";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { art } from "@/design/art";
import { duration, spring, useReducedMotion } from "@/design/motion";
import { color, moodLight, radius, space, type Mood, type Vessel } from "@/design/tokens";
import { Glow } from "@/ui/Glow";
import { Text } from "@/ui/Text";
import { fadeIn, fadeOut } from "./motion";
import "./i18n";

export type InlayKey = "words" | "voice" | "photo" | "place" | "people" | "link";

const TILE = 132;
const TILE_COMPACT = 56;
const weightScale = (weight: number) => 0.86 + (weight - 1) * 0.06;

export function VesselPreview({
  vessel,
  mood,
  weight,
  inlays,
  compact,
}: {
  vessel: Vessel;
  mood: Mood;
  weight: number;
  inlays: InlayKey[];
  compact?: boolean;
}) {
  const { t } = useTranslation("preserve");
  const reduced = useReducedMotion();
  const scale = useSharedValue(weightScale(weight));
  useEffect(() => {
    scale.set(withSpring(weightScale(weight), spring.settle));
  }, [weight, scale]);
  const tileStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  const tile = compact ? TILE_COMPACT : TILE;
  const glow = tile * 2.4;
  const list = inlays.map((k) => t(`inlay.${k}`)).join(", ");

  return (
    <View style={[styles.root, compact && styles.rootCompact]} accessible accessibilityLabel={`${t(`vessel.${vessel}`)}${list ? `. ${t("vessel.inlaid", { list })}` : ""}`}>
      <View style={[styles.stage, { width: tile, height: tile }]}>
        <Animated.View
          key={mood}
          entering={fadeIn(duration.medium)}
          exiting={fadeOut(duration.medium)}
          pointerEvents="none"
          style={[styles.glow, { width: glow, height: glow, left: (tile - glow) / 2, top: (tile - glow) / 2 }]}
        >
          <Glow size={glow} tint={moodLight[mood]} intensity={0.3 + weight * 0.1} />
        </Animated.View>
        <Animated.View style={[styles.tile, { width: tile, height: tile }, tileStyle]}>
          <Image source={art.vessel[vessel]} contentFit="cover" transition={reduced ? 0 : duration.medium} style={StyleSheet.absoluteFill} />
        </Animated.View>
      </View>
      <View style={compact ? styles.captionCompact : styles.caption}>
        <Text variant="label">{t(`vessel.${vessel}`)}</Text>
        {list ? (
          <Text variant="bodySmall" style={compact ? undefined : styles.centered}>
            {t("vessel.inlaid", { list })}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: "center", gap: space.sm, paddingVertical: space.sm },
  rootCompact: { flexDirection: "row", gap: space.md, paddingVertical: 0 },
  stage: { alignItems: "center", justifyContent: "center" },
  glow: { position: "absolute" },
  tile: { borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: color.iron, backgroundColor: color.stone },
  caption: { alignItems: "center", gap: space.xxs },
  captionCompact: { flex: 1, gap: space.xxs },
  centered: { textAlign: "center" },
});
