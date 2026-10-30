// "The Descent": three beats over the shaft. The camera moves down through the
// scenes (parallax + scale); under reduced motion every move becomes a crossfade.
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, PanResponder, StyleSheet, View } from "react-native";
import Animated, {
  Extrapolation,
  FadeIn,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { art } from "@/design/art";
import { haptic } from "@/design/haptics";
import { distance, duration, ease, spring, timing, useReducedMotion } from "@/design/motion";
import { color, space } from "@/design/tokens";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { Pressable } from "@/ui/Pressable";
import { Text } from "@/ui/Text";
import { Companion, COMPANION_SIZE } from "./Companion";
import { LampDots } from "./LampDots";
import { Scrim } from "./Scene";
import { VesselDrift } from "./VesselDrift";
import "./strings";

const BEATS = 3;
const LAST = BEATS - 1;
// The shaft is 144 levels deep; the beats sample it on the way down.
const LEVELS = ["000", "072", "144"];
const SCENES: number[] = [art.scene.descent, art.scene.niches, art.scene.door];

// Camera: scenes travel TRAVEL as they pass and swell while they leave; the idle drift never stops.
const TRAVEL = distance.page * 2;
const SCALE_REST = 1.04;
const SCALE_PASS = 1.16;
const DRIFT_SCALE = 1.03;
const DRIFT_MS = duration.long * 6;
const SCRIM_FIRST = 0.6;
const TAP_SLOP = 10;

export function DescentScreen() {
  const { t } = useTranslation("welcome");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [beat, setBeat] = useState(0);
  const depth = useSharedValue(0);
  const drift = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    drift.set(withRepeat(withTiming(1, timing(DRIFT_MS, ease.move)), -1, true));
    return () => drift.set(0);
  }, [reduced, drift]);

  const go = useCallback(
    (target: number) => {
      const next = Math.max(0, Math.min(LAST, target));
      if (next === beat) return;
      setBeat(next);
      depth.set(reduced ? withTiming(next, timing(duration.medium, ease.develop)) : withSpring(next, spring.descend));
    },
    [beat, reduced, depth],
  );

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (beat === 0) return false;
        go(beat - 1);
        return true;
      });
      return () => sub.remove();
    }, [beat, go]),
  );

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderRelease: (_, g) => {
          const tapped = Math.hypot(g.dx, g.dy) < TAP_SLOP;
          const target = tapped || g.dy <= -distance.page ? beat + 1 : g.dy >= distance.page ? beat - 1 : beat;
          if (target !== beat) {
            haptic.select();
            go(target);
          }
        },
      }),
    [beat, go],
  );

  const driftStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(drift.get(), [0, 1], [0, -distance.enter]) },
      { scale: interpolate(drift.get(), [0, 1], [1, DRIFT_SCALE]) },
    ],
  }));

  // The staircase is the picture on beat 0; later beats need the bottom dark enough for copy.
  const scrimStyle = useAnimatedStyle(() => ({ opacity: interpolate(depth.get(), [0, 1], [SCRIM_FIRST, 1], Extrapolation.CLAMP) }));

  const copyInset = insets.bottom + space.lg;
  const headerHeight = insets.top + space.md + COMPANION_SIZE;

  return (
    <View style={styles.root} {...pan.panHandlers}>
      <Animated.View style={[StyleSheet.absoluteFill, driftStyle]} pointerEvents="none">
        {SCENES.map((source, i) => (
          <SceneLayer key={i} index={i} depth={depth} source={source} reduced={reduced} />
        ))}
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, scrimStyle]} pointerEvents="none">
        <Scrim />
      </Animated.View>

      <BeatPage index={0} depth={depth} active={beat === 0} reduced={reduced}>
        <View style={{ paddingTop: headerHeight + space.xl, paddingHorizontal: space.lg, gap: space.md }}>
          <Animated.View entering={FadeIn.duration(duration.long).delay(duration.medium)}>
            <Text variant="hero" style={{ color: color.ash }} accessibilityRole="header">
              {t("descent.beat0.up")}
            </Text>
          </Animated.View>
          <Animated.View entering={FadeIn.duration(duration.long).delay(duration.medium + duration.long)}>
            <Text variant="hero">{t("descent.beat0.down")}</Text>
          </Animated.View>
        </View>
        <View style={styles.spacer} />
        <View style={[styles.descendRow, { paddingBottom: copyInset }]}>
          <DescendButton onPress={() => go(1)} />
        </View>
      </BeatPage>

      <BeatPage index={1} depth={depth} active={beat === 1} reduced={reduced}>
        <View style={{ height: headerHeight + space.md }} />
        <View style={styles.vessels}>
          <VesselDrift active={beat === 1} reduced={reduced} />
        </View>
        <View style={[styles.copy, { paddingBottom: copyInset }]}>
          <Text variant="title" accessibilityRole="header">
            {t("descent.beat1.title")}
          </Text>
          <Text variant="body" style={{ color: color.ash }}>
            {t("descent.beat1.body")}
          </Text>
          <View style={styles.descendRow}>
            <DescendButton onPress={() => go(2)} />
          </View>
        </View>
      </BeatPage>

      <BeatPage index={2} depth={depth} active={beat === 2} reduced={reduced}>
        <View style={styles.spacer} />
        <View style={[styles.copy, { paddingBottom: copyInset }]}>
          <Text variant="title" accessibilityRole="header">
            {t("descent.beat2.title")}
          </Text>
          <Text variant="body" style={{ color: color.ash }}>
            {t("descent.beat2.body")}
          </Text>
          <View style={styles.actions}>
            <Button label={t("descent.beat2.create")} accessibilityHint={t("descent.beat2.createHint")} onPress={() => router.push("/sign-up")} />
            <Button tone="ghost" label={t("descent.beat2.signIn")} accessibilityHint={t("descent.beat2.signInHint")} onPress={() => router.push("/sign-in")} />
          </View>
        </View>
      </BeatPage>

      <View style={[styles.header, { paddingTop: insets.top + space.md }]} pointerEvents="box-none">
        <Companion depth={depth} />
        <View style={styles.levelBox}>
          <Animated.View key={beat} entering={FadeIn.duration(duration.medium)} exiting={FadeOut.duration(duration.quick)} style={styles.levelItem}>
            <Text variant="label">{t("common:catalog.level", { n: LEVELS[beat] })}</Text>
            <Text variant="catalog" style={{ color: color.paper, textTransform: "uppercase" }}>
              {t(`descent.beat${beat}.place`)}
            </Text>
          </Animated.View>
        </View>
        {beat < LAST ? (
          <Animated.View entering={FadeIn.duration(duration.short)} exiting={FadeOut.duration(duration.quick)}>
            <Pressable accessibilityLabel={t("descent.skip")} accessibilityHint={t("descent.skipHint")} onPress={() => go(LAST)} style={styles.skip}>
              <Text variant="button" style={{ color: color.ash }}>
                {t("descent.skip")}
              </Text>
            </Pressable>
          </Animated.View>
        ) : null}
      </View>

      <View style={styles.gaugeWrap} pointerEvents="none">
        <LampDots depth={depth} count={BEATS} current={beat + 1} label={t("descent.progress", { current: beat + 1, total: BEATS })} />
      </View>
    </View>
  );
}

