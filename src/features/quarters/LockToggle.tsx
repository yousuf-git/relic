import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { art } from "@/design/art";
import { color, space } from "@/design/tokens";
import { disableAppLock, enableAppLock, useLockStore } from "@/features/lock/store";
import { toast } from "@/ui/Toast";
import { useQ } from "./strings";
import { EdgeFade, Panel, PanelHead, SwitchRow } from "./ui";

export function LockToggle() {
  const { t } = useQ();
  const enabled = useLockStore((s) => s.enabled);
  const [busy, setBusy] = useState(false);

  const change = async (next: boolean) => {
    setBusy(true);
    try {
      await (next ? enableAppLock() : disableAppLock());
    } catch {
      // The store below decides whether the door really bolted.
    } finally {
      setBusy(false);
    }
    if (useLockStore.getState().enabled !== next) toast({ message: t("lock.failed") });
  };

  return (
    <Panel>
      <View pointerEvents="none" style={styles.door}>
        <Image source={art.scene.door} contentFit="cover" style={StyleSheet.absoluteFill} />
        <EdgeFade edge="left" tint={color.stone} style={StyleSheet.absoluteFill} />
        <EdgeFade edge="bottom" tint={color.stone} style={StyleSheet.absoluteFill} />
      </View>
      <View style={styles.head}>
        <PanelHead label={t("lock.label")} title={t("lock.title")} body={t("lock.body")} />
      </View>
      <SwitchRow label={t("lock.toggle")} value={enabled} onValueChange={change} busy={busy} />
    </Panel>
  );
}

const DOOR_HEIGHT = 176;
const styles = StyleSheet.create({
  door: { position: "absolute", top: 0, right: 0, width: "52%", height: DOOR_HEIGHT, opacity: 0.6 },
  head: { maxWidth: "62%", paddingBottom: space.xs },
});
