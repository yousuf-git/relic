import { Modal, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { color, radius, space } from "@/design/tokens";
import { Button } from "@/ui/Button";
import { Text } from "@/ui/Text";
import "./i18n";

/** Asks before an unsealed relic is let go. */
export function LeaveSheet({ visible, onKeep, onLetGo }: { visible: boolean; onKeep: () => void; onLetGo: () => void }) {
  const { t } = useTranslation("preserve");
  const insets = useSafeAreaInsets();
  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onKeep}>
      <View style={styles.scrim}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + space.md }]} accessibilityViewIsModal>
          <Text variant="heading" accessibilityRole="header">
            {t("leave.title")}
          </Text>
          <Text variant="body">{t("leave.body")}</Text>
          <Button label={t("leave.keep")} onPress={onKeep} />
          <Button tone="danger" label={t("leave.letGo")} onPress={onLetGo} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: "flex-end", backgroundColor: color.scrim },
  sheet: {
    gap: space.md,
    padding: space.lg,
    backgroundColor: color.stone,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.iron,
  },
});
