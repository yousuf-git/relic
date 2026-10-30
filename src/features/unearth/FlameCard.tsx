import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { color, space } from "@/design/tokens";
import { Icon } from "@/ui/Icon";
import { Text } from "@/ui/Text";
import type { Flame } from "./streak";

/** Keeping the flame. Never a scoreboard: a lapsed run is met with an open door. */
export function flameMessageKey(flame: Flame): "litToday" | "waiting" | "resting" | "none" {
  if (flame.current > 0) return flame.keptToday ? "litToday" : "waiting";
  return flame.longest > 0 ? "resting" : "none";
}

export function FlameCard({ flame }: { flame: Flame }) {
  const { t } = useTranslation("unearth");
  const lit = flame.current > 0;
  return (
    <View style={styles.section}>
      <Text variant="label" accessibilityRole="header">
        {t("flame.title")}
      </Text>
      <View style={styles.row}>
        <Icon name="flame" size={32} color={lit ? color.lamp : color.faint} />
        <View style={styles.text}>
          {lit ? (
            <Text variant="heading" accessibilityLabel={t("flame.lit", { count: flame.current })}>
              {t("flame.lit", { count: flame.current })}
            </Text>
          ) : null}
          <Text variant="bodySmall">{t(`flame.${flameMessageKey(flame)}`)}</Text>
          {flame.longest > flame.current && flame.longest > 1 ? <Text variant="catalog">{t("flame.longest", { count: flame.longest })}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.sm },
  row: { flexDirection: "row", gap: space.md, alignItems: "flex-start" },
  text: { flex: 1, gap: space.xxs },
});
