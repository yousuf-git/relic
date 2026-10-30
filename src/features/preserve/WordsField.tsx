// The letter: a sheet of dark paper to write on, with live dictation. The sheet has
// a fixed height and scrolls inside, so the mic never shifts under a held finger.
import { Image } from "expo-image";
import { useEffect, useRef, type ComponentRef } from "react";
import { Linking, StyleSheet, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import { duration } from "@/design/motion";
import { art } from "@/design/art";
import { color, radius, space, type } from "@/design/tokens";
import { Pressable } from "@/ui/Pressable";
import { Text } from "@/ui/Text";
import { BODY_MAX, TITLE_MAX } from "./draft";
import { HoldToSpeak } from "./HoldToSpeak";
import { useSpeechToText } from "./useSpeechToText";
import "./i18n";

export function WordsField({
  title,
  body,
  placeholder,
  dateLabel,
  before,
  bodyHeight,
  focusOnMount,
  micBlocked,
  onTitle,
  onBody,
  onSpoken,
  onListeningChange,
}: {
  title: string;
  body: string;
  placeholder: string;
  dateLabel: string;
  before: boolean;
  bodyHeight: number;
  focusOnMount?: boolean;
  micBlocked?: boolean;
  onTitle: (value: string) => void;
  onBody: (value: string) => void;
  onSpoken: (text: string) => void;
  onListeningChange: (listening: boolean) => void;
}) {
  const { t } = useTranslation("preserve");
  const bodyRef = useRef<ComponentRef<typeof TextInput>>(null);
  const speech = useSpeechToText(onSpoken);
  const listening = speech.state !== "idle";

  useEffect(() => {
    onListeningChange(listening);
  }, [listening, onListeningChange]);

  useEffect(() => {
    if (!focusOnMount) return;
    const timer = setTimeout(() => bodyRef.current?.focus(), duration.medium);
    return () => clearTimeout(timer);
  }, [focusOnMount]);

  const gap = body === "" || /\s$/.test(body) ? "" : " ";
  const shown = listening && speech.interim ? body + gap + speech.interim : body;

  return (
    <View style={styles.sheet}>
      <Image source={art.texture.paper} contentFit="cover" style={styles.paper} pointerEvents="none" />
      <View style={styles.dateRow}>
        <Text variant="label">{dateLabel}</Text>
        {before ? (
          <Text variant="label" style={{ color: color.lamp }}>
            {t("letter.before")}
          </Text>
        ) : null}
      </View>
      <TextInput
        style={styles.title}
        value={title}
        onChangeText={(v) => onTitle(v.slice(0, TITLE_MAX))}
        placeholder={t("letter.titlePlaceholder")}
        placeholderTextColor={color.ash}
        selectionColor={color.lamp}
        cursorColor={color.lamp}
        returnKeyType="next"
        onSubmitEditing={() => bodyRef.current?.focus()}
        accessibilityLabel={t("letter.titleLabel")}
      />
      <View style={styles.rule} />
      <TextInput
        ref={bodyRef}
        style={[styles.body, { height: bodyHeight }]}
        value={shown}
        onChangeText={(v) => {
          if (!listening) onBody(v.slice(0, BODY_MAX));
        }}
        multiline
        scrollEnabled
        textAlignVertical="top"
        placeholder={placeholder}
        placeholderTextColor={color.ash}
        selectionColor={color.lamp}
        cursorColor={color.lamp}
        selection={listening ? { start: shown.length, end: shown.length } : undefined}
        accessibilityLabel={t("letter.bodyLabel")}
      />
      <View style={styles.footer}>
        <View style={styles.status} accessibilityLiveRegion="polite">
          {listening ? (
            <Text variant="label" style={{ color: color.lamp }}>
              {t("speak.listening")}
            </Text>
          ) : speech.problem ? (
            <>
              <Text variant="bodySmall">{t(`speak.problem.${speech.problem}`)}</Text>
              {speech.problem === "blocked" ? (
                <Pressable onPress={() => Linking.openSettings()} accessibilityLabel={t("openSettings")} style={styles.link}>
                  <Text variant="button" style={{ color: color.lamp }}>
                    {t("openSettings")}
                  </Text>
                </Pressable>
              ) : null}
            </>
          ) : (
            <Text variant="label">{t("speak.idle")}</Text>
          )}
        </View>
        <HoldToSpeak
          active={listening}
          level={speech.level}
          disabled={micBlocked}
          onBegin={() => void speech.begin()}
          onEnd={speech.stop}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: color.stone,
    borderWidth: 1,
    borderColor: color.iron,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingTop: space.md,
    overflow: "hidden",
  },
  paper: { ...StyleSheet.absoluteFill, opacity: 0.06 },
  dateRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 20 },
  title: { ...type.heading, paddingVertical: space.xs, minHeight: 48 },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: color.ironHigh, marginBottom: space.xs },
  body: { ...type.body, paddingVertical: space.xs },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.sm, minHeight: 72 },
  status: { flex: 1, justifyContent: "center" },
  link: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
});
