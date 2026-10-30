// The catalog card: the relic as an archive entry, in typed monospace.
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { color, radius, space } from "@/design/tokens";
import { Icon } from "@/ui/Icon";
import { Text } from "@/ui/Text";
import "./i18n";

export type CatalogRow = { label: string; value: string };

export function CatalogCard({ number, rows }: { number: number | null; rows: CatalogRow[] }) {
  const { t } = useTranslation("relic");
  const n = number === null ? "––––" : String(number).padStart(4, "0");
  return (
    <View style={styles.card} accessible accessibilityLabel={[t("common:catalog.relicNo", { n }), ...rows.map((r) => `${r.label}: ${r.value}`)].join(". ")}>
      <View style={styles.head}>
        <Icon name="nut" size={18} color={color.lamp} />
        <Text variant="label" style={styles.number}>
          {t("common:catalog.relicNo", { n })}
        </Text>
      </View>
      {rows.map((row) => (
        <View key={row.label} style={styles.row}>
          <Text variant="label" style={styles.key}>
            {row.label}
          </Text>
          <Text variant="catalog" style={styles.value}>
            {row.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: color.ironHigh, borderRadius: radius.sm, backgroundColor: color.stone, padding: space.md, gap: space.xs },
  head: { flexDirection: "row", alignItems: "center", gap: space.xs, paddingBottom: space.xs, marginBottom: space.xxs, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: color.ironHigh },
  number: { color: color.paper },
  row: { flexDirection: "row", gap: space.sm },
  key: { width: 76 },
  value: { flex: 1, color: color.paper },
});
