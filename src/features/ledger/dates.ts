// Pure helpers on yyyy-mm-dd calendar dates. Strings keep time zones out of the
// arithmetic: a relic's day is the day the keeper meant, wherever the phone is.

export type DateParts = { y: number; m: number; d: number };

const DAY_MS = 86_400_000;
const pad2 = (n: number) => String(n).padStart(2, "0");

export function parseDate(date: string): DateParts {
  const [y, m, d] = date.split("-").map(Number);
  return { y, m, d };
}

export function formatDate(y: number, m: number, d: number): string {
  return `${String(y).padStart(4, "0")}-${pad2(m)}-${pad2(d)}`;
}

/** The device-local calendar date: what relics/api `localDate()` reports, without importing the data layer. */
export function localToday(now: Date = new Date()): string {
  return formatDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Monday = 0 … Sunday = 6. */
export function weekdayIndex(y: number, m: number, d: number): number {
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

export function dayNumber(date: string): number {
  const { y, m, d } = parseDate(date);
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

export function addDays(date: string, days: number): string {
  const { y, m, d } = parseDate(date);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return formatDate(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

export function daysBetween(from: string, to: string): number {
  return dayNumber(to) - dayNumber(from);
}

/** Whole calendar months from `from`'s month to `to`'s month (ignores the day). */
export function monthsBetween(from: string, to: string): number {
  const a = parseDate(from);
  const b = parseDate(to);
  return (b.y - a.y) * 12 + (b.m - a.m);
}

/** Same month and day, ignoring the year. */
export function sameDayOfYear(a: string, b: string): boolean {
  return a.slice(5) === b.slice(5);
}

/** Rows of weeks (Monday first) for a month; null pads the days outside it. */
export function monthMatrix(y: number, m: number): (string | null)[][] {
  const lead = weekdayIndex(y, m, 1);
  const total = daysInMonth(y, m);
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= total; d++) cells.push(formatDate(y, m, d));
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

/** A local Date at noon, safe for locale formatting of a calendar day. */
export function toLocalDate(date: string): Date {
  const { y, m, d } = parseDate(date);
  return new Date(y, m - 1, d, 12);
}
