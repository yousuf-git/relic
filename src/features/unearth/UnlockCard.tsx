// A sealed relic whose date has come. Celebrated before anything else.
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { art } from "@/design/art";
import { color, radius, space } from "@/design/tokens";
import { localToday } from "@/features/ledger/dates";
import { agoLabel, excerpt } from "@/features/ledger/text";
import { develop } from "@/features/ledger/transitions";
import type { Relic } from "@/features/relics/api";
import { Glow } from "@/ui/Glow";
import { Icon } from "@/ui/Icon";
import { Pressable } from "@/ui/Pressable";
import { Text } from "@/ui/Text";

const SEAL = 72;

export function UnlockCard({ relics, today, onOpen }: { relics: Relic[]; today: string; onOpen: (id: string) => void }) {
  const { t } = useTranslation("unearth");
  const oldest = relics.reduce((a, b) => (a.created_at <= b.created_at ? a : b));
  const ago = agoLabel(localToday(new Date(oldest.created_at)), today);

  return (
    <Animated.View entering={develop} style={styles.card}>
      <View style={styles.seal}>
        <Glow size={SEAL * 2.4} tint={color.lamp} intensity={0.35} style={styles.glow} />
        <Image source={art.waxSeal} contentFit="cover" style={styles.sealImage} accessible={false} />
      </View>
      <Text variant="heading" accessibilityRole="header" style={styles.center}>
        {t("unlock.title", { count: relics.length })}
      </Text>
      <Text variant="bodySmall" style={styles.center}>
        {t("unlock.body", { count: relics.length, ago })}
      </Text>
      <View style={styles.list}>
        {relics.map((relic) => {
          const title = relic.title ?? excerpt(relic.body, 60) ?? t("ritual.untitled");
          return (
            <Pressable key={relic.id} onPress={() => onOpen(relic.id)} accessibilityLabel={t("unlock.open", { title })} style={styles.row}>
              <Text variant="body" numberOfLines={1} style={styles.rowText}>
                {title}
              </Text>
              <View style={styles.forward}>
                <Icon name="back" color={color.lamp} />
              </View>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.stone,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.lampDeep,
    padding: space.lg,
    gap: space.sm,
    alignItems: "center",
  },
  seal: { width: SEAL, height: SEAL, alignItems: "center", justifyContent: "center" },
  glow: { position: "absolute", left: -SEAL * 0.7, top: -SEAL * 0.7 },
  sealImage: { width: SEAL, height: SEAL, borderRadius: SEAL / 2 },
  center: { textAlign: "center" },
  list: { alignSelf: "stretch", marginTop: space.xs },
  row: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.ironHigh,
  },
  rowText: { flex: 1 },
  forward: { transform: [{ rotate: "180deg" }] },
});
