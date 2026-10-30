// The surface: the duck, a greeting, and today's relics as wax seals.
import { Image } from "expo-image";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { art, duckStage } from "@/design/art";
import { color, minTarget, space } from "@/design/tokens";
import { Text } from "@/ui/Text";
import { GAUGE_WIDTH } from "./layout";
import { WaxSeal } from "./WaxSeal";
import "./i18n";

const DUCK_WIDTH = 60;
const DUCK_HEIGHT = 80;
const SEAL = 22;

function greetingKey(hour: number): "morning" | "afternoon" | "evening" | "night" {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 22) return "evening";
  return "night";
}

type Props = {
  name: string;
  /** Null while the vault is still being unearthed. */
  relicCount: number | null;
  todayCount: number;
  todayLimit: number | null | undefined;
  refreshing: boolean;
};

export const VaultHeader = memo(function VaultHeader({ name, relicCount, todayCount, todayLimit, refreshing }: Props) {
  const { t } = useTranslation("vault");
  const insets = useSafeAreaInsets();
  const duck = refreshing ? art.duck.tilt : art.duck[duckStage(relicCount ?? 0)];
  const seals = todayLimit ?? 0;
  return (
    <View style={[styles.root, { paddingTop: insets.top + space.md }]}>
      <View style={styles.duck}>
        <Image source={duck} contentFit="cover" transition={120} accessible={false} style={styles.duckImage} />
      </View>
      <View style={styles.copy}>
        <Text variant="heading" numberOfLines={2}>
          {t(`greeting.${greetingKey(new Date().getHours())}`, { name })}
        </Text>
        {relicCount === null ? null : <Text variant="label">{t("header.kept", { count: relicCount })}</Text>}
        <View
          style={styles.seals}
          accessible
          accessibilityLabel={todayLimit ? t("header.sealsA11y", { count: todayCount, limit: todayLimit }) : t("header.todayOpen", { count: todayCount })}
        >
          {seals > 0
            ? Array.from({ length: seals }, (_, i) => <WaxSeal key={i} size={SEAL} dim={i >= todayCount} />)
            : null}
          <Text variant="label" style={styles.sealText}>
            {todayLimit ? t("header.today", { count: todayCount, limit: todayLimit }) : t("header.todayOpen", { count: todayCount })}
          </Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: { flexDirection: "row", alignItems: "center", gap: space.md, paddingLeft: space.md, paddingRight: GAUGE_WIDTH, paddingBottom: space.lg, minHeight: minTarget * 3 },
  duck: {
    width: DUCK_WIDTH,
    height: DUCK_HEIGHT,
    overflow: "hidden",
    borderTopLeftRadius: DUCK_WIDTH / 2,
    borderTopRightRadius: DUCK_WIDTH / 2,
    borderBottomLeftRadius: space.xs,
    borderBottomRightRadius: space.xs,
    borderWidth: 1,
    borderColor: color.iron,
    backgroundColor: color.shaft,
  },
  duckImage: { width: DUCK_WIDTH, height: DUCK_HEIGHT },
  copy: { flex: 1, gap: space.xs },
  seals: { flexDirection: "row", alignItems: "center", gap: space.xxs },
  sealText: { marginLeft: space.xs },
});
