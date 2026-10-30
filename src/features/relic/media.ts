import { isSealed, type MediaRow, type Relic } from "@/features/relics/api";

/** Ready media in order. Sealed relics expose none: their plates and voice stay dark. */
export function mediaOf(relic: Relic, today?: string): { photos: MediaRow[]; voice: MediaRow | null } {
  if (isSealed(relic, today)) return { photos: [], voice: null };
  const ready = relic.media.filter((m) => m.status === "ready").sort((a, b) => a.position - b.position);
  return { photos: ready.filter((m) => m.kind === "photo"), voice: ready.find((m) => m.kind === "voice") ?? null };
}

/**
 * The id list given to useMediaUrls. The relic view and the share card both
 * derive it here so they share one signed-URL cache entry.
 */
export function mediaIdsOf(relic: Relic, today?: string): string[] {
  const { photos, voice } = mediaOf(relic, today);
  return [...photos.map((m) => m.id), ...(voice ? [voice.id] : [])];
}
