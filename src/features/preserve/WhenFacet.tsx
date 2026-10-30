import { useTranslation } from "react-i18next";
import { localDate } from "@/features/relics/api";
import { Text } from "@/ui/Text";
import { DateScrubber, type DatePreset } from "./DateScrubber";
import { addMonths, daysBetween } from "./dates";
import "./i18n";

const SCRUB_YEARS = 90;
const UNREGISTERED_AFTER_YEARS = 20;

export function WhenFacet({ value, joinedOn, onChange }: { value: string; joinedOn: string | null; onChange: (date: string) => void }) {
  const { t } = useTranslation("preserve");
  const today = localDate();
  const days = daysBetween(value, today);
  const before = !!joinedOn && value < joinedOn;

  const relative =
    days === 0
      ? t("when.today")
      : days === 1
        ? t("when.yesterday")
        : days < 60
          ? t("when.daysAgo", { count: days })
          : days < 730
            ? t("when.monthsAgo", { count: Math.round(days / 30.44) })
            : t("when.yearsAgo", { count: Math.floor(days / 365.25) });

  const presets: DatePreset[] = [
    { label: t("date.yearBack"), date: addMonths(value, -12) },
    { label: t("date.monthBack"), date: addMonths(value, -1) },
    { label: t("date.today"), date: today },
    { label: t("date.monthOn"), date: addMonths(value, 1) },
    { label: t("date.yearOn"), date: addMonths(value, 12) },
  ];

  return (
    <>
      <DateScrubber
        value={value}
        onChange={onChange}
        anchor={today}
        direction="past"
        maxDays={365 * SCRUB_YEARS}
        presets={presets}
        caption={[before ? t("when.before") : null, relative].filter(Boolean).join(" · ")}
        label={t("when.label")}
      />
      {days > 365 * UNREGISTERED_AFTER_YEARS ? <Text variant="bodySmall">{t("when.unregistered")}</Text> : null}
    </>
  );
}
