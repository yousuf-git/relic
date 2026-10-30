// Reminder prefs live in profiles.notification_prefs and are owned by Keeper's
// quarters; scheduling reads them with the same defaults the settings screen shows.
export { defaultPrefs, readPrefs, type NotificationPrefs } from "@/features/quarters/api";
