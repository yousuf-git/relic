// Pure helpers shared by the Vault, the relic view and the share card.
import i18n from "@/i18n";
import { localDate, type Relic } from "@/features/relics/api";
import "./i18n";

/** The Vault depth gauge tops out here. */
export const MAX_LEVEL = 144;

const monthIndex = (day: string) => Number(day.slice(0, 4)) * 12 + Number(day.slice(5, 7)) - 1;

/** Whole months between a day and today; the current month is 0. */
export function monthsBack(day: string, today = localDate()): number {
  return Math.max(0, monthIndex(today) - monthIndex(day));
}

/** Level 1 is the current month; every month deeper adds one, down to the 144 bedrock. */
export function levelOf(day: string, today = localDate()): number {
  return Math.min(MAX_LEVEL, monthsBack(day, today) + 1);
}

const monthName = (m: string) => i18n.t(`vault:date.month.${Number(m)}`);

/** 12 MAR 2024 */
export function formatDay(day: string): string {
  const [year, month, d] = day.split("-");
  return i18n.t("vault:date.full", { day: d, month: monthName(month), year });
}

/** MAR 2024 */
export function formatMonth(day: string): string {
  const [year, month] = day.split("-");
  return i18n.t("vault:date.monthYear", { month: monthName(month), year });
}

export function daysUntil(day: string, today = localDate()): number {
  const utc = (s: string) => Date.UTC(Number(s.slice(0, 4)), Number(s.slice(5, 7)) - 1, Number(s.slice(8, 10)));
  return Math.round((utc(day) - utc(today)) / 86_400_000);
}

/** Stable 32-bit seed so a relic always lands in the same spot on the shaft. */
export function seedOf(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Trim to a sentence or word boundary so a cut never lands mid-word. */
export function excerpt(text: string | null | undefined, max: number): string {
  const flat = (text ?? "").replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  const sentence = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  if (sentence > max * 0.55) return cut.slice(0, sentence + 1);
  const space = cut.lastIndexOf(" ");
  return `${cut.slice(0, space > 0 ? space : max).replace(/[\s,;:\-–—]+$/, "")}…`;
}

type Translate = (key: string, options?: Record<string, unknown>) => string;

/** What a relic is called when the keeper gave it no title. */
export function relicTitle(relic: Pick<Relic, "title" | "body" | "vessel">, t: Translate): string {
  return relic.title?.trim() || excerpt(relic.body, 44) || t(`vessel.${relic.vessel}`);
}

export function monthKey(day: string): string {
  return day.slice(0, 7);
}