function SceneLayer({ index, depth, source, reduced }: { index: number; depth: SharedValue<number>; source: number; reduced: boolean }) {
  const style = useAnimatedStyle(() => {
    const p = depth.get();
    const input = [index - 1, index, index + 1];
    const opacity = interpolate(p, input, [0, 1, 0], Extrapolation.CLAMP);
    if (reduced) return { opacity };
    return {
      opacity,
      transform: [
        { translateY: interpolate(p, input, [TRAVEL, 0, -TRAVEL], Extrapolation.CLAMP) },
        { scale: interpolate(p, input, [1, SCALE_REST, SCALE_PASS], Extrapolation.CLAMP) },
      ],
    };
  });
  return (
    <Animated.View style={[styles.scene, style]}>
      <Image source={source} contentFit="cover" style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

function BeatPage({ index, depth, active, reduced, children }: { index: number; depth: SharedValue<number>; active: boolean; reduced: boolean; children: ReactNode }) {
  const style = useAnimatedStyle(() => {
    const p = depth.get();
    const opacity = interpolate(p, [index - 0.6, index, index + 0.6], [0, 1, 0], Extrapolation.CLAMP);
    if (reduced) return { opacity };
    return { opacity, transform: [{ translateY: interpolate(p, [index - 1, index, index + 1], [distance.page, 0, -distance.page], Extrapolation.CLAMP) }] };
  });
  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, style]}
      pointerEvents={active ? "box-none" : "none"}
      importantForAccessibility={active ? "auto" : "no-hide-descendants"}
      accessibilityElementsHidden={!active}
    >
      {children}
    </Animated.View>
  );
}

function DescendButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation("welcome");
  return (
    <Pressable accessibilityLabel={t("descent.next")} accessibilityHint={t("descent.nextHint")} onPress={onPress} style={styles.descend}>
      <Text variant="button" style={{ color: color.paper }}>
        {t("descent.next")}
      </Text>
      <View style={styles.chevron}>
        <Icon name="back" size={20} color={color.lamp} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.shaft },
  scene: { position: "absolute", left: 0, right: 0, top: -TRAVEL, bottom: -TRAVEL },
  spacer: { flex: 1 },
  vessels: { flex: 1, marginHorizontal: space.lg },
  copy: { paddingHorizontal: space.lg, gap: space.sm },
  actions: { gap: space.sm, paddingTop: space.md },
  descendRow: { alignItems: "center", paddingTop: space.sm },
  descend: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.xs, paddingHorizontal: space.lg },
  chevron: { transform: [{ rotate: "-90deg" }] },
  header: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", gap: space.md, paddingHorizontal: space.lg },
  levelBox: { flex: 1, height: 36 },
  levelItem: { position: "absolute", top: 0, left: 0, right: 0, gap: 2 },
  skip: { minHeight: 48, minWidth: 48, alignItems: "center", justifyContent: "center", paddingHorizontal: space.sm },
  gaugeWrap: { position: "absolute", top: 0, bottom: 0, right: space.sm, alignItems: "center", justifyContent: "center" },
});
