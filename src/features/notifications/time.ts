/** Matches the Quarters default; used only if a stored time is somehow unreadable. */
export const DEFAULT_NUDGE_TIME = "20:00";

/** "HH:MM" to numbers, or null when it isn't a valid 24-hour time. */
export function parseTime(value: unknown): { hour: number; minute: number } | null {
  if (typeof value !== "string") return null;
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  return match ? { hour: Number(match[1]), minute: Number(match[2]) } : null;
}
