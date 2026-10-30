// What surfaces today. Pure and deterministic: the same relics on the same
// local day always give the same answer, so the tab, the notification and the
// widget agree without sharing any state.
import { daysBetween, parseDate, sameDayOfYear, localToday } from "@/features/ledger/dates";
import type { Relic } from "@/features/relics/api";

/** Newer relics need a few days in the dark before they can rise. */
const SETTLING_DAYS = 7;

export type Surfaced = {
  relic: Relic;
  reason: "onThisDay" | "deep";
  /** Whole years back, for "on this day"; 0 otherwise. */
  yearsAgo: number;
};

export type Unearthing = {
  /** Relics whose seal runs out today. */
  unlocking: Relic[];
  surfaced: Surfaced | null;
};

export const isSealedOn = (relic: Pick<Relic, "sealed_until">, date: string) => !!relic.sealed_until && relic.sealed_until > date;

/** FNV-1a with a murmur3 finalizer: stable across engines, and ids that differ only in their last characters still spread apart. */
export function hash32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * Weighted draw (Efraimidis–Spirakis): each item gets the key u^(1/w) with u
 * hashed from seed + id, and the largest key wins. Heavier items win more often,
 * and adding an item to the pool rarely changes who won.
 */
export function weightedPick<T>(items: readonly T[], idOf: (item: T) => string, weightOf: (item: T) => number, seed: string): T | null {
  let best: T | null = null;
  let bestKey = -1;
  for (const item of items) {
    const u = (hash32(`${seed}:${idOf(item)}`) + 1) / 4294967297;
    const key = Math.pow(u, 1 / Math.max(1, weightOf(item)));
    if (key > bestKey) {
      bestKey = key;
      best = item;
    }
  }
  return best;
}

export function selectUnearthing(relics: readonly Relic[], today: string): Unearthing {
  const unlocking = relics.filter((r) => r.sealed_until === today);

  const candidates = relics.filter(
    (r) => !isSealedOn(r, today) && r.sealed_until !== today && r.occurred_on < today && localToday(new Date(r.created_at)) !== today,
  );

  const thisYear = parseDate(today).y;
  const onThisDay = candidates.filter((r) => sameDayOfYear(r.occurred_on, today) && parseDate(r.occurred_on).y < thisYear);
  if (onThisDay.length > 0) {
    const relic = weightedPick(onThisDay, (r) => r.id, (r) => r.weight, today)!;
    return { unlocking, surfaced: { relic, reason: "onThisDay", yearsAgo: thisYear - parseDate(relic.occurred_on).y } };
  }

  const settled = candidates.filter((r) => daysBetween(r.occurred_on, today) > SETTLING_DAYS);
  const relic = weightedPick(settled, (r) => r.id, (r) => r.weight, today);
  return { unlocking, surfaced: relic ? { relic, reason: "deep", yearsAgo: 0 } : null };
}

/** Everything kept on this month-day in earlier years, heaviest first (for the widget and notifications). */
export function onThisDayRelics(relics: readonly Relic[], date: string): Relic[] {
  const year = parseDate(date).y;
  return relics
    .filter((r) => !isSealedOn(r, date) && sameDayOfYear(r.occurred_on, date) && parseDate(r.occurred_on).y < year)
    .sort((a, b) => b.weight - a.weight || b.occurred_on.localeCompare(a.occurred_on));
}
