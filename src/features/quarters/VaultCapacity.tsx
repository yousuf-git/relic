import { StyleSheet, View } from "react-native";
import { color, space } from "@/design/tokens";
import { useUsage } from "@/features/relics/api";
import { Text } from "@/ui/Text";
import { formatMb } from "./format";
import { useQ } from "./strings";
import { Bone, Divider, Gauge, Panel, PanelHead, RetryNote, WaxSeals } from "./ui";

const LOW_AT = 0.9;

export function VaultCapacity() {
  const { t } = useQ();
  const usage = useUsage();
  const u = usage.data;

  return (
    <Panel>
      <PanelHead label={t("capacity.label")} title={t("capacity.title")} />

      {usage.isError && !u ? (
        <RetryNote message={t("capacity.error")} retryLabel={t("retry")} onRetry={() => usage.refetch()} />
      ) : !u ? (
        <View style={styles.loading}>
          <Bone width="50%" height={space.lg} />
          <Bone width="100%" />
          <Bone width="70%" />
        </View>
      ) : (
        <>
          <Oil used={u.bytes_used} limit={u.bytes_limit} />
          <Divider />
          <View style={styles.seals}>
            <Text variant="label">{t("capacity.sealsLabel")}</Text>
            {u.relics_today_limit === null ? (
              <Text variant="bodySmall">{t("capacity.sealsOpen", { n: u.relics_today })}</Text>
            ) : (
              <>
                <WaxSeals
                  used={u.relics_today}
                  total={u.relics_today_limit}
                  label={t("capacity.sealsCount", { n: u.relics_today, limit: u.relics_today_limit })}
                />
                <Text variant="bodySmall">
                  {t("capacity.sealsCount", { n: u.relics_today, limit: u.relics_today_limit })}
                  {u.relics_today >= u.relics_today_limit ? ` ${t("capacity.sealsSpent")}` : ""}
                </Text>
              </>
            )}
          </View>
        </>
      )}
    </Panel>
  );
}

function Oil({ used, limit }: { used: number; limit: number | null }) {
  const { t } = useQ();
  if (limit === null) {
    return (
      <View style={styles.oil}>
        <Text variant="heading">{t("capacity.usedOnly", { used: formatMb(used) })}</Text>
        <Text variant="bodySmall">{t("capacity.unlimited")}</Text>
      </View>
    );
  }
  const fraction = limit > 0 ? used / limit : 1;
  const full = used >= limit;
  const low = fraction >= LOW_AT;
  const valueText = t("capacity.gaugeValue", { used: formatMb(used), limit: formatMb(limit) });
  return (
    <View style={styles.oil}>
      <View style={styles.figures}>
        <Text variant="heading">{t("capacity.usedOf", { used: formatMb(used), limit: formatMb(limit) })}</Text>
        <Text variant="catalog">{t("capacity.left", { left: formatMb(Math.max(0, limit - used)) })}</Text>
      </View>
      <Gauge fraction={fraction} tone={low ? "low" : "lamp"} label={t("capacity.gaugeLabel")} valueText={valueText} />
      <Text variant="bodySmall" style={low ? styles.warn : undefined}>
        {full ? t("capacity.full") : low ? t("capacity.low") : t("capacity.note")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { gap: space.sm },
  oil: { gap: space.sm },
  figures: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: space.sm, flexWrap: "wrap" },
  warn: { color: color.paper },
  seals: { gap: space.sm },
});
