// Calendar-day helpers over yyyy-mm-dd strings. Arithmetic runs in UTC so a DST
// shift can never move a memory to the neighbouring day.
import i18n from "@/i18n";

const DAY_MS = 86_400_000;
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function toUtc(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  return fromUtc(toUtc(date) + days * DAY_MS);
}

export function addMonths(date: string, months: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  return fromUtc(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), Math.min(d, lastDay)));
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / DAY_MS);
}

export function clampDate(date: string, min: string, max: string): string {
  return date < min ? min : date > max ? max : date;
}

const formatters = new Map<string, Intl.DateTimeFormat>();
function format(date: string, key: string, options: Intl.DateTimeFormatOptions): string {
  const cacheKey = `${i18n.language}:${key}`;
  let f = formatters.get(cacheKey);
  if (!f) {
    f = new Intl.DateTimeFormat(i18n.language, { ...options, timeZone: "UTC" });
    formatters.set(cacheKey, f);
  }
  return f.format(new Date(toUtc(date)));
}

export const formatLong = (date: string) => format(date, "long", { day: "numeric", month: "long", year: "numeric" });
export const formatShort = (date: string) => format(date, "short", { day: "numeric", month: "short", year: "numeric" });
export const formatMonth = (date: string) => format(date, "month", { month: "short" });
export const formatWeekday = (date: string) => format(date, "weekday", { weekday: "long" });

export function dayOfMonth(date: string): number {
  return Number(date.slice(8, 10));
}

export function monthOfYear(date: string): number {
  return Number(date.slice(5, 7));
}

export function dayOfWeek(date: string): number {
  return new Date(toUtc(date)).getUTCDay();
}
