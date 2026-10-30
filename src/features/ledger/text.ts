// Small text helpers shared by the Ledger, Unearth, notifications and widgets.
// Imported outside React too (notification scheduling, widget task), so they
// read translations from the i18n instance directly.
import i18n, { addNamespace } from "@/i18n";
import ledger from "@/i18n/en/ledger.json";
import { daysBetween, parseDate, toLocalDate } from "./dates";

addNamespace("ledger", ledger);

export function excerpt(body: string | null | undefined, max = 140): string | null {
  const flat = body?.replace(/\s+/g, " ").trim();
  if (!flat) return null;
  return flat.length <= max ? flat : `${flat.slice(0, max - 1).trimEnd()}…`;
}

/** Spoken-style dates and weekday names ("Thursday 12 March"). Catalog dates (12 MAR 2024) come from vault/format. */
export function formatLong(date: string, options: Intl.DateTimeFormatOptions): string {
  return toLocalDate(date).toLocaleDateString(i18n.language, options);
}

export function monthName(y: number, m: number, style: "long" | "short" = "long"): string {
  return new Date(y, m - 1, 1, 12).toLocaleDateString(i18n.language, { month: style });
}

/** "3 months ago", "2 years ago", "today": the span from `from` to `to`, in the largest whole unit. */
export function agoLabel(from: string, to: string): string {
  const t = (key: string, count?: number) => i18n.t(`ledger:ago.${key}`, { count });
  const days = daysBetween(from, to);
  if (days <= 0) return t("today");
  const a = parseDate(from);
  const b = parseDate(to);
  const months = (b.y - a.y) * 12 + (b.m - a.m) - (b.d < a.d ? 1 : 0);
  if (months >= 12) return t("year", Math.floor(months / 12));
  if (months >= 1) return t("month", months);
  return t("day", days);
}
