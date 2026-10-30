import * as Notifications from "expo-notifications";
import { useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { color, minTarget, space } from "@/design/tokens";
import type { Profile } from "@/features/account/profile";
import { Icon } from "@/ui/Icon";
import { Pressable } from "@/ui/Pressable";
import { Text } from "@/ui/Text";
import { toast } from "@/ui/Toast";
import { readPrefs, useSavePrefs, type NotificationPrefs } from "./api";
import { useQ } from "./strings";
import { Divider, Panel, PanelHead, SwitchRow } from "./ui";
import { TimeSheet } from "./TimeSheet";

type Flag = "onThisDay" | "sealed" | "anniversaries";
const FLAGS: Flag[] = ["onThisDay", "sealed", "anniversaries"];

export function Reminders({ profile }: { profile: Profile | undefined }) {
  const { t } = useQ();
  const save = useSavePrefs();
  const [picking, setPicking] = useState(false);
  const [asking, setAsking] = useState(false);
  const prefs = readPrefs(profile?.notification_prefs);
  const ready = !!profile;

  const persist = async (patch: Partial<NotificationPrefs>) => {
    if (!(await save(patch))) toast({ message: t("reminders.failed") });
  };

  const setFlag = (flag: Flag, next: boolean) => {
    const patch: Partial<NotificationPrefs> = {};
    patch[flag] = next;
    return persist(patch);
  };

  const toggleEnabled = async (next: boolean) => {
    if (!next) return persist({ enabled: false });
    setAsking(true);
    try {
      const permission = await Notifications.requestPermissionsAsync();
      if (!permission.granted) {
        toast({ message: t("reminders.denied"), actionLabel: t("reminders.openSettings"), onAction: () => Linking.openSettings() });
        return;
      }
      await persist({ enabled: true });
    } catch {
      toast({ message: t("reminders.failed") });
    } finally {
      setAsking(false);
    }
  };

  const dim = !prefs.enabled;
  return (
    <Panel>
      <PanelHead label={t("reminders.label")} title={t("reminders.title")} body={t("reminders.body")} />
      <SwitchRow
        label={t("reminders.daily")}
        hint={t("reminders.dailyHint")}
        value={prefs.enabled}
        onValueChange={toggleEnabled}
        disabled={!ready}
        busy={asking}
      />
      <Divider />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("reminders.timeA11y", { time: prefs.nudgeTime })}
        disabled={dim}
        onPress={() => setPicking(true)}
        pressScale={0.99}
        style={styles.timeRow}
      >
        <View style={styles.text}>
          <Text variant="body">{t("reminders.time")}</Text>
          <Text variant="bodySmall">{t("reminders.timeHint")}</Text>
        </View>
        <Text variant="heading">{prefs.nudgeTime}</Text>
        <Icon name="edit" color={color.ash} />
      </Pressable>
      {FLAGS.map((flag) => (
        <View key={flag} style={styles.flag}>
          <Divider />
          <SwitchRow
            label={t(`reminders.${flag}`)}
            hint={t(`reminders.${flag}Hint`)}
            value={prefs[flag]}
            onValueChange={(next) => setFlag(flag, next)}
            disabled={dim}
          />
        </View>
      ))}
      {picking ? (
        <TimeSheet
          initial={prefs.nudgeTime}
          onCancel={() => setPicking(false)}
          onSet={(time) => {
            setPicking(false);
            if (time !== prefs.nudgeTime) persist({ nudgeTime: time });
          }}
        />
      ) : null}
    </Panel>
  );
}

const styles = StyleSheet.create({
  timeRow: { minHeight: minTarget + space.xs, flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: space.xs },
  text: { flex: 1, gap: space.xxs },
  flag: { gap: space.md },
});
