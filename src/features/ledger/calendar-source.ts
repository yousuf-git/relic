// The Ledger depends only on this interface. v1 ships InAppCalendarSource (the
// keeper's own relics); a DeviceCalendarSource built on expo-calendar can be
// added later and swapped in at useCalendarSource() without touching any UI.
import type { Relic } from "@/features/relics/api";
import type { Mood, Vessel } from "@/design/tokens";
import { localToday } from "./dates";
import { excerpt } from "./text";

/** Inclusive yyyy-mm-dd bounds. */
export type DateRange = { from: string; to: string };

export type DayItem = {
  id: string;
  /** Null for sealed relics: a capsule keeps its contents until it opens. */
  title: string | null;
  excerpt: string | null;
  vessel: Vessel;
  mood: Mood;
  weight: number;
  sealed: boolean;
  sealedUntil: string | null;
};

export type DayEntry = {
  date: string;
  count: number;
  /** Sum of the relics' emotional weights (1 feather … 5 stone each). */
  weight: number;
  /** Mood of the heaviest relic: the lamp's tint. */
  mood: Mood;
  /** Heaviest first. */
  items: DayItem[];
};

export interface CalendarSource {
  readonly id: string;
  /** Changes whenever the underlying data does, so cached days are refreshed. */
  readonly revision: number;
  getDays(range: DateRange): Promise<DayEntry[]>;
  /** First and last day this source has anything for; null when it is empty. */
  getExtent(): Promise<DateRange | null>;
}

export class InAppCalendarSource implements CalendarSource {
  readonly id = "in-app";
  readonly revision: number;
  private readonly relics: readonly Relic[];

  constructor(relics: readonly Relic[], revision: number) {
    this.relics = relics;
    this.revision = revision;
  }

  async getDays({ from, to }: DateRange): Promise<DayEntry[]> {
    const today = localToday();
    const byDay = new Map<string, DayItem[]>();
    for (const r of this.relics) {
      if (r.occurred_on < from || r.occurred_on > to) continue;
      const sealed = !!r.sealed_until && r.sealed_until > today;
      const item: DayItem = {
        id: r.id,
        title: sealed ? null : r.title,
        excerpt: sealed ? null : excerpt(r.body, 120),
        vessel: r.vessel,
        mood: r.mood,
        weight: r.weight,
        sealed,
        sealedUntil: r.sealed_until,
      };
      const list = byDay.get(r.occurred_on);
      if (list) list.push(item);
      else byDay.set(r.occurred_on, [item]);
    }
    return [...byDay].map(([date, list]) => {
      // Array#sort is stable: equal weights keep the query's newest-first order.
      const items = [...list].sort((a, b) => b.weight - a.weight);
      return {
        date,
        count: items.length,
        weight: items.reduce((sum, i) => sum + i.weight, 0),
        mood: items[0].mood,
        items,
      };
    });
  }

  async getExtent(): Promise<DateRange | null> {
    if (this.relics.length === 0) return null;
    let from = this.relics[0].occurred_on;
    let to = from;
    for (const r of this.relics) {
      if (r.occurred_on < from) from = r.occurred_on;
      if (r.occurred_on > to) to = r.occurred_on;
    }
    return { from, to };
  }
}

export type LampLevel = 0 | 1 | 2 | 3 | 4;

/** Brightness of a day's lamp from the count and weight of what was kept. */
export function lampLevel(entry: Pick<DayEntry, "count" | "weight"> | undefined): LampLevel {
  if (!entry || entry.count === 0) return 0;
  if (entry.weight <= 1) return 1;
  if (entry.weight <= 3) return 2;
  if (entry.weight <= 6) return 3;
  return 4;
}
