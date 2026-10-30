import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { addNamespace } from "@/i18n";
import ledger from "@/i18n/en/ledger.json";
import { color, space } from "@/design/tokens";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { Pressable } from "@/ui/Pressable";
import { Screen } from "@/ui/Screen";
import { Text } from "@/ui/Text";
import type { DayEntry } from "./calendar-source";
import { DaySheet } from "./DaySheet";
import { parseDate } from "./dates";
import { MonthGrid } from "./MonthGrid";
import { monthName } from "./text";
import { useCalendarDays, useCalendarExtent, useCalendarSource } from "./useCalendar";
import { useToday } from "./useToday";
import { YearWall } from "./YearWall";

addNamespace("ledger", ledger);

const NO_DAYS = new Map<string, DayEntry>();

export function LedgerScreen() {
  const { t } = useTranslation("ledger");
  const router = useRouter();
  const { width } = useWindowDimensions();
  const today = useToday();
  const todayYear = parseDate(today).y;

  const { source, isPending, isError, refetch } = useCalendarSource();
  const extent = useCalendarExtent(source);
  const [pickedYear, setPickedYear] = useState(todayYear);
  const [month, setMonth] = useState<number | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const minYear = Math.min(todayYear, extent.data ? parseDate(extent.data.from).y : todayYear);
  const maxYear = Math.max(todayYear, extent.data ? parseDate(extent.data.to).y : todayYear);
  const year = Math.min(maxYear, Math.max(minYear, pickedYear));

  const days = useCalendarDays(source, { from: `${year}-01-01`, to: `${year}-12-31` });
  const dayMap = days.data ?? NO_DAYS;

  const totals = useMemo(() => {
    let relics = 0;
    let litDays = 0;
    let monthRelics = 0;
    for (const entry of dayMap.values()) {
      relics += entry.count;
      litDays += 1;
      if (month !== null && parseDate(entry.date).m === month) monthRelics += entry.count;
    }
    return { relics, litDays, monthRelics };
  }, [dayMap, month]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (selected) setSelected(null);
        else if (month !== null) setMonth(null);
        else return false;
        return true;
      });
      return () => sub.remove();
    }, [selected, month]),
  );

  const goToYear = (next: number) => {
    setPickedYear(next);
    setMonth(null);
    setSelected(null);
  };

  const isEmpty = !isPending && !isError && extent.data === null;
  const summary = totals.litDays > 0 ? `${t("summary.relics", { count: totals.relics })} · ${t("summary.days", { count: totals.litDays })}` : t("summary.none");

  return (
    <Screen edges={["top"]}>
      <View style={styles.header}>
        <Text variant="label">{t("eyebrow")}</Text>
        {month === null ? (
          <>
            <View style={styles.row}>
              <StepButton label={t("year.previous")} disabled={year <= minYear} onPress={() => goToYear(year - 1)} />
              <Text variant="title" accessibilityRole="header" accessibilityLabel={t("year.label", { year })} style={styles.year}>
                {year}
              </Text>
              <StepButton label={t("year.next")} forward disabled={year >= maxYear} onPress={() => goToYear(year + 1)} />
            </View>
            <Text variant="catalog" style={styles.summary}>
              {summary}
            </Text>
          </>
        ) : (
          <>
            <View style={styles.row}>
              <Pressable accessibilityLabel={t("month.back", { year })} onPress={() => setMonth(null)} style={styles.back}>
                <Icon name="back" color={color.ash} />
                <Text variant="catalog">{year}</Text>
              </Pressable>
              <View style={styles.steps}>
                <StepButton label={t("month.previous")} disabled={month <= 1} onPress={() => setMonth(month - 1)} />
                <StepButton label={t("month.next")} forward disabled={month >= 12} onPress={() => setMonth(month + 1)} />
              </View>
            </View>
            <Text variant="title" accessibilityRole="header">
              {monthName(year, month)}
            </Text>
            <Text variant="catalog" style={styles.summary}>
              {totals.monthRelics > 0 ? t("summary.relics", { count: totals.monthRelics }) : t("summary.none")}
            </Text>
          </>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isError ? (
          <View style={styles.state}>
            <Text variant="heading">{t("states.errorTitle")}</Text>
            <Text variant="bodySmall">{t("errors.offline", { ns: "common" })}</Text>
            <Button label={t("states.retry")} tone="ghost" onPress={() => refetch()} />
          </View>
        ) : month === null ? (
          <>
            <YearWall key={year} year={year} today={today} width={width} days={dayMap} onOpenMonth={setMonth} />
            <View style={styles.footer}>
              {isPending ? (
                <Text variant="bodySmall" accessibilityLiveRegion="polite">
                  {t("states.loading")}
                </Text>
              ) : isEmpty ? (
                <View style={styles.state}>
                  <Text variant="heading">{t("states.emptyTitle")}</Text>
                  <Text variant="bodySmall">{t("states.emptyBody")}</Text>
                  <Button label={t("states.emptyCta")} onPress={() => router.push("/preserve")} />
                </View>
              ) : (
                <>
                  <Text variant="bodySmall">{t("wall.caption")}</Text>
                  <Text variant="catalog">{t("wall.hint")}</Text>
                </>
              )}
            </View>
          </>
        ) : (
          <MonthGrid
            key={`${year}-${month}`}
            year={year}
            month={month}
            today={today}
            width={width}
            days={dayMap}
            selected={selected}
            onSelectDay={setSelected}
            onZoomOut={() => setMonth(null)}
          />
        )}
      </ScrollView>

      {selected ? (
        <DaySheet
          date={selected}
          today={today}
          entry={dayMap.get(selected)}
          onClose={() => setSelected(null)}
          onOpenRelic={(id) => router.push({ pathname: "/relic/[id]", params: { id } })}
          onPreserve={(date) => router.push({ pathname: "/preserve", params: { date } })}
        />
      ) : null}
    </Screen>
  );
}

function StepButton({ label, forward, disabled, onPress }: { label: string; forward?: boolean; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityLabel={label} disabled={disabled} onPress={onPress} style={styles.step}>
      <View style={forward ? styles.flip : undefined}>
        <Icon name="back" color={disabled ? color.faint : color.paper} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: space.md, paddingTop: space.md, paddingBottom: space.sm },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 56 },
  year: { flex: 1, textAlign: "center" },
  steps: { flexDirection: "row" },
  step: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  flip: { transform: [{ rotate: "180deg" }] },
  back: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: space.xxs },
  summary: { marginTop: space.xxs },
  content: { paddingBottom: space.xl },
  footer: { paddingHorizontal: space.md, paddingTop: space.md, gap: space.xs },
  state: { gap: space.sm, paddingHorizontal: space.md, paddingTop: space.md },
});
