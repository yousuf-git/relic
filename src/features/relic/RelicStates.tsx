import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { color, space } from "@/design/tokens";
import { isOfflineError, LoadingShaft } from "@/features/vault/VaultStates";
import { Button } from "@/ui/Button";
import { Text } from "@/ui/Text";
import "./i18n";

export function RelicLoading() {
  return (
    <View style={styles.center}>
      <LoadingShaft />
    </View>
  );
}

/** The relic could not be fetched, or no longer exists. */
export function RelicMissing({ error, onRetry, onBack }: { error: unknown; onRetry: () => void; onBack: () => void }) {
  const { t } = useTranslation("relic");
  const offline = error ? isOfflineError(error) : false;
  return (
    <View style={styles.center}>
      <Text variant="title" style={styles.text}>
        {offline ? t("missing.offlineTitle") : t("missing.title")}
      </Text>
      <Text variant="bodySmall" style={styles.text} accessibilityLiveRegion="polite">
        {offline ? t("common:errors.offline") : t("missing.body")}
      </Text>
      {offline ? <Button label={t("common:actions.retry")} tone="ghost" onPress={onRetry} /> : null}
      <Button label={t("common:actions.back")} tone="quiet" onPress={onBack} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", gap: space.sm, padding: space.lg, backgroundColor: color.shaft },
  text: { textAlign: "center" },
});
