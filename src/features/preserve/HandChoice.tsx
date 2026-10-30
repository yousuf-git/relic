// "What's in your hand?" Three tactile choices, each shown as the vessel it becomes.
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { art } from "@/design/art";
import { haptic } from "@/design/haptics";
import { useReducedMotion } from "@/design/motion";
import { color, font, radius, space, type Vessel } from "@/design/tokens";
import { Pressable } from "@/ui/Pressable";
import { Text } from "@/ui/Text";
import { enterUp } from "./motion";
import "./i18n";

export type Start = "words" | "voice" | "photo";

const OPTIONS: { mode: Start; vessel: Vessel }[] = [
  { mode: "words", vessel: "letter" },
  { mode: "voice", vessel: "shell" },
  { mode: "photo", vessel: "plate" },
];

export function HandChoice({ prompt, onChoose }: { prompt?: string; onChoose: (mode: Start) => void }) {
  const { t } = useTranslation("preserve");
  const reduced = useReducedMotion();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + space.md }]}>
      <Animated.View entering={enterUp(reduced)} style={styles.heading}>
        <Text variant="title" accessibilityRole="header">
          {t("hand.heading")}
        </Text>
        <Text variant="bodySmall">{t("hand.sub")}</Text>
      </Animated.View>
      {prompt ? (
        <Animated.View entering={enterUp(reduced, 1)} style={styles.prompt}>
          <Text variant="label">{t("hand.prompt")}</Text>
          <Text variant="body" style={styles.promptText}>
            {prompt}
          </Text>
        </Animated.View>
      ) : null}
      {OPTIONS.map(({ mode, vessel }, i) => (
        <Animated.View key={mode} entering={enterUp(reduced, i + 2)}>
          <Pressable
            haptics={false}
            onPress={() => {
              haptic.lift(vessel);
              onChoose(mode);
            }}
            accessibilityLabel={t(`hand.${mode}.title`)}
            accessibilityHint={t(`hand.${mode}.hint`)}
            style={styles.card}
          >
            <Image source={art.vessel[vessel]} contentFit="cover" style={styles.art} />
            <View style={styles.cardText}>
              <Text variant="heading">{t(`hand.${mode}.title`)}</Text>
              <Text variant="bodySmall">{t(`hand.${mode}.hint`)}</Text>
            </View>
          </Pressable>
        </Animated.View>
      ))}
    </View>
  );
}

const ART = 96;

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: space.md, paddingTop: space.lg, gap: space.md },
  heading: { gap: space.xs, marginBottom: space.xs },
  prompt: { gap: space.xs, paddingVertical: space.sm, paddingLeft: space.md, borderLeftWidth: 2, borderLeftColor: color.lampDeep },
  promptText: { fontFamily: font.bodyItalic },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    padding: space.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.iron,
    backgroundColor: color.stone,
    minHeight: ART + space.md,
  },
  art: { width: ART, height: ART, borderRadius: radius.md, backgroundColor: color.shaft },
  cardText: { flex: 1, gap: space.xxs },
});
