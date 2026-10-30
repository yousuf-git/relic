// Descend to a level: every month that holds relics, newest first.
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, StyleSheet, View } from "react-native";
import { color, minTarget, space } from "@/design/tokens";
import { Icon } from "@/ui/Icon";
import { Pressable } from "@/ui/Pressable";
import { Text } from "@/ui/Text";
import { Drawer } from "./Drawer";
import type { LevelStop } from "./layout";
import "./i18n";

const ROW = minTarget + space.xs;

type Props = {
  open: boolean;
  onClose: () => void;
  stops: LevelStop[];
  currentIndex: number;
  onJump: (stop: LevelStop) => void;
};

export const LevelDrawer = memo(function LevelDrawer({ open, onClose, stops, currentIndex, onJump }: Props) {
  const { t } = useTranslation("vault");
  return (
    <Drawer open={open} onClose={onClose} side="right" closeLabel={t("levels.close")}>
      <View style={styles.head}>
        <Text variant="heading">{t("levels.title")}</Text>
        <Pressable accessibilityLabel={t("levels.close")} onPress={onClose} style={styles.close}>
          <Icon name="close" />
        </Pressable>
      </View>
      <FlatList
        data={stops}
        keyExtractor={(s) => String(s.levelIndex)}
        getItemLayout={(_, index) => ({ length: ROW, offset: ROW * index, index })}
        initialScrollIndex={Math.max(0, Math.min(currentIndex, stops.length - 1))}
        renderItem={({ item }) => (
          <Pressable
            accessibilityLabel={t("levels.a11y", { level: item.level, month: item.month, count: item.count })}
            accessibilityState={{ selected: item.levelIndex === currentIndex }}
            onPress={() => onJump(item)}
            style={[styles.row, item.levelIndex === currentIndex && styles.rowOn]}
          >
            <Text variant="label" style={{ color: color.paper, width: space.xxxl }}>
              {t("level", { n: item.level })}
            </Text>
            <Text variant="label" style={{ flex: 1 }}>
              {item.month}
            </Text>
            <Text variant="label">{item.count}</Text>
          </Pressable>
        )}
      />
    </Drawer>
  );
});

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: space.md, paddingBottom: space.sm },
  close: { width: minTarget, height: minTarget, alignItems: "center", justifyContent: "center" },
  row: { height: ROW, flexDirection: "row", alignItems: "center", gap: space.sm, paddingHorizontal: space.md, borderLeftWidth: 2, borderLeftColor: "transparent" },
  rowOn: { borderLeftColor: color.lamp, backgroundColor: color.iron },
});
