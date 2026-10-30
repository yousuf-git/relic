import { useQuery } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { useRouter, type Href } from "expo-router";
import { useEffect, useMemo } from "react";
import type { Profile } from "@/features/account/profile";
import { keys, useRelics } from "@/features/relics/api";
import { readPrefs } from "./prefs";
import { ensureChannel, syncNotifications } from "./schedule";

// While the app is open a reminder still appears, quietly.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

/**
 * Mount once inside the signed-in vault layout. Keeps scheduled reminders in step
 * with the relics and the keeper's preferences, and opens `data.url` when a
 * reminder is tapped (including the tap that launched the app).
 */
export function useNotificationSync() {
  const router = useRouter();
  const relics = useRelics().data;
  // Read-only view of the profile that the vault layout's useProfile() already loads.
  const profile = useQuery<Profile>({ queryKey: keys.profile, enabled: false }).data;
  const prefs = useMemo(() => readPrefs(profile?.notification_prefs), [profile?.notification_prefs]);

  // Android 13+ only shows the permission prompt once a channel exists, so have one before Quarters asks.
  useEffect(() => {
    ensureChannel().catch(() => {
      // Retried by the next sync.
    });
  }, []);

  useEffect(() => {
    if (!relics || !profile) return;
    syncNotifications(relics, prefs).catch(() => {
      // Reminders are best effort; the next relic or launch tries again.
    });
  }, [relics, profile, prefs]);

  const response = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const url = response.notification.request.content.data?.url;
    if (typeof url === "string" && url.startsWith("/")) router.push(url as Href);
    Notifications.clearLastNotificationResponse();
  }, [response, router]);
}
