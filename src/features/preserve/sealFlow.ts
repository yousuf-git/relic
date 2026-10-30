// Sealing = useSaveRelic plus the failure handling the ritual needs: errors are
// classified for in-world copy, and a half-finished save is reconciled so a retry
// resumes the same relic instead of creating a second one.
import { useCallback, useRef } from "react";
import { LimitError, useSaveRelic } from "@/features/relics/api";
import { AuthError } from "@/lib/auth";
import { db } from "@/lib/data";
import { VaultError, vault } from "@/lib/vault";
import { toRelicDraft, type PreserveDraft } from "./draft";

export type SealProblem =
  | "daily_limit"
  | "photo_limit"
  | "voice_limit"
  | "voice_too_long"
  | "profile_missing"
  | "quota"
  | "session"
  | "offline"
  | "unknown";

export type Resume = { relicId: string; readyPhotos: number; readyVoice: boolean };

export class SealError extends Error {
  constructor(
    public problem: SealProblem,
    public resume: Resume | null,
  ) {
    super(problem);
  }
}

const CLOCK_SKEW_MS = 120_000;

export function classify(error: unknown): SealProblem {
  if (error instanceof LimitError) return error.hint;
  if (error instanceof VaultError) {
    if (error.code === "quota_exceeded" || error.status === 402) return "quota";
    if (error.code === "voice_too_long") return "voice_too_long";
    if (error.code === "photo_limit" || error.code === "voice_limit" || error.code === "profile_missing") return error.code;
    if (error.status === 401) return "session";
    return "unknown";
  }
  if (error instanceof AuthError) return "session";
  const fields = typeof error === "object" && error ? (error as { message?: unknown; code?: unknown }) : {};
  if (fields.code === "PGRST301" || fields.code === "PGRST303") return "session";
  const message = typeof fields.message === "string" ? fields.message : "";
  if (error instanceof TypeError || /network|failed to fetch|timed? ?out|offline|internet|connection/i.test(message)) return "offline";
  return "unknown";
}

/** The draft's fields that change once a partial save has been reconciled. */
export function applyResume(draft: PreserveDraft, resume: Resume): Partial<PreserveDraft> {
  const keptReady = draft.kept.filter((k) => k.id !== null);
  const uploaded = Math.max(0, resume.readyPhotos - keptReady.length);
  return {
    relicId: resume.relicId,
    plates: draft.plates.slice(uploaded),
    kept: [...keptReady, ...Array.from({ length: uploaded }, () => ({ id: null }))],
    keptVoice: draft.keptVoice || resume.readyVoice,
    voice: resume.readyVoice && !draft.keptVoice ? null : draft.voice,
  };
}

async function reconcile(relicId: string): Promise<Resume> {
  const { data, error } = await db.from("media").select("id,kind,status").eq("memory_id", relicId);
  if (error) throw error;
  const rows = data as { id: string; kind: "photo" | "voice"; status: "pending" | "ready" }[];
  // A pending row is an upload that never finished; it would still count against the photo limit.
  await Promise.all(rows.filter((r) => r.status === "pending").map((r) => vault.deleteMedia(r.id).catch(() => undefined)));
  return {
    relicId,
    readyPhotos: rows.filter((r) => r.kind === "photo" && r.status === "ready").length,
    readyVoice: rows.some((r) => r.kind === "voice" && r.status === "ready"),
  };
}

/** The relic a dropped connection may have created before the response got back. */
async function findCreated(draft: PreserveDraft, since: number): Promise<string | null> {
  const { data, error } = await db.from("memories").select("id,title,body,created_at").order("created_at", { ascending: false }).limit(1);
  if (error) throw error;
  const row = (data as { id: string; title: string | null; body: string | null; created_at: string }[])[0];
  if (!row || Date.parse(row.created_at) < since - CLOCK_SKEW_MS) return null;
  return (row.title ?? "") === draft.title.trim() && (row.body ?? "") === draft.body.trim() ? row.id : null;
}

export function useSealRelic() {
  const { mutateAsync } = useSaveRelic();
  const maybeCreatedSince = useRef<number | null>(null);

  return useCallback(
    async (draft: PreserveDraft): Promise<string> => {
      const startedAt = Date.now();
      let working = draft;
      try {
        if (!working.relicId && maybeCreatedSince.current !== null) {
          const found = await findCreated(working, maybeCreatedSince.current);
          if (found) working = { ...working, ...applyResume(working, await reconcile(found)) };
        }
        const id = await mutateAsync(toRelicDraft(working));
        maybeCreatedSince.current = null;
        return id;
      } catch (error) {
        const insertRefused = error instanceof LimitError && (error.hint === "daily_limit" || error.hint === "profile_missing");
        let resume: Resume | null = null;
        if (!insertRefused) {
          try {
            if (working.relicId) {
              if (working.plates.length || working.voice) resume = await reconcile(working.relicId);
            } else {
              maybeCreatedSince.current ??= startedAt;
              const found = await findCreated(working, maybeCreatedSince.current);
              if (found) resume = await reconcile(found);
            }
          } catch {
            // Offline: the next attempt checks again before creating anything.
          }
        }
        throw new SealError(classify(error), resume);
      }
    },
    [mutateAsync],
  );
}
