// "A relic surfaced from Level N": the day's relic. On the first view of the day
// it drops out of the duck and its words develop; afterwards it simply rests here.
import { Image } from "expo-image";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { art } from "@/design/art";
import { distance, duration, ease, spring, timing } from "@/design/motion";
import { color, moodLight, radius, space } from "@/design/tokens";
import { agoLabel, excerpt } from "@/features/ledger/text";
import { develop } from "@/features/ledger/transitions";
import { formatMonth, levelOf } from "@/features/vault/format";
import { Button } from "@/ui/Button";
import { Glow } from "@/ui/Glow";
import { Text } from "@/ui/Text";
import { ritual, TOKEN_RISE } from "./ritual";
import type { Surfaced } from "./selection";

const PLATE = 128;

export function RitualCard({ surfaced, today, animate, onOpen }: { surfaced: Surfaced; today: string; animate: boolean; onOpen: () => void }) {
  const { t } = useTranslation("unearth");
  const { relic } = surfaced;
  const tint = moodLight[relic.mood];

  const drop = useSharedValue(animate ? 0 : 1);
  const words = useSharedValue(animate ? 0 : 1);
  useEffect(() => {
    if (!animate) return;
    drop.set(withDelay(ritual.token, withSpring(1, spring.drop)));
    words.set(withDelay(ritual.words, withTiming(1, timing(duration.medium, ease.develop))));
  }, [animate, drop, words]);

  const tokenStyle = useAnimatedStyle(() => {
    const d = drop.get();
    return {
      opacity: interpolate(d, [0, 0.25], [0, 1], Extrapolation.CLAMP),
      transform: [{ translateY: (1 - d) * -TOKEN_RISE }, { scale: 0.6 + 0.4 * d }],
    };
  });
  const wordsStyle = useAnimatedStyle(() => ({
    opacity: words.get(),
    transform: [{ translateY: (1 - words.get()) * distance.nudge }],
  }));

  const body = excerpt(relic.body, 180);
  const heading = relic.title ?? body ?? t("ritual.untitled");
  const reason =
    surfaced.reason === "onThisDay"
      ? t("ritual.reason.onThisDay", { count: surfaced.yearsAgo })
      : t("ritual.reason.deep", { ago: agoLabel(relic.occurred_on, today) });
  const catalog = `${formatMonth(relic.occurred_on)} · ${reason}`.toUpperCase();

  return (
    <Animated.View entering={develop} style={styles.card}>
      <Text variant="label" accessibilityRole="header" style={styles.eyebrow}>
        {t("ritual.surfaced", { level: levelOf(relic.occurred_on, today) })}
      </Text>
      <View style={styles.tokenBox}>
        <Animated.View style={[styles.token, tokenStyle]}>
          <Glow size={PLATE * 2} tint={tint} intensity={0.45} style={styles.glow} />
          <View style={[styles.plate, { borderColor: tint }]}>
            <Image source={art.vessel[relic.vessel]} contentFit="cover" style={StyleSheet.absoluteFill} accessible={false} />
          </View>
        </Animated.View>
      </View>
      <Animated.View style={[styles.words, wordsStyle]}>
        <Text variant="heading" style={styles.center} numberOfLines={3}>
          {heading}
        </Text>
        {relic.title && body ? (
          <Text variant="body" style={styles.center} numberOfLines={4}>
            {body}
          </Text>
        ) : null}
        <Text variant="catalog" style={styles.center}>
          {catalog}
        </Text>
      </Animated.View>
      <Button label={t("ritual.open")} onPress={onOpen} style={styles.open} accessibilityHint={t("ritual.openHint", { title: heading })} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.stone,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.iron,
    padding: space.lg,
    gap: space.md,
  },
  eyebrow: { textAlign: "center" },
  tokenBox: { height: PLATE, alignItems: "center", justifyContent: "center" },
  token: { width: PLATE, height: PLATE },
  glow: { position: "absolute", left: -PLATE / 2, top: -PLATE / 2 },
  plate: { width: PLATE, height: PLATE, borderRadius: radius.md, borderWidth: 1, overflow: "hidden", backgroundColor: color.shaft },
  words: { gap: space.xs, alignItems: "center" },
  center: { textAlign: "center" },
  open: { marginTop: space.xs },
});
