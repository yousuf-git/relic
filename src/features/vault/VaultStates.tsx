// The Vault's non-list states: loading shimmer, the empty niche, error/offline, no matches.
import { Image } from "expo-image";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { art } from "@/design/art";
import { duration, ease, timing, useReducedMotion } from "@/design/motion";
import { color, radius, space } from "@/design/tokens";
import { Button } from "@/ui/Button";
import { Glow } from "@/ui/Glow";
import { Text } from "@/ui/Text";
import { GAUGE_WIDTH, nicheSize } from "./layout";
import "./i18n";

export function isOfflineError(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null;
  return !e?.code || /network|fetch|timeout|offline/i.test(e.message ?? "");
}

const SKELETON_WEIGHTS = [3, 2, 4, 1];

/** Dark niches that breathe while the vault is being unearthed. */
export function LoadingShaft() {
  const { t } = useTranslation("vault");
  const reduced = useReducedMotion();
  const p = useSharedValue(0.4);
  useEffect(() => {
    if (reduced) {
      p.set(0.55);
      return;
    }
    p.set(withRepeat(withTiming(0.9, timing(duration.long, ease.move)), -1, true));
    return () => cancelAnimation(p);
  }, [reduced, p]);
  const shimmer = useAnimatedStyle(() => ({ opacity: p.get() }));
  return (
    <View style={styles.loading} accessible accessibilityLabel={t("loading.a11y")} accessibilityLiveRegion="polite">
      {SKELETON_WEIGHTS.map((weight, i) => {
        const { width, height } = nicheSize(weight);
        const left = i % 2 === 0;
        return (
          <View key={i} style={[styles.skeletonRow, left ? { paddingLeft: space.lg } : { flexDirection: "row-reverse", paddingRight: space.lg }]}>
            <Animated.View style={[styles.skeletonNiche, { width, height, borderTopLeftRadius: width / 2, borderTopRightRadius: width / 2 }, shimmer]} />
            <View style={styles.skeletonText}>
              <Animated.View style={[styles.bar, { width: "40%" }, shimmer]} />
              <Animated.View style={[styles.bar, { width: "75%", height: space.md }, shimmer]} />
              <Animated.View style={[styles.bar, { width: "55%" }, shimmer]} />
            </View>
          </View>
        );
      })}
      <Text variant="label" style={styles.loadingLabel}>
        {t("loading.text")}
      </Text>
    </View>
  );
}

/** One glowing, empty niche: the first relic belongs here. */
export function EmptyVault({ onPreserve }: { onPreserve: () => void }) {
  const { t } = useTranslation("vault");
  const { width } = useWindowDimensions();
  const reduced = useReducedMotion();
  const size = Math.min(width - space.lg * 2 - GAUGE_WIDTH / 2, 340);
  const p = useSharedValue(0.7);
  useEffect(() => {
    if (reduced) {
      p.set(1);
      return;
    }
    p.set(withRepeat(withTiming(1, timing(duration.long * 2, ease.move)), -1, true));
    return () => cancelAnimation(p);
  }, [reduced, p]);
  const pulse = useAnimatedStyle(() => ({ opacity: p.get() }));
  return (
    <View style={styles.empty}>
      <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        <Animated.View style={[styles.emptyGlow, pulse]} pointerEvents="none">
          <Glow size={size * 1.25} tint={color.lamp} intensity={0.28} />
        </Animated.View>
        <Image source={art.scene.emptyNiche} contentFit="cover" accessibilityLabel={t("empty.imageAlt")} style={{ width: size, height: size, borderRadius: radius.lg }} />
      </View>
      <Text variant="title" style={styles.centered}>
        {t("empty.title")}
      </Text>
      <Text variant="bodySmall" style={styles.centered}>
        {t("empty.body")}
      </Text>
      <Button label={t("empty.cta")} onPress={onPreserve} style={styles.cta} />
    </View>
  );
}

/** Offline or a failed unearthing; the vault itself is never in doubt. */
export function ErrorShaft({ error, onRetry, retrying }: { error: unknown; onRetry: () => void; retrying: boolean }) {
  const { t } = useTranslation(["vault", "common"]);
  const offline = isOfflineError(error);
  return (
    <View style={styles.empty}>
      <View style={styles.duck}>
        <Image source={art.duck.tilt} contentFit="cover" accessible={false} style={styles.duckImage} />
      </View>
      <Text variant="heading" style={styles.centered}>
        {offline ? t("vault:error.offlineTitle") : t("vault:error.title")}
      </Text>
      <Text variant="bodySmall" style={styles.centered} accessibilityLiveRegion="polite">
        {offline ? t("common:errors.offline") : t("vault:error.body")}
      </Text>
      <Button label={t("common:actions.retry")} tone="ghost" loading={retrying} onPress={onRetry} style={styles.cta} />
    </View>
  );
}

export function NoMatches({ onClear }: { onClear: () => void }) {
  const { t } = useTranslation("vault");
  return (
    <View style={styles.noMatch}>
      <Text variant="heading" style={styles.centered}>
        {t("noMatch.title")}
      </Text>
      <Text variant="bodySmall" style={styles.centered}>
        {t("noMatch.body")}
      </Text>
      <Button label={t("noMatch.clear")} tone="ghost" onPress={onClear} style={styles.cta} />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { paddingTop: space.lg, paddingRight: GAUGE_WIDTH / 2 },
  skeletonRow: { flexDirection: "row", alignItems: "flex-start", gap: space.md, marginBottom: space.xl },
  skeletonNiche: {
    borderBottomLeftRadius: radius.sm,
    borderBottomRightRadius: radius.sm,
    borderWidth: 1,
    borderColor: color.iron,
    backgroundColor: color.stone,
  },
  skeletonText: { flex: 1, gap: space.xs, paddingTop: space.xs },
  bar: { height: space.sm, borderRadius: radius.sm, backgroundColor: color.iron },
  loadingLabel: { textAlign: "center", marginTop: space.md },
  empty: { alignItems: "center", gap: space.sm, paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.xl },
  emptyGlow: { position: "absolute" },
  centered: { textAlign: "center" },
  cta: { alignSelf: "stretch", marginTop: space.xs },
  duck: {
    width: 90,
    height: 120,
    overflow: "hidden",
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    borderBottomLeftRadius: space.xs,
    borderBottomRightRadius: space.xs,
    borderWidth: 1,
    borderColor: color.iron,
    backgroundColor: color.shaft,
  },
  duckImage: { width: 90, height: 120 },
  noMatch: { alignItems: "center", gap: space.sm, paddingHorizontal: space.lg, paddingTop: space.xl },
});
