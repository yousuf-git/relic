import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { color, font, radius, space, type } from "@/design/tokens";
import { Button } from "@/ui/Button";
import { Text } from "@/ui/Text";

export function PromptCard({ prompt, onAnswer }: { prompt: string; onAnswer: () => void }) {
  const { t } = useTranslation("prompts");
  return (
    <View style={styles.card}>
      <Text variant="label">{t("eyebrow")}</Text>
      <Text variant="heading" style={styles.prompt}>
        {prompt}
      </Text>
      <Button label={t("answer")} tone="ghost" onPress={onAnswer} accessibilityHint={t("answerHint")} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, borderColor: color.iron, padding: space.lg, gap: space.sm },
  prompt: { ...type.heading, fontFamily: font.displayItalic },
});
