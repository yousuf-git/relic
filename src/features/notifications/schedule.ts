// Local notifications only: nothing here talks to a server. Everything Relic
// schedules carries the "relic." identifier prefix, so a re-sync can cancel
// exactly its own and then schedule the plan again.
import * as Notifications from "expo-notifications";
import { AndroidImportance, AndroidNotificationVisibility } from "expo-notifications";
import { Platform } from "react-native";
import { color } from "@/design/tokens";
import { useAuth } from "@/lib/auth";
import type { Relic } from "@/features/relics/api";
import i18n from "@/i18n";
import { ID_PREFIX, planNotifications, type PlannedNotification } from "./plan";
import type { NotificationPrefs } from "./prefs";

export const CHANNEL_ID = "relic-default";

// Syncs run one at a time, and an unchanged plan is not rewritten within a session.
let queue: Promise<unknown> = Promise.resolve();
let lastPlan: string | null = null;

export type PermissionState = "granted" | "denied" | "undetermined";

export async function ensureChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: i18n.t("notifications:channel.name"),
    description: i18n.t("notifications:channel.description"),
    importance: AndroidImportance.DEFAULT,
    // Relic text is private: hide it on a secure lock screen, respecting the keeper's own device setting.
    lockscreenVisibility: AndroidNotificationVisibility.PRIVATE,
    lightColor: color.lamp,
    showBadge: false,
  });
}

export async function getNotificationPermission(): Promise<PermissionState> {
  const permission = await Notifications.getPermissionsAsync();
  if (permission.granted) return "granted";
  return permission.status === Notifications.PermissionStatus.UNDETERMINED ? "undetermined" : "denied";
}

/** Asks the system for permission. On Android 13+ the prompt only appears once a channel exists. */
export async function requestNotificationPermission(): Promise<boolean> {
  await ensureChannel();
  const permission = await Notifications.requestPermissionsAsync();
  return permission.granted;
}

export async function cancelRelicNotifications(): Promise<void> {
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    pending.filter((n) => n.identifier.startsWith(ID_PREFIX)).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
  lastPlan = null;
}

async function schedule(n: PlannedNotification): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: n.id,
    content: { title: n.title, body: n.body, data: { url: n.url }, color: color.lamp },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: n.at, channelId: CHANNEL_ID },
  });
}

export type SyncResult = { scheduled: number; skipped?: "disabled" | "no-permission" | "unchanged" };

async function runSync(relics: readonly Relic[], prefs: NotificationPrefs): Promise<SyncResult> {
  if (!prefs.enabled) {
    await cancelRelicNotifications();
    return { scheduled: 0, skipped: "disabled" };
  }
  if ((await getNotificationPermission()) !== "granted") {
    await cancelRelicNotifications();
    return { scheduled: 0, skipped: "no-permission" };
  }
  await ensureChannel();

  const plan = planNotifications(relics, prefs);
  const fingerprint = JSON.stringify(plan.map((n) => [n.id, n.at.getTime(), n.title, n.body, n.url]));
  if (fingerprint === lastPlan) return { scheduled: plan.length, skipped: "unchanged" };

  await cancelRelicNotifications();
  for (const n of plan) await schedule(n);
  lastPlan = fingerprint;
  return { scheduled: plan.length };
}

/** Cancels everything Relic scheduled, then schedules the current plan. Safe to call any number of times. */
export function syncNotifications(relics: readonly Relic[], prefs: NotificationPrefs): Promise<SyncResult> {
  const next = queue.then(() => runSync(relics, prefs));
  queue = next.catch(() => undefined);
  return next;
}

// Reminders quote the keeper's own relics, so they end with the session.
useAuth.subscribe((state, previous) => {
  if (state.status === "signedOut" && previous.status !== "signedOut") {
    queue = queue.then(cancelRelicNotifications).catch(() => undefined);
  }
});
