// A sealed relic holds its words, plates and voice back; only the wait is shown.
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { color, space } from "@/design/tokens";
import { daysUntil, formatDay } from "@/features/vault/format";
import { Icon } from "@/ui/Icon";
import { Text } from "@/ui/Text";
import "./i18n";

export function SealedPanel({ sealedUntil }: { sealedUntil: string }) {
  const { t } = useTranslation("relic");
  const days = Math.max(1, daysUntil(sealedUntil));
  return (
    <View style={styles.wrap} accessible accessibilityLabel={t("sealed.a11y", { days, date: formatDay(sealedUntil) })}>
      <Icon name="hourglass" size={28} color={color.lamp} />
      <Text variant="hero" style={styles.count}>
        {t("sealed.countdown", { count: days })}
      </Text>
      <Text variant="label">{t("sealed.until", { date: formatDay(sealedUntil) })}</Text>
      <Text variant="body" style={styles.note}>
        {t("sealed.note")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: space.sm, paddingVertical: space.lg },
  count: { textAlign: "center" },
  note: { textAlign: "center", color: color.ash, marginTop: space.xs },
});
