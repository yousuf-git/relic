import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { space } from "@/design/tokens";
import { localDate } from "@/features/relics/api";
import { Button } from "@/ui/Button";
import { Text } from "@/ui/Text";
import { DateScrubber, type DatePreset } from "./DateScrubber";
import { addDays, addMonths } from "./dates";
import "./i18n";

const SEAL_YEARS = 50;

export function SealFacet({ value, onChange }: { value: string | null; onChange: (date: string | null) => void }) {
  const { t } = useTranslation("preserve");
  const today = localDate();
  const tomorrow = addDays(today, 1);

  if (!value) {
    return (
      <View style={{ gap: space.md }}>
        <Text variant="body">{t("seal.explain")}</Text>
        <Button tone="ghost" label={t("seal.choose")} onPress={() => onChange(addMonths(today, 12))} />
      </View>
    );
  }

  const presets: DatePreset[] = [
    { label: t("seal.month"), date: addMonths(today, 1) },
    { label: t("seal.year"), date: addMonths(today, 12) },
    { label: t("seal.five"), date: addMonths(today, 60) },
    { label: t("seal.ten"), date: addMonths(today, 120) },
  ];

  return (
    <View style={{ gap: space.md }}>
      <DateScrubber
        value={value}
        onChange={onChange}
        anchor={tomorrow}
        direction="future"
        maxDays={365 * SEAL_YEARS}
        presets={presets}
        caption={t("seal.stays")}
        label={t("seal.dateLabel")}
      />
      <Text variant="bodySmall">{t("seal.explain")}</Text>
      <Button tone="quiet" label={t("seal.remove")} onPress={() => onChange(null)} />
    </View>
  );
}
