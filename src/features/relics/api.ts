// Relic domain: types and React Query hooks shared by every screen.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db, limitHint } from "@/lib/data";
import { uploadPhoto, uploadVoice, type PreparedPhoto } from "@/lib/media";
import { vault } from "@/lib/vault";
import type { Mood, Vessel } from "@/design/tokens";

export type MediaRow = {
  id: string;
  kind: "photo" | "voice";
  status: "pending" | "ready";
  width: number | null;
  height: number | null;
  duration_ms: number | null;
  position: number;
};

export type Relic = {
  id: string;
  title: string | null;
  body: string | null;
  occurred_on: string; // yyyy-mm-dd
  weight: number; // 1 feather … 5 stone
  mood: Mood;
  vessel: Vessel;
  place_name: string | null;
  place_lat: number | null;
  place_lng: number | null;
  sealed_until: string | null;
  created_at: string;
  deleted_at: string | null;
  media: MediaRow[];
  links: { id: string; url: string; label: string | null }[];
  people: { person: { id: string; name: string } }[];
};

export type Person = { id: string; name: string };

const RELIC_SELECT =
  "*, media(id,kind,status,width,height,duration_ms,position), links(id,url,label), people:memory_people(person:people(id,name))";

export const keys = {
  relics: ["relics"] as const,
  relic: (id: string) => ["relic", id] as const,
  people: ["people"] as const,
  usage: ["usage"] as const,
  profile: ["profile"] as const,
  urls: (ids: string[]) => ["urls", ...ids] as const,
};

export function isSealed(r: Pick<Relic, "sealed_until">, today = localDate()): boolean {
  return !!r.sealed_until && r.sealed_until > today;
}

export function localDate(d = new Date()): string {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return z.toISOString().slice(0, 10);
}

/** The vessel follows the richest content the relic holds. */
export function vesselFor(input: { photos: number; voice: boolean; links: number; people: number; place: boolean }): Vessel {
  if (input.photos > 0) return "plate";
  if (input.voice) return "shell";
  if (input.links > 0) return "reel";
  if (input.people > 0) return "locket";
  if (input.place) return "map";
  return "letter";
}

export function useRelics() {
  return useQuery({
    queryKey: keys.relics,
    queryFn: async () => {
      const { data, error } = await db
        .from("memories")
        .select(RELIC_SELECT)
        .is("deleted_at", null)
        .order("occurred_on", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Relic[];
    },
  });
}

export function useRelic(id: string) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: keys.relic(id),
    queryFn: async () => {
      const { data, error } = await db.from("memories").select(RELIC_SELECT).eq("id", id).single();
      if (error) throw error;
      return data as unknown as Relic;
    },
    initialData: () => qc.getQueryData<Relic[]>(keys.relics)?.find((r) => r.id === id),
  });
}

export function usePeople() {
  return useQuery({
    queryKey: keys.people,
    queryFn: async () => {
      const { data, error } = await db.from("people").select("id,name").order("name");
      if (error) throw error;
      return data as Person[];
    },
  });
}

export type Usage = {
  plan: "free" | "premium";
  bytes_used: number;
  bytes_limit: number | null;
  relics_today: number;
  relics_today_limit: number | null;
};

export function useUsage() {
  return useQuery({
    queryKey: keys.usage,
    queryFn: async () => {
      const { data, error } = await db.rpc("vault_usage").single();
      if (error) throw error;
      const u = data as Usage;
      return { ...u, bytes_used: Number(u.bytes_used), bytes_limit: u.bytes_limit === null ? null : Number(u.bytes_limit) };
    },
  });
}

/** Signed, short-lived URLs for media ids. Sealed relics come back without URLs. */
export function useMediaUrls(ids: string[]) {
  return useQuery({
    queryKey: keys.urls(ids),
    enabled: ids.length > 0,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => (await vault.signReads(ids)).urls,
  });
}

