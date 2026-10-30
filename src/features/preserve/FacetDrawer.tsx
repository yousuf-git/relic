import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { useReducedMotion } from "@/design/motion";
import { color, radius, space } from "@/design/tokens";
import { Button } from "@/ui/Button";
import { Text } from "@/ui/Text";
import { enterUp } from "./motion";
import "./i18n";

/** The one open drawer: a title, a quiet hint, the control, and a way to close it. */
export function FacetDrawer({
  title,
  hint,
  onClose,
  children,
}: {
  title: string;
  hint?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { t } = useTranslation("preserve");
  const reduced = useReducedMotion();
  return (
    <Animated.View entering={enterUp(reduced)} style={styles.panel}>
      <View style={styles.header} accessibilityRole="header">
        <Text variant="heading">{title}</Text>
        {hint ? <Text variant="bodySmall">{hint}</Text> : null}
      </View>
      {children}
      <Button tone="quiet" label={t("drawer.done")} onPress={onClose} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: color.stone, borderWidth: 1, borderColor: color.iron, borderRadius: radius.md, padding: space.md, gap: space.md },
  header: { gap: space.xxs },
});
