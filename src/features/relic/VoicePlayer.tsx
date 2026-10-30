// The echo shell's voice: play, and the grooves light up as it plays.
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { memo, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable as RNPressable, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { type SharedValue } from "react-native-reanimated";
import { color, minTarget, moodLight, radius, space, type Mood } from "@/design/tokens";
import { seedOf } from "@/features/vault/format";
import { Icon } from "@/ui/Icon";
import { Pressable } from "@/ui/Pressable";
import { Text } from "@/ui/Text";
import "./i18n";

const BARS = 44;
const BAR_MIN = 6;
const BAR_SPAN = 26;
const SKIP_SECONDS = 5;

const clock = (seconds: number) => {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** A deterministic, voice-like groove profile for one recording. */
function profile(seed: number): number[] {
  let x = seed || 1;
  return Array.from({ length: BARS }, (_, i) => {
    x = Math.imul(x ^ (x >>> 15), 2246822507) >>> 0;
    const envelope = 0.45 + 0.55 * Math.sin((i / (BARS - 1)) * Math.PI);
    return BAR_MIN + ((x % 1000) / 1000) * BAR_SPAN * envelope;
  });
}

const Grooves = memo(function Grooves({ heights, lit, tint }: { heights: number[]; lit: number; tint: string }) {
  return (
    <View style={styles.grooves} pointerEvents="none">
      {heights.map((h, i) => (
        <View key={i} style={[styles.bar, { height: h, backgroundColor: i < lit ? tint : color.ironHigh }]} />
      ))}
    </View>
  );
});

type Props = {
  url: string;
  durationMs: number;
  mood: Mood;
  seed: string;
  progress: SharedValue<number>;
  active: SharedValue<number>;
};

export function VoicePlayer({ url, durationMs, mood, seed, progress, active }: Props) {
  const { t } = useTranslation("relic");
  const player = useAudioPlayer(url, { updateInterval: 100 });
  const status = useAudioPlayerStatus(player);
  const [width, setWidth] = useState(0);
  const heights = useState(() => profile(seedOf(seed)))[0];

  const total = status.duration > 0 ? status.duration : durationMs / 1000;
  const fraction = total > 0 ? Math.min(1, status.currentTime / total) : 0;
  const lit = Math.round(fraction * BARS);

  useEffect(() => {
    progress.set(fraction);
    active.set(status.playing || (fraction > 0 && fraction < 1) ? 1 : 0);
  }, [fraction, status.playing, progress, active]);

  useEffect(() => () => active.set(0), [active]);

  const toggle = useCallback(() => {
    if (status.playing) {
      player.pause();
      return;
    }
    if (total > 0 && status.currentTime >= total - 0.1) player.seekTo(0);
    player.play();
  }, [player, status.playing, status.currentTime, total]);

  const seek = useCallback((to: number) => player.seekTo(Math.max(0, Math.min(total, to))), [player, total]);
  const onLayout = useCallback((e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width), []);

  if (status.error) {
    return (
      <View style={styles.row}>
        <Text variant="bodySmall" style={styles.flex} accessibilityLiveRegion="polite">
          {t("voice.failed")}
        </Text>
        <Pressable accessibilityLabel={t("common:actions.retry")} onPress={() => player.replace(url)} style={styles.play}>
          <Icon name="play" color={color.onLamp} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityLabel={status.playing ? t("voice.pause") : t("voice.play")}
        accessibilityState={{ busy: !status.isLoaded }}
        onPress={toggle}
        style={styles.play}
      >
        <Icon name={status.playing ? "pause" : "play"} color={color.onLamp} size={26} strokeWidth={2} />
      </Pressable>
      <View style={styles.flex}>
        <RNPressable
          onLayout={onLayout}
          onPress={(e) => width > 0 && seek((e.nativeEvent.locationX / width) * total)}
          accessibilityRole="adjustable"
          accessibilityLabel={t("voice.position")}
          accessibilityValue={{ min: 0, max: 100, now: Math.round(fraction * 100), text: `${clock(status.currentTime)} / ${clock(total)}` }}
          accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
          onAccessibilityAction={(e) => seek(status.currentTime + (e.nativeEvent.actionName === "increment" ? SKIP_SECONDS : -SKIP_SECONDS))}
          style={styles.scrub}
        >
          <Grooves heights={heights} lit={lit} tint={moodLight[mood]} />
        </RNPressable>
        <Text variant="catalog" style={styles.time}>
          {clock(status.currentTime)} / {clock(total)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: space.md, padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: color.ironHigh, backgroundColor: color.stone },
  flex: { flex: 1 },
  play: { width: minTarget + 8, height: minTarget + 8, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: color.lamp },
  scrub: { height: minTarget, justifyContent: "center" },
  grooves: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: BAR_MIN + BAR_SPAN },
  bar: { width: 3, borderRadius: radius.pill },
  time: { marginTop: space.xxs },
});
