// Keeper's prompts: one a day, the same for the whole day, never repeating
// until the whole list has been walked. Used by the Unearth tab, notifications
// and widgets, so it works with or without React.
import i18n, { addNamespace } from "@/i18n";
import prompts from "@/i18n/en/prompts.json";
import { dayNumber } from "@/features/ledger/dates";

addNamespace("prompts", prompts);

export function promptList(): string[] {
  const list = i18n.t("prompts:list", { returnObjects: true }) as unknown;
  return Array.isArray(list) && list.length > 0 ? (list as string[]) : prompts.list;
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/** Stepping by a stride coprime with the list length visits every prompt once per cycle, in a shuffled-looking order. */
export function promptIndexForDate(date: string, length: number): number {
  let stride = Math.max(1, Math.round(length * 0.618));
  while (gcd(stride, length) !== 1) stride++;
  return (((dayNumber(date) * stride) % length) + length) % length;
}

export function promptForDate(date: string): string {
  const list = promptList();
  return list[promptIndexForDate(date, list.length)];
}
