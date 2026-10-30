// The in-progress relic. Lives in memory for the length of the ritual; nothing
// reaches the server until the seal is held.
import { useReducer } from "react";
import type { Mood } from "@/design/tokens";
import { isSealed, localDate, type Relic, type RelicDraft } from "@/features/relics/api";
import { LIMITS, type PreparedPhoto } from "@/lib/media";
import { DATE_RE } from "./dates";

export const BODY_MAX = 10_000;
export const TITLE_MAX = 120;
export const PLACE_MAX = 160;
export const NAME_MAX = 80;
export const URL_MAX = 2048;
export const LINKS_MAX = 5;
export const DEFAULT_WEIGHT = 3;
export const DEFAULT_MOOD: Mood = "honey";

/** A photo being added. `photo` is null while it is still being prepared. */
export type PlateItem = { key: string; previewUri: string; photo: PreparedPhoto | null };
/** A photo the relic already holds on the server. */
export type KeptPlate = { id: string | null };

export type PreserveDraft = {
  relicId: string | null;
  title: string;
  body: string;
  occurredOn: string;
  weight: number;
  mood: Mood;
  placeName: string;
  placeLat: number | null;
  placeLng: number | null;
  people: string[];
  links: string[];
  sealedUntil: string | null;
  plates: PlateItem[];
  voice: { uri: string; durationMs: number } | null;
  kept: KeptPlate[];
  keptVoice: boolean;
};

export function emptyDraft(date?: string): PreserveDraft {
  const today = localDate();
  return {
    relicId: null,
    title: "",
    body: "",
    occurredOn: date && DATE_RE.test(date) && date <= today ? date : today,
    weight: DEFAULT_WEIGHT,
    mood: DEFAULT_MOOD,
    placeName: "",
    placeLat: null,
    placeLng: null,
    people: [],
    links: [],
    sealedUntil: null,
    plates: [],
    voice: null,
    kept: [],
    keptVoice: false,
  };
}

export function draftFromRelic(relic: Relic): PreserveDraft {
  const photos = relic.media.filter((m) => m.kind === "photo").sort((a, b) => a.position - b.position);
  return {
    relicId: relic.id,
    title: relic.title ?? "",
    body: relic.body ?? "",
    occurredOn: relic.occurred_on,
    weight: relic.weight,
    mood: relic.mood,
    placeName: relic.place_name ?? "",
    placeLat: relic.place_lat,
    placeLng: relic.place_lng,
    people: relic.people.map((p) => p.person.name),
    links: relic.links.map((l) => l.url),
    sealedUntil: isSealed(relic) ? relic.sealed_until : null,
    plates: [],
    voice: null,
    kept: photos.map((m) => ({ id: m.status === "ready" ? m.id : null })),
    keptVoice: relic.media.some((m) => m.kind === "voice"),
  };
}

export function signature(d: PreserveDraft): string {
  return JSON.stringify([
    d.title,
    d.body,
    d.occurredOn,
    d.weight,
    d.mood,
    d.placeName,
    d.people,
    d.links,
    d.sealedUntil,
    d.plates.map((p) => p.key),
    d.voice?.uri ?? null,
  ]);
}

export function hasSomethingToKeep(d: PreserveDraft): boolean {
  return !!(
    d.title.trim() ||
    d.body.trim() ||
    d.placeName.trim() ||
    d.people.length ||
    d.links.length ||
    d.plates.length ||
    d.voice ||
    d.kept.length ||
    d.keptVoice
  );
}

export function photoRoom(d: PreserveDraft): number {
  return Math.max(0, LIMITS.photosPerRelic - d.kept.length - d.plates.length);
}

export function toRelicDraft(d: PreserveDraft): RelicDraft {
  const placeName = d.placeName.trim();
  return {
    id: d.relicId ?? undefined,
    title: d.title,
    body: d.body,
    occurredOn: d.occurredOn,
    weight: d.weight,
    mood: d.mood,
    placeName: placeName || null,
    placeLat: placeName ? d.placeLat : null,
    placeLng: placeName ? d.placeLng : null,
    sealedUntil: d.sealedUntil && d.sealedUntil > localDate() ? d.sealedUntil : null,
    people: d.people,
    links: d.links.map((url) => ({ url })),
    newPhotos: d.plates.flatMap((p) => (p.photo ? [p.photo] : [])),
    voice: d.voice,
    existingPhotos: d.kept.length,
    hasExistingVoice: d.keptVoice,
  };
}

type Patch = Partial<PreserveDraft> | ((d: PreserveDraft) => Partial<PreserveDraft>);

export function usePreserveDraft(initial: PreserveDraft) {
  return useReducer((d: PreserveDraft, patch: Patch) => ({ ...d, ...(typeof patch === "function" ? patch(d) : patch) }), initial);
}

/** Adds dictated words to the letter, capitalising after a full stop. */
export function appendSpoken(body: string, spoken: string): string {
  const startsSentence = body.trim() === "" || /[.!?…]["')\]]?\s*$/.test(body);
  const piece = startsSentence ? spoken.charAt(0).toUpperCase() + spoken.slice(1) : spoken;
  const gap = body === "" || /\s$/.test(body) ? "" : " ";
  return (body + gap + piece).slice(0, BODY_MAX);
}

const LINK_RE = /^https:\/\/([^\s/?#:@]+\.[^\s/?#:@]{2,})(?::\d+)?(?:[/?#]\S*)?$/i;

export type LinkCheck = { ok: true; url: string; host: string } | { ok: false; reason: "empty" | "insecure" | "invalid" };

/** Video links are stored as https URLs only; a bare host gets https:// added. */
export function checkVideoLink(input: string): LinkCheck {
  let value = input.trim();
  if (!value) return { ok: false, reason: "empty" };
  if (/^http:\/\//i.test(value)) return { ok: false, reason: "insecure" };
  if (!/^[a-z][a-z0-9+.-]*:/i.test(value)) value = `https://${value}`;
  const match = value.length <= URL_MAX ? LINK_RE.exec(value) : null;
  if (!match) return { ok: false, reason: "invalid" };
  return { ok: true, url: value, host: match[1].replace(/^www\./i, "") };
}
