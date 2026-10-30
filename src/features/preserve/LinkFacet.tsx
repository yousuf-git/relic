import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import { art } from "@/design/art";
import { haptic } from "@/design/haptics";
import { color, minTarget, radius, space } from "@/design/tokens";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { Pressable } from "@/ui/Pressable";
import { Text } from "@/ui/Text";
import { checkVideoLink, LINKS_MAX } from "./draft";
import { field } from "./fieldStyle";
import "./i18n";

type Problem = "insecure" | "invalid" | "duplicate";

export function LinkFacet({ links, onChange }: { links: string[]; onChange: (links: string[]) => void }) {
  const { t } = useTranslation("preserve");
  const [input, setInput] = useState("");
  const [problem, setProblem] = useState<Problem | null>(null);
  const full = links.length >= LINKS_MAX;

  const add = () => {
    const check = checkVideoLink(input);
    if (!check.ok) {
      setProblem(check.reason === "empty" ? null : check.reason);
      return;
    }
    if (links.includes(check.url)) {
      setProblem("duplicate");
      return;
    }
    haptic.select();
    onChange([...links, check.url]);
    setInput("");
    setProblem(null);
  };

  return (
    <View style={{ gap: space.sm }}>
      {links.map((url) => {
        const check = checkVideoLink(url);
        return (
          <View key={url} style={styles.card}>
            <Image source={art.vessel.reel} contentFit="cover" style={styles.reel} />
            <View style={styles.cardText}>
              <Text variant="label">{check.ok ? check.host : t("link.reel")}</Text>
              <Text variant="bodySmall" numberOfLines={1}>
                {url.replace(/^https:\/\//i, "")}
              </Text>
            </View>
            <Pressable onPress={() => onChange(links.filter((l) => l !== url))} accessibilityLabel={t("link.remove", { host: check.ok ? check.host : url })} style={styles.remove}>
              <Icon name="close" size={18} color={color.ash} />
            </Pressable>
          </View>
        );
      })}
      {full ? (
        <Text variant="bodySmall">{t("link.full", { max: LINKS_MAX })}</Text>
      ) : (
        <>
          <TextInput
            style={field.input}
            value={input}
            onChangeText={(v) => {
              setInput(v);
              setProblem(null);
            }}
            onSubmitEditing={add}
            placeholder={t("link.placeholder")}
            placeholderTextColor={color.ash}
            selectionColor={color.lamp}
            cursorColor={color.lamp}
            keyboardType="url"
            textContentType="URL"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            blurOnSubmit={false}
            accessibilityLabel={t("link.label")}
          />
          <Button tone="ghost" label={t("link.add")} onPress={add} disabled={!input.trim()} />
        </>
      )}
      {problem ? (
        <Text variant="bodySmall" style={{ color: color.danger }} accessibilityLiveRegion="polite">
          {t(`link.problem.${problem}`)}
        </Text>
      ) : (
        <Text variant="bodySmall">{t("link.hint")}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    padding: space.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.ironHigh,
    backgroundColor: color.shaft,
  },
  reel: { width: minTarget, height: minTarget, borderRadius: radius.sm },
  cardText: { flex: 1, gap: 2 },
  remove: { width: minTarget, height: minTarget, alignItems: "center", justifyContent: "center" },
});
