// The shaft is laid out up front: every row's height is a pure function of the
// relic, so the list can virtualise 1000+ relics with exact getItemLayout.
import { isSealed, type Relic } from "@/features/relics/api";
import { space } from "@/design/tokens";
import { MAX_LEVEL, formatMonth, monthKey, monthsBack, seedOf } from "./format";

/** Niche width by emotional weight: feather (1) is small, stone (5) is large. */
const NICHE_WIDTH = [88, 104, 120, 136, 152] as const;
const NICHE_RATIO = 1.12;
export const LEDGE = 8;
export const LEVEL_ROW = 72;
/** Room on the right edge for the depth gauge. */
export const GAUGE_WIDTH = 64;

export type LevelRow = {
  type: "level";
  key: string;
  level: number;
  month: string;
  count: number;
  /** Empty-month space above the marker. */
  extra: number;
  height: number;
  offset: number;
  levelIndex: number;
};

export type RelicRow = {
  type: "relic";
  key: string;
  relic: Relic;
  sealed: boolean;
  side: "left" | "right";
  inset: number;
  top: number;
  nicheWidth: number;
  nicheHeight: number;
  seed: number;
  height: number;
  offset: number;
  levelIndex: number;
};

export type Row = LevelRow | RelicRow;

export type LevelStop = { levelIndex: number; level: number; month: string; count: number; rowIndex: number; offset: number };

export type VaultLayout = { rows: Row[]; stops: LevelStop[]; contentEnd: number };

export function nicheSize(weight: number): { width: number; height: number } {
  const width = NICHE_WIDTH[Math.min(5, Math.max(1, Math.round(weight))) - 1];
  return { width, height: Math.round(width * NICHE_RATIO) };
}

export function buildLayout(relics: Relic[], today: string, headerHeight: number): VaultLayout {
  const groups: { key: string; day: string; items: Relic[] }[] = [];
  for (const r of relics) {
    const key = monthKey(r.occurred_on);
    const last = groups[groups.length - 1];
    if (last?.key === key) last.items.push(r);
    else groups.push({ key, day: r.occurred_on, items: [r] });
  }

  const rows: Row[] = [];
  const stops: LevelStop[] = [];
  let offset = headerHeight;
  let previousBack = -1;
  let flip = 0;

  groups.forEach((group, levelIndex) => {
    const back = monthsBack(group.day, today);
    const emptyMonths = previousBack < 0 ? 0 : Math.max(0, back - previousBack - 1);
    const extra = Math.min(emptyMonths, 3) * space.md;
    previousBack = back;
    const level = Math.min(MAX_LEVEL, back + 1);
    const month = formatMonth(group.day);

    const levelRow: LevelRow = {
      type: "level",
      key: `level-${group.key}`,
      level,
      month,
      count: group.items.length,
      extra,
      height: LEVEL_ROW + extra,
      offset,
      levelIndex,
    };
    stops.push({ levelIndex, level, month, count: group.items.length, rowIndex: rows.length, offset });
    rows.push(levelRow);
    offset += levelRow.height;

    for (const relic of group.items) {
      const seed = seedOf(relic.id);
      const { width, height } = nicheSize(relic.weight);
      const top = ((seed >>> 3) % 3) * space.xs;
      const row: RelicRow = {
        type: "relic",
        key: relic.id,
        relic,
        sealed: isSealed(relic, today),
        side: flip++ % 2 === 0 ? "left" : "right",
        inset: space.lg + (seed % 4) * space.xs,
        top,
        nicheWidth: width,
        nicheHeight: height,
        seed,
        height: top + height + LEDGE + space.xl,
        offset,
        levelIndex,
      };
      rows.push(row);
      offset += row.height;
    }
  });

  return { rows, stops, contentEnd: offset };
}
