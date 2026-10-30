import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { color, font, minTarget, radius, space, type as typography } from "@/design/tokens";
import { forgetSession } from "@/lib/auth";
import { vault } from "@/lib/vault";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { Text } from "@/ui/Text";
import { Sheet } from "./Sheet";
import { useQ } from "./strings";
import { Panel, PanelHead } from "./ui";

type Step = "closed" | "explain" | "confirm";

export function ReleaseVault() {
  const { t } = useQ();
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>("closed");
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const confirmed = typed.trim().toUpperCase() === t("release.word");

  const close = () => {
    if (busy) return;
    setStep("closed");
    setTyped("");
    setFailed(false);
  };

  const release = async () => {
    setBusy(true);
    setFailed(false);
    try {
      await vault.deleteAccount();
    } catch {
      setFailed(true);
      setBusy(false);
      return;
    }
    // The account is gone; signing out unmounts this screen, so there is no state to settle.
    await forgetSession();
    qc.clear();
  };

  return (
    <Panel>
      <PanelHead label={t("release.label")} title={t("release.title")} body={t("release.body")} />
      <Button tone="danger" label={t("release.open")} onPress={() => setStep("explain")} />

      {step !== "closed" ? (
        <Sheet onClose={close} dismissable={!busy} scrollable closeLabel={t("release.back")}>
          {step === "explain" ? (
            <>
              <Text variant="heading" accessibilityRole="header">
                {t("release.sheetTitle")}
              </Text>
              <Text variant="bodySmall">{t("release.intro")}</Text>
              <View style={styles.list}>
                {(["goneRelics", "goneMedia", "goneRest"] as const).map((key) => (
                  <View key={key} style={styles.item}>
                    <View style={styles.bullet}>
                      <Icon name="nut" size={18} color={color.danger} />
                    </View>
                    <Text variant="body" style={styles.itemText}>
                      {t(`release.${key}`)}
                    </Text>
                  </View>
                ))}
              </View>
              <Text variant="body">{t("release.nothing")}</Text>
              <Text variant="bodySmall">{t("release.exportFirst")}</Text>
              <View style={styles.actions}>
                <Button label={t("release.keep")} onPress={close} />
                <Button tone="danger" label={t("release.continue")} onPress={() => setStep("confirm")} />
              </View>
            </>
          ) : (
            <>
              <Text variant="heading" accessibilityRole="header">
                {t("release.confirmTitle")}
              </Text>
              <Text variant="bodySmall">{t("release.confirmBody")}</Text>
              <TextInput
                autoFocus
                value={typed}
                onChangeText={setTyped}
                editable={!busy}
                autoCapitalize="characters"
                autoCorrect={false}
                autoComplete="off"
                importantForAutofill="no"
                spellCheck={false}
                maxLength={16}
                returnKeyType="done"
                accessibilityLabel={t("release.inputLabel")}
                placeholder={t("release.word")}
                placeholderTextColor={color.faint}
                selectionColor={color.danger}
                cursorColor={color.danger}
                style={styles.input}
              />
              {failed ? (
                <Text variant="bodySmall" accessibilityLiveRegion="polite" style={styles.error}>
                  {t("release.failed")}
                </Text>
              ) : null}
              <View style={styles.actions}>
                <Button tone="danger" label={busy ? t("release.releasing") : t("release.confirm")} loading={busy} disabled={!confirmed} onPress={release} />
                <Button tone="ghost" label={t("release.back")} disabled={busy} onPress={() => setStep("explain")} />
              </View>
            </>
          )}
        </Sheet>
      ) : null}
    </Panel>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.sm },
  item: { flexDirection: "row", gap: space.sm, alignItems: "flex-start" },
  bullet: { height: typography.body.lineHeight, justifyContent: "center" },
  itemText: { flex: 1 },
  actions: { gap: space.xxs },
  input: {
    minHeight: minTarget,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.ironHigh,
    backgroundColor: color.shaft,
    color: color.paper,
    fontFamily: font.monoMedium,
    fontSize: typography.body.fontSize,
    letterSpacing: 2,
  },
  error: { color: color.danger },
});
