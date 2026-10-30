// Thumb-zone actions: share, reopen, release.
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { color, minTarget, space } from "@/design/tokens";
import { Icon, type IconName } from "@/ui/Icon";
import { Pressable } from "@/ui/Pressable";
import { Text } from "@/ui/Text";
import "./i18n";

type Item = { icon: IconName; label: string; onPress: () => void; tone?: "danger" };

export function ActionBar({ sealed, onShare, onReopen, onRelease }: { sealed: boolean; onShare: () => void; onReopen: () => void; onRelease: () => void }) {
  const { t } = useTranslation("relic");
  const insets = useSafeAreaInsets();
  // A sealed relic cannot be shared or reopened; releasing it is still the keeper's right.
  const items: Item[] = sealed
    ? [{ icon: "release", label: t("actions.release"), onPress: onRelease, tone: "danger" }]
    : [
        { icon: "share", label: t("actions.share"), onPress: onShare },
        { icon: "edit", label: t("actions.reopen"), onPress: onReopen },
        { icon: "release", label: t("actions.release"), onPress: onRelease, tone: "danger" },
      ];
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.sm) }]}>
      {items.map((item) => {
        const tint = item.tone === "danger" ? color.danger : color.paper;
        return (
          <Pressable key={item.icon} accessibilityLabel={item.label} onPress={item.onPress} style={styles.item}>
            <Icon name={item.icon} color={tint} />
            <Text variant="label" style={{ color: tint }}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const ACTION_BAR_HEIGHT = minTarget + space.xl;

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: space.xs,
    backgroundColor: color.shaft,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.iron,
  },
  item: { minWidth: minTarget + space.lg, minHeight: minTarget + space.sm, alignItems: "center", justifyContent: "center", gap: space.xxs },
});
