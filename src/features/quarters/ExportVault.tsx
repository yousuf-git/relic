import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { color, space } from "@/design/tokens";
import { localDate } from "@/features/relics/api";
import { vault } from "@/lib/vault";
import { Button } from "@/ui/Button";
import { Text } from "@/ui/Text";
import { toast } from "@/ui/Toast";
import { formatMb } from "./format";
import { useQ } from "./strings";
import { Gauge, Panel, PanelHead } from "./ui";

type Phase =
  | { name: "idle" }
  | { name: "preparing" }
  | { name: "downloading"; done: number; total: number }
  | { name: "ready"; uri: string; relics: number; bytes: number }
  | { name: "error"; message: string };

export function ExportVault() {
  const { t, count } = useQ();
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const abort = useRef<AbortController | null>(null);
  const lastPercent = useRef(-1);

  useEffect(() => () => abort.current?.abort(), []);

  const prepare = async () => {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    lastPercent.current = -1;
    setPhase({ name: "preparing" });
    try {
      const { url, bytes, relics } = await vault.exportVault();
      setPhase({ name: "downloading", done: 0, total: bytes });
      const saved = await File.downloadFileAsync(url, new File(Paths.cache, `relic-vault-${localDate()}.zip`), {
        idempotent: true,
        signal: controller.signal,
        onProgress: ({ bytesWritten, totalBytes }) => {
          const total = totalBytes > 0 ? totalBytes : bytes;
          const percent = Math.floor((bytesWritten / total) * 100);
          if (percent === lastPercent.current) return;
          lastPercent.current = percent;
          setPhase({ name: "downloading", done: bytesWritten, total });
        },
      });
      setPhase({ name: "ready", uri: saved.uri, relics, bytes });
    } catch (e) {
      if (controller.signal.aborted) return;
      setPhase({ name: "error", message: e instanceof TypeError ? t("errors.offline", { ns: "common" }) : t("export.failed") });
    }
  };

  const share = async (uri: string) => {
    if (!new File(uri).exists) return setPhase({ name: "error", message: t("export.missing") });
    try {
      if (!(await Sharing.isAvailableAsync())) return toast({ message: t("export.unavailable") });
      await Sharing.shareAsync(uri, { mimeType: "application/zip", dialogTitle: t("export.shareTitle") });
    } catch {
      toast({ message: t("export.failed") });
    }
  };

  const working = phase.name === "preparing" || phase.name === "downloading";
  return (
    <Panel>
      <PanelHead label={t("export.label")} title={t("export.title")} body={t("export.body")} />

      {phase.name === "preparing" ? (
        <Text variant="bodySmall" accessibilityLiveRegion="polite">
          {t("export.preparing")}
        </Text>
      ) : null}

      {phase.name === "downloading" ? (
        <View style={styles.progress} accessibilityLiveRegion="polite">
          <Gauge
            fraction={phase.total > 0 ? phase.done / phase.total : 0}
            label={t("export.progress")}
            valueText={t("export.bringing", { done: formatMb(phase.done), total: formatMb(phase.total) })}
          />
          <Text variant="catalog">{t("export.bringing", { done: formatMb(phase.done), total: formatMb(phase.total) })}</Text>
        </View>
      ) : null}

      {phase.name === "ready" ? (
        <Text variant="bodySmall" accessibilityLiveRegion="polite">
          {count("export.ready", phase.relics, { size: formatMb(phase.bytes) })}
        </Text>
      ) : null}

      {phase.name === "error" ? (
        <Text variant="bodySmall" accessibilityLiveRegion="polite" style={styles.error}>
          {phase.message}
        </Text>
      ) : null}

      {phase.name === "ready" ? (
        <View style={styles.actions}>
          <Button label={t("export.share")} onPress={() => share(phase.uri)} />
          <Button tone="quiet" label={t("export.again")} onPress={prepare} />
        </View>
      ) : (
        <Button
          tone="ghost"
          label={working ? t("export.preparingButton") : phase.name === "error" ? t("retry") : t("export.start")}
          loading={working}
          onPress={prepare}
        />
      )}
    </Panel>
  );
}

const styles = StyleSheet.create({
  progress: { gap: space.xs },
  actions: { gap: space.xxs },
  error: { color: color.danger },
});
