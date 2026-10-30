// Widgets cannot sign in or call the Data API, so the app writes a small JSON
// snapshot of what they show into its private documents directory and the
// widget task reads it back. The snapshot carries the next week of "relic of the
// day" and "on this day" picks, so a widget stays right across midnight even if
// the app is not opened.
import { File, Paths } from "expo-file-system";
import { duckStage } from "@/design/art";
import type { Mood, Vessel } from "@/design/tokens";
import { addDays, daysBetween, localToday, parseDate } from "@/features/ledger/dates";
import { excerpt } from "@/features/ledger/text";
import { promptForDate } from "@/features/prompts";
import type { Relic } from "@/features/relics/api";
import { onThisDayRelics, selectUnearthing } from "@/features/unearth/selection";
import { computeFlame } from "@/features/unearth/streak";

const FILE_NAME = "relic-widget-snapshot.json";
const VERSION = 1;
const HORIZON_DAYS = 7;
const ON_THIS_DAY_ROWS = 2;

export type WidgetRelic = {
  id: string;
  /** Null when previews are hidden. */
  title: string | null;
  line: string | null;
  vessel: Vessel;
  mood: Mood;
  occurredOn: string;
};

export type WidgetDay = {
  date: string;
  daily: WidgetRelic | null;
  onThisDay: (WidgetRelic & { yearsAgo: number })[];
  prompt: string;
};

export type WidgetSnapshot = {
  version: typeof VERSION;
  generatedAt: string;
  /** Titles and words are left out so a widget on the home screen reveals nothing. */
  hidePreviews: boolean;
  relicCount: number;
  duck: ReturnType<typeof duckStage>;
  /** The run as of its last kept day; see flameOn(). */
  flame: { run: number; lastKept: string | null; longest: number };
  days: WidgetDay[];
};

function toWidgetRelic(relic: Relic, hidePreviews: boolean): WidgetRelic {
  return {
    id: relic.id,
    title: hidePreviews ? null : relic.title,
    line: hidePreviews ? null : excerpt(relic.body, 90),
    vessel: relic.vessel,
    mood: relic.mood,
    occurredOn: relic.occurred_on,
  };
}

export function buildWidgetSnapshot(relics: readonly Relic[], now: Date, hidePreviews: boolean): WidgetSnapshot {
  const today = localToday(now);
  const flame = computeFlame(relics, today);
  const days: WidgetDay[] = [];
  for (let i = 0; i < HORIZON_DAYS; i++) {
    const date = addDays(today, i);
    const surfaced = selectUnearthing(relics, date).surfaced;
    days.push({
      date,
      daily: surfaced ? toWidgetRelic(surfaced.relic, hidePreviews) : null,
      onThisDay: onThisDayRelics(relics, date)
        .slice(0, ON_THIS_DAY_ROWS)
        .map((r) => ({ ...toWidgetRelic(r, hidePreviews), yearsAgo: parseDate(date).y - parseDate(r.occurred_on).y })),
      prompt: promptForDate(date),
    });
  }
  return {
    version: VERSION,
    generatedAt: now.toISOString(),
    hidePreviews,
    relicCount: relics.length,
    duck: duckStage(relics.length),
    flame: {
      run: flame.current,
      lastKept: flame.keptToday ? today : flame.current > 0 ? addDays(today, -1) : null,
      longest: flame.longest,
    },
    days,
  };
}

/** The snapshot's pick for a date, or null once the snapshot is older than its horizon. */
export function dayFor(snapshot: WidgetSnapshot | null, date: string): WidgetDay | null {
  return snapshot?.days.find((d) => d.date === date) ?? null;
}

/** Days in the run on `date`: it survives until the day after the last kept one. */
export function flameOn(snapshot: WidgetSnapshot | null, date: string): number {
  const flame = snapshot?.flame;
  return flame?.lastKept && daysBetween(flame.lastKept, date) <= 1 ? flame.run : 0;
}

const snapshotFile = () => new File(Paths.document, FILE_NAME);

export async function saveSnapshot(snapshot: WidgetSnapshot): Promise<void> {
  const file = snapshotFile();
  if (!file.exists) file.create();
  await file.write(JSON.stringify(snapshot));
}

export async function loadSnapshot(): Promise<WidgetSnapshot | null> {
  try {
    const file = snapshotFile();
    if (!file.exists) return null;
    const parsed = JSON.parse(await file.text()) as WidgetSnapshot;
    return parsed.version === VERSION ? parsed : null;
  } catch {
    return null;
  }
}

export function deleteSnapshot(): void {
  const file = snapshotFile();
  if (file.exists) file.delete();
}
