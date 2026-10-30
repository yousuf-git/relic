// What to schedule, as plain data. Pure apart from reading copy from i18n, so it
// can be checked without a device. Copy is warm and never counts what was missed.
import { addDays, dayNumber, daysInMonth, formatDate, localToday, parseDate } from "@/features/ledger/dates";
import { agoLabel } from "@/features/ledger/text";
import { promptForDate } from "@/features/prompts";
import type { Relic } from "@/features/relics/api";
import i18n, { addNamespace } from "@/i18n";
import notifications from "@/i18n/en/notifications.json";
import { onThisDayRelics } from "@/features/unearth/selection";
import { levelOf } from "@/features/vault/format";
import type { NotificationPrefs } from "./prefs";
import { DEFAULT_NUDGE_TIME, parseTime } from "./time";

addNamespace("notifications", notifications);

export type PlannedNotification = {
  /** Stable, so re-scheduling replaces rather than duplicates. */
  id: string;
  kind: "sealed" | "anniversary" | "onThisDay" | "nudge";
  at: Date;
  title: string;
  body: string;
  /** In-app path opened when the notification is tapped. */
  url: string;
};

/** Android keeps only so many pending alarms; stay comfortably under ~50. */
export const MAX_SCHEDULED = 48;
export const ID_PREFIX = "relic.";
const MORNING = { hour: 9, minute: 0 };
const ON_THIS_DAY_HORIZON = 30;
const NUDGE_HORIZON = 10;
const MAX_SEALED = 12;
/** Ignore anything due within moments: scheduling in the past throws on Android. */
const LEAD_MS = 15_000;

const t = (key: string, options?: Record<string, unknown>) => i18n.t(`notifications:${key}`, options);
const atLocal = (date: string, hour: number, minute: number) => {
  const { y, m, d } = parseDate(date);
  return new Date(y, m - 1, d, hour, minute);
};

export function planNotifications(relics: readonly Relic[], prefs: NotificationPrefs, now: Date = new Date()): PlannedNotification[] {
  if (!prefs.enabled || relics.length === 0) return [];
  const today = localToday(now);
  const upcoming = (at: Date) => at.getTime() > now.getTime() + LEAD_MS;

  const sealed = prefs.sealed ? planSealed(relics, today, upcoming).slice(0, MAX_SEALED) : [];
  const anniversary = prefs.anniversaries ? planAnniversary(relics, now, upcoming) : [];
  const nudges = planNudges(relics, prefs, today, upcoming);
  const onThisDay = prefs.onThisDay ? planOnThisDay(relics, today, upcoming) : [];

  const room = Math.max(0, MAX_SCHEDULED - sealed.length - anniversary.length);
  const nudgeCount = Math.min(nudges.length, room);
  return [...sealed, ...anniversary, ...nudges.slice(0, nudgeCount), ...onThisDay.slice(0, room - nudgeCount)].sort(
    (a, b) => a.at.getTime() - b.at.getTime(),
  );
}

function planSealed(relics: readonly Relic[], today: string, upcoming: (at: Date) => boolean): PlannedNotification[] {
  const byDate = new Map<string, Relic[]>();
  for (const r of relics) {
    if (!r.sealed_until || r.sealed_until < today) continue;
    const list = byDate.get(r.sealed_until);
    if (list) list.push(r);
    else byDate.set(r.sealed_until, [r]);
  }
  return [...byDate]
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([date, list]): PlannedNotification[] => {
      const at = atLocal(date, MORNING.hour, MORNING.minute);
      if (!upcoming(at)) return [];
      const oldest = list.reduce((a, b) => (a.created_at <= b.created_at ? a : b));
      const ago = agoLabel(localToday(new Date(oldest.created_at)), date);
      return [
        {
          id: `${ID_PREFIX}sealed.${date}`,
          kind: "sealed",
          at,
          title: t("sealed.title", { count: list.length }),
          body: t("sealed.body", { count: list.length, ago }),
          url: list.length === 1 ? `/relic/${list[0].id}` : "/unearth",
        },
      ];
    });
}

function planAnniversary(relics: readonly Relic[], now: Date, upcoming: (at: Date) => boolean): PlannedNotification[] {
  const first = relics.reduce((a, b) => (a.created_at <= b.created_at ? a : b));
  const kept = parseDate(localToday(new Date(first.created_at)));
  for (let year = now.getFullYear(); year <= now.getFullYear() + 1; year++) {
    const date = formatDate(year, kept.m, Math.min(kept.d, daysInMonth(year, kept.m)));
    const at = atLocal(date, MORNING.hour, MORNING.minute);
    const years = year - kept.y;
    if (years < 1 || !upcoming(at)) continue;
    return [
      {
        id: `${ID_PREFIX}anniversary.${date}`,
        kind: "anniversary",
        at,
        title: t("anniversary.title", { count: years }),
        body: t("anniversary.body", { count: relics.length }),
        url: "/unearth",
      },
    ];
  }
  return [];
}

function planNudges(relics: readonly Relic[], prefs: NotificationPrefs, today: string, upcoming: (at: Date) => boolean): PlannedNotification[] {
  const time = parseTime(prefs.nudgeTime) ?? parseTime(DEFAULT_NUDGE_TIME)!;
  const keptToday = relics.some((r) => localToday(new Date(r.created_at)) === today);
  const titles = i18n.t("notifications:nudge.titles", { returnObjects: true }) as unknown;
  const titleList = Array.isArray(titles) && titles.length > 0 ? (titles as string[]) : notifications.nudge.titles;

  const out: PlannedNotification[] = [];
  for (let offset = 0; offset < NUDGE_HORIZON; offset++) {
    const date = addDays(today, offset);
    const at = atLocal(date, time.hour, time.minute);
    // A day already kept needs no nudge.
    if (!upcoming(at) || (offset === 0 && keptToday)) continue;
    out.push({
      id: `${ID_PREFIX}nudge.${date}`,
      kind: "nudge",
      at,
      title: titleList[dayNumber(date) % titleList.length],
      body: promptForDate(date),
      url: "/unearth",
    });
  }
  return out;
}

function planOnThisDay(relics: readonly Relic[], today: string, upcoming: (at: Date) => boolean): PlannedNotification[] {
  const out: PlannedNotification[] = [];
  for (let offset = 0; offset <= ON_THIS_DAY_HORIZON; offset++) {
    const date = addDays(today, offset);
    const at = atLocal(date, MORNING.hour, MORNING.minute);
    if (!upcoming(at)) continue;
    const kept = onThisDayRelics(relics, date);
    if (kept.length === 0) continue;
    const lead = kept[0];
    const years = parseDate(date).y - parseDate(lead.occurred_on).y;
    out.push({
      id: `${ID_PREFIX}onthisday.${date}`,
      kind: "onThisDay",
      at,
      title: t("onThisDay.title", { count: years }),
      body:
        kept.length > 1
          ? t("onThisDay.bodyMany", { count: kept.length })
          : lead.title
            ? t("onThisDay.bodyTitled", { title: lead.title })
            : t("onThisDay.bodyUntitled", { level: levelOf(lead.occurred_on, date) }),
      url: "/unearth",
    });
  }
  return out;
}