export type RelicDraft = {
  id?: string;
  title: string;
  body: string;
  occurredOn: string;
  weight: number;
  mood: Mood;
  placeName: string | null;
  placeLat: number | null;
  placeLng: number | null;
  sealedUntil: string | null;
  people: string[]; // names
  links: { url: string; label?: string }[];
  newPhotos: PreparedPhoto[];
  voice: { uri: string; durationMs: number } | null;
  existingPhotos: number;
  hasExistingVoice: boolean;
};

export class LimitError extends Error {
  constructor(public hint: NonNullable<ReturnType<typeof limitHint>>) {
    super(hint);
  }
}

async function ensurePeople(names: string[]): Promise<string[]> {
  const clean = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  if (clean.length === 0) return [];
  const { data: existing, error } = await db.from("people").select("id,name");
  if (error) throw error;
  const byName = new Map((existing as Person[]).map((p) => [p.name.toLowerCase(), p.id]));
  const missing = clean.filter((n) => !byName.has(n.toLowerCase()));
  if (missing.length) {
    const { data, error: insErr } = await db.from("people").insert(missing.map((name) => ({ name }))).select("id,name");
    if (insErr) throw insErr;
    (data as Person[]).forEach((p) => byName.set(p.name.toLowerCase(), p.id));
  }
  return clean.map((n) => byName.get(n.toLowerCase())!);
}

/** Preserve (create) or reseal (edit) a relic, including people, links and media. */
export function useSaveRelic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (draft: RelicDraft) => {
      const vessel = vesselFor({
        photos: draft.existingPhotos + draft.newPhotos.length,
        voice: draft.hasExistingVoice || !!draft.voice,
        links: draft.links.length,
        people: draft.people.length,
        place: !!draft.placeName,
      });
      const row = {
        title: draft.title.trim() || null,
        body: draft.body.trim() || null,
        occurred_on: draft.occurredOn,
        weight: draft.weight,
        mood: draft.mood,
        vessel,
        place_name: draft.placeName,
        place_lat: draft.placeLat,
        place_lng: draft.placeLng,
        sealed_until: draft.sealedUntil,
      };
      const res = draft.id
        ? await db.from("memories").update(row).eq("id", draft.id).select("id").single()
        : await db.from("memories").insert(row).select("id").single();
      if (res.error) {
        const hint = limitHint(res.error);
        throw hint ? new LimitError(hint) : res.error;
      }
      const memoryId = (res.data as { id: string }).id;

      const personIds = await ensurePeople(draft.people);
      await db.from("memory_people").delete().eq("memory_id", memoryId);
      if (personIds.length) {
        const { error } = await db.from("memory_people").insert(personIds.map((person_id) => ({ memory_id: memoryId, person_id })));
        if (error) throw error;
      }
      await db.from("links").delete().eq("memory_id", memoryId);
      if (draft.links.length) {
        const { error } = await db
          .from("links")
          .insert(draft.links.map((l) => ({ memory_id: memoryId, url: l.url, label: l.label ?? null })));
        if (error) throw error;
      }
      for (const [i, photo] of draft.newPhotos.entries()) {
        await uploadPhoto(memoryId, photo, draft.existingPhotos + i);
      }
      if (draft.voice) await uploadVoice(memoryId, draft.voice.uri, draft.voice.durationMs);
      return memoryId;
    },
    onSettled: (id) => {
      qc.invalidateQueries({ queryKey: keys.relics });
      qc.invalidateQueries({ queryKey: keys.usage });
      qc.invalidateQueries({ queryKey: keys.people });
      if (id) qc.invalidateQueries({ queryKey: keys.relic(id) });
    },
  });
}

/** Release = soft delete; undo restores within the 30-day window. */
export function useReleaseRelic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, undo }: { id: string; undo?: boolean }) => {
      const { error } = await db
        .from("memories")
        .update({ deleted_at: undo ? null : new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, undo }) => {
      if (undo) return;
      await qc.cancelQueries({ queryKey: keys.relics });
      const prev = qc.getQueryData<Relic[]>(keys.relics);
      qc.setQueryData<Relic[]>(keys.relics, (list) => list?.filter((r) => r.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(keys.relics, ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.relics }),
  });
}
