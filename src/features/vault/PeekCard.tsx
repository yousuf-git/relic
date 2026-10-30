// The lifted relic: shown while the keeper holds a niche, gone on release.
import { useTranslation } from "react-i18next";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { duration, ease } from "@/design/motion";
import { color, moodLight, radius, space } from "@/design/tokens";
import { isSealed, type Relic } from "@/features/relics/api";
import { Text } from "@/ui/Text";
import { excerpt, formatDay, relicTitle } from "./format";
import { VesselArt } from "./VesselArt";
import { WaxSeal } from "./WaxSeal";
import "./i18n";

const ART = 168;
const MAX_CARD = 340;

export function PeekCard({ relic, today }: { relic: Relic; today: string }) {
  const { t } = useTranslation("vault");
  const { width } = useWindowDimensions();
  const sealed = isSealed(relic, today);
  return (
    <Animated.View
      pointerEvents="none"
      entering={FadeIn.duration(duration.short).easing(ease.enter)}
      exiting={FadeOut.duration(duration.quick).easing(ease.exit)}
      style={[StyleSheet.absoluteFill, styles.scrim]}
    >
      <View style={[styles.card, { width: Math.min(MAX_CARD, width - space.lg * 2), borderColor: moodLight[relic.mood] }]}>
        <View style={styles.art}>
          <VesselArt vessel={relic.vessel} size={ART} style={sealed ? { opacity: 0.4 } : undefined} />
          {sealed ? <WaxSeal size={52} style={styles.seal} /> : null}
        </View>
        {sealed && relic.sealed_until ? (
          <>
            <Text variant="heading">{t("sealed.title")}</Text>
            <Text variant="catalog">{t("sealed.opens", { date: formatDay(relic.sealed_until) })}</Text>
          </>
        ) : (
          <>
            <Text variant="label">{[formatDay(relic.occurred_on), relic.place_name].filter(Boolean).join("  ·  ")}</Text>
            <Text variant="heading" style={styles.title}>
              {relicTitle(relic, t)}
            </Text>
            {relic.body?.trim() ? (
              <Text variant="bodySmall" numberOfLines={6} style={styles.excerpt}>
                {excerpt(relic.body, 280)}
              </Text>
            ) : null}
          </>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scrim: { backgroundColor: color.scrim, alignItems: "center", justifyContent: "center" },
  card: {
    alignItems: "center",
    gap: space.xs,
    padding: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: color.stone,
  },
  art: { alignItems: "center", justifyContent: "center", marginBottom: space.xs },
  seal: { position: "absolute" },
  title: { textAlign: "center" },
  excerpt: { textAlign: "center", color: color.paper },
});
