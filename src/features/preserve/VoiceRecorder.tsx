// The echo shell: record up to a minute (hard stop, with a countdown ring), listen
// back, and re-record. One voice per relic.
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useEffect } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { color, minTarget, radius, space } from "@/design/tokens";
import { LIMITS } from "@/lib/media";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { Pressable } from "@/ui/Pressable";
import { Text } from "@/ui/Text";
import { ProgressRing } from "./ProgressRing";
import { useVoiceRecorder, type VoiceTake } from "./useVoiceRecorder";
import "./i18n";

const RING = 104;
const BUTTON = 72;
const GROOVES = 36;
const grooveHeight = (i: number) => 10 + 30 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6));

const clock = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export function VoiceRecorder({
  take,
  keptVoice,
  blocked,
  onTake,
  onRemove,
  onRecordingChange,
}: {
  take: VoiceTake | null;
  keptVoice: boolean;
  blocked: boolean;
  onTake: (take: VoiceTake) => void;
  onRemove: () => void;
  onRecordingChange: (recording: boolean) => void;
}) {
  const { t } = useTranslation("preserve");
  const rec = useVoiceRecorder(onTake);
  const recording = rec.phase === "recording";

  useEffect(() => {
    onRecordingChange(recording);
  }, [recording, onRecordingChange]);

  if (keptVoice) {
    return (
      <View style={styles.card}>
        <Text variant="label">{t("voice.title")}</Text>
        <Text variant="bodySmall">{t("voice.kept")}</Text>
      </View>
    );
  }

  if (take && !recording) {
    return (
      <View style={styles.card}>
        <Text variant="label">{t("voice.title")}</Text>
        <Playback take={take} />
        <View style={styles.actions}>
          <Button
            tone="ghost"
            label={t("voice.again")}
            onPress={() => {
              onRemove();
              void rec.start();
            }}
            disabled={blocked}
            style={styles.action}
          />
          <Button tone="quiet" label={t("voice.remove")} onPress={onRemove} style={styles.action} />
        </View>
      </View>
    );
  }

  const busy = rec.phase === "preparing";
  return (
    <View style={styles.card}>
      <Text variant="label">{t("voice.title")}</Text>
      <View style={styles.recorder}>
        <View style={styles.ring}>
          <ProgressRing size={RING} stroke={4} progress={rec.remaining} tint={color.lamp} track={color.iron} />
          <Pressable
            disabled={blocked || busy}
            onPress={() => void (recording ? rec.stop() : rec.start())}
            accessibilityLabel={recording ? t("voice.stop") : t("voice.record")}
            accessibilityHint={recording ? undefined : t("voice.recordHint")}
            accessibilityState={{ busy, disabled: blocked || busy }}
            style={[styles.record, recording && styles.recordOn]}
          >
            {recording ? <View style={styles.stopMark} /> : <Icon name="mic" size={30} />}
          </Pressable>
        </View>
        <View style={styles.readout}>
          <Text variant="heading">{recording ? clock(LIMITS.voiceMaxMs - rec.elapsedMs) : clock(LIMITS.voiceMaxMs)}</Text>
          <Text variant="bodySmall">{recording ? t("voice.recording") : blocked ? t("voice.blocked") : t("voice.idle")}</Text>
        </View>
      </View>
      {rec.problem ? (
        <View accessibilityLiveRegion="polite">
          <Text variant="bodySmall">{t(`voice.problem.${rec.problem}`)}</Text>
          {rec.problem === "blocked" ? (
            <Pressable onPress={() => Linking.openSettings()} accessibilityLabel={t("openSettings")} style={styles.settings}>
              <Text variant="button" style={{ color: color.lamp }}>
                {t("openSettings")}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function Playback({ take }: { take: VoiceTake }) {
  const { t } = useTranslation("preserve");
  const player = useAudioPlayer(take.uri, { updateInterval: 100 });
  const status = useAudioPlayerStatus(player);
  const total = status.duration > 0 ? status.duration : take.durationMs / 1000;
  const progress = total > 0 ? Math.min(1, status.currentTime / total) : 0;

  const toggle = async () => {
    if (status.playing) {
      player.pause();
      return;
    }
    if (status.didJustFinish || progress >= 0.99) await player.seekTo(0);
    player.play();
  };

  return (
    <View style={styles.playback}>
      <Pressable
        onPress={() => void toggle()}
        accessibilityLabel={status.playing ? t("voice.pause") : t("voice.play")}
        style={styles.play}
      >
        <Icon name={status.playing ? "pause" : "play"} size={24} color={color.onLamp} />
      </Pressable>
      <View style={styles.grooves} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {Array.from({ length: GROOVES }, (_, i) => (
          <View
            key={i}
            style={[styles.groove, { height: grooveHeight(i), backgroundColor: i / GROOVES < progress ? color.lamp : color.ironHigh }]}
          />
        ))}
      </View>
      <Text variant="catalog">{clock(status.playing ? (total - status.currentTime) * 1000 : take.durationMs)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: color.stone, borderWidth: 1, borderColor: color.iron, borderRadius: radius.md, padding: space.md, gap: space.sm },
  recorder: { flexDirection: "row", alignItems: "center", gap: space.md },
  ring: { width: RING, height: RING, alignItems: "center", justifyContent: "center" },
  record: {
    position: "absolute",
    width: BUTTON,
    height: BUTTON,
    borderRadius: BUTTON / 2,
    backgroundColor: color.iron,
    borderWidth: 1,
    borderColor: color.ironHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  recordOn: { backgroundColor: color.lamp, borderColor: color.lamp },
  stopMark: { width: 22, height: 22, borderRadius: radius.sm, backgroundColor: color.onLamp },
  readout: { flex: 1, gap: space.xxs },
  settings: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
  playback: { flexDirection: "row", alignItems: "center", gap: space.sm },
  play: { width: minTarget, height: minTarget, borderRadius: minTarget / 2, backgroundColor: color.lamp, alignItems: "center", justifyContent: "center" },
  grooves: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 44 },
  groove: { width: 3, borderRadius: 2 },
  actions: { flexDirection: "row", gap: space.sm },
  action: { flex: 1 },
});
