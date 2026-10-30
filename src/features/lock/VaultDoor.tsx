// The vault door: the lock screen. Unlocking draws the bolts, the door swings toward the light,
// and the lamp light floods in. Reduced motion: the screen simply fades away.
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AccessibilityInfo, BackHandler, StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, { FadeIn, interpolate, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { haptic } from "@/design/haptics";
import { duration, ease, timing, useReducedMotion } from "@/design/motion";
import { color, space } from "@/design/tokens";
import { Scrim } from "@/features/welcome/Scene";
import { Button } from "@/ui/Button";
import { Glow } from "@/ui/Glow";
import { Text } from "@/ui/Text";
import { authenticate, getLockCapability, type AuthFailure, type LockCapability } from "./biometrics";
import { DoorImage } from "./DoorBackdrop";
import { disableAppLock, unlockNow, useLockSession, useLockStore } from "./store";
import "./strings";

// Where the light spills out of the door in scene-door.webp, as fractions of the screen.
const SLIT = { x: 0.48, y: 0.55 };
const ZOOM = 1.3;
const FLOOD_FROM = 0.2;
const FLOOD_PEAK = 0.85;
// Let the cover and the door settle before the system prompt appears over them.
const PROMPT_DELAY = duration.long;

export function VaultDoor() {
  const { t } = useTranslation("lock");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const [capability, setCapability] = useState<LockCapability | null>(null);
  const [checking, setChecking] = useState(false);
  const [opening, setOpening] = useState(false);
  const [notice, setNotice] = useState<Exclude<AuthFailure, "unavailable"> | null>(null);
  const open = useSharedValue(0);
  const busy = useRef(false);
  const mounted = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const leave = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }, [router]);

  useEffect(() => {
    mounted.current = true;
    const pending = timers.current;
    return () => {
      mounted.current = false;
      pending.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    getLockCapability().then((c) => mounted.current && setCapability(c));
    // Opened by hand (a stray link) with nothing to unlock: step back out.
    const lock = useLockStore.getState().enabled && useLockSession.getState().locked;
    if (!busy.current && useLockSession.getState().hydrated && !lock) leave();
  }, [leave]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!opening) BackHandler.exitApp();
      return true;
    });
    return () => sub.remove();
  }, [opening]);

  const swing = useCallback(() => {
    busy.current = true;
    setOpening(true);
    unlockNow();
    AccessibilityInfo.announceForAccessibility(t("door.opened"));
    if (reduced) {
      open.set(withTiming(1, timing(duration.medium, ease.develop)));
      later(leave, duration.medium);
      return;
    }
    // Two bolts draw back, then the weight of the door.
    haptic.press();
    later(() => haptic.press(), duration.quick);
    later(() => haptic.land(), duration.medium);
    open.set(withTiming(1, timing(duration.long, ease.move)));
    later(leave, duration.long);
  }, [t, reduced, open, later, leave]);

  const unbolt = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setChecking(true);
    setNotice(null);
    const result = await authenticate("unlock");
    if (!mounted.current) return;
    setChecking(false);
    if (result.ok) {
      swing();
      return;
    }
    busy.current = false;
    if (result.reason === "unavailable") setCapability("none");
    else setNotice(result.reason);
  }, [swing]);

  useEffect(() => {
    const id = setTimeout(unbolt, PROMPT_DELAY);
    return () => clearTimeout(id);
  }, [unbolt]);

  // No screen lock left on the phone: the door cannot be bolted, so turn the lock off and let them in.
  const openAnyway = async () => {
    busy.current = true;
    await disableAppLock();
    if (mounted.current) swing();
  };

  const doorStyle = useAnimatedStyle(() => {
    if (reduced) return {};
    const s = interpolate(open.get(), [0, 1], [1, ZOOM]);
    // Zoom about the slit of light so it stays put while the door fills the screen.
    return { transform: [{ translateX: -(s - 1) * (SLIT.x * width - width / 2) }, { translateY: -(s - 1) * (SLIT.y * height - height / 2) }, { scale: s }] };
  });
  const floodStyle = useAnimatedStyle(() => ({
    opacity: interpolate(open.get(), [0, 0.4, 1], [0, FLOOD_PEAK, FLOOD_PEAK]),
    transform: [{ scale: interpolate(open.get(), [0, 1], [FLOOD_FROM, 1]) }],
  }));
  const uiStyle = useAnimatedStyle(() => ({ opacity: interpolate(open.get(), [0, 0.35], [1, 0], "clamp") }));

  const unavailable = capability === "none";
  const flood = Math.max(width, height) * 1.4;

  return (
    <View style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFill, doorStyle]}>
        <DoorImage />
      </Animated.View>
      <Scrim top={0.35} clearTo={0.4} />
      {reduced ? null : (
        <Animated.View style={[styles.flood, { left: SLIT.x * width - flood / 2, top: SLIT.y * height - flood / 2 }, floodStyle]} pointerEvents="none">
          <Glow size={flood} tint={color.lamp} intensity={0.55} />
        </Animated.View>
      )}
      <Animated.View style={[styles.ui, { paddingBottom: insets.bottom + space.lg }, uiStyle]} pointerEvents="box-none">
        <Animated.View entering={FadeIn.delay(duration.medium).duration(duration.medium)} style={styles.copy}>
          <Text variant="label">{t("door.eyebrow")}</Text>
          <Text variant="title" accessibilityRole="header">
            {unavailable ? t("unavailable.title") : t("door.title")}
          </Text>
          <Text variant="body" style={{ color: color.ash }}>
            {unavailable ? t("unavailable.body") : capability === "device" ? t("door.bodyDevice") : t("door.body")}
          </Text>
          {notice ? (
            <Text variant="bodySmall" style={{ color: notice === "cancelled" ? color.ash : color.danger }} accessibilityLiveRegion="polite">
              {t(`notice.${notice}`)}
            </Text>
          ) : null}
          <View style={styles.action}>
            {unavailable ? (
              <Button label={t("unavailable.action")} disabled={opening} onPress={openAnyway} />
            ) : (
              <Button label={t("door.unbolt")} loading={checking} disabled={opening} onPress={unbolt} />
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.shaft },
  flood: { position: "absolute" },
  ui: { ...StyleSheet.absoluteFill, justifyContent: "flex-end", paddingHorizontal: space.lg },
  copy: { gap: space.sm },
  action: { paddingTop: space.md },
});
