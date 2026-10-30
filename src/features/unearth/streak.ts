// Keeping the flame: consecutive days on which a relic was preserved. The day
// counts when the relic was kept, not the day it remembers, so backfilling the
// past never fakes a streak.
import { dayNumber, localToday } from "@/features/ledger/dates";
import type { Relic } from "@/features/relics/api";

export type Flame = {
  /** Days in the current run. Still alive today if yesterday was kept. */
  current: number;
  longest: number;
  keptToday: boolean;
};

export function computeFlame(relics: readonly Pick<Relic, "created_at">[], today: string): Flame {
  const kept = new Set<number>();
  for (const r of relics) kept.add(dayNumber(localToday(new Date(r.created_at))));

  const todayNo = dayNumber(today);
  const keptToday = kept.has(todayNo);

  let current = 0;
  for (let n = keptToday ? todayNo : todayNo - 1; kept.has(n); n--) current++;

  let longest = 0;
  let run = 0;
  let previous: number | null = null;
  for (const n of [...kept].sort((a, b) => a - b)) {
    run = previous !== null && n === previous + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = n;
  }

  return { current, longest, keptToday };
}
