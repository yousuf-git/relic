import { StyleSheet, View } from "react-native";
import { color, space } from "@/design/tokens";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { Text } from "@/ui/Text";
import { useWaitlist, useWaitlistMembership } from "./api";
import { useQ } from "./strings";
import { Bone, Panel, PanelHead, RetryNote } from "./ui";

export function Waitlist() {
  const { t } = useQ();
  const status = useWaitlist();
  const { join, leave } = useWaitlistMembership();
  const joined = status.data === true;
  const failed = join.isError || leave.isError;

  return (
    <Panel>
      <PanelHead label={t("waitlist.label")} title={t("waitlist.title")} body={t("waitlist.body")} />
      {status.data === undefined && status.isError ? (
        <RetryNote message={t("waitlist.loadFailed")} retryLabel={t("retry")} onRetry={() => status.refetch()} />
      ) : status.data === undefined ? (
        <Bone width="100%" height={space.xxl} />
      ) : joined ? (
        <View style={styles.joined} accessibilityLiveRegion="polite">
          <View style={styles.joinedRow}>
            <Icon name="check" color={color.lamp} />
            <Text variant="body">{t("waitlist.joined")}</Text>
          </View>
          <Text variant="bodySmall">{t("waitlist.joinedLine")}</Text>
          <Button tone="quiet" label={t("waitlist.leave")} loading={leave.isPending} onPress={() => leave.mutate()} />
        </View>
      ) : (
        <Button
          tone="ghost"
          label={join.isPending ? t("waitlist.joining") : t("waitlist.join")}
          loading={join.isPending}
          onPress={() => join.mutate()}
        />
      )}
      {failed ? (
        <Text variant="bodySmall" accessibilityLiveRegion="polite" style={styles.error}>
          {t("waitlist.failed")}
        </Text>
      ) : null}
    </Panel>
  );
}

const styles = StyleSheet.create({
  joined: { gap: space.xs, alignItems: "flex-start" },
  joinedRow: { flexDirection: "row", alignItems: "center", gap: space.xs },
  error: { color: color.danger },
});
