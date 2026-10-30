import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import type { Profile } from "@/features/account/profile";
import { keys } from "@/features/relics/api";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/data";
import { queryKeys } from "./constants";

// Profile ---------------------------------------------------------------

export function useRenameKeeper() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, name }: { userId: string; name: string | null }) => {
      const { error } = await db.from("profiles").update({ display_name: name }).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: (_data, { name }) => {
      qc.setQueryData<Profile>(keys.profile, (p) => (p ? { ...p, display_name: name } : p));
      qc.invalidateQueries({ queryKey: keys.profile });
    },
  });
}

// Reminders ---------------------------------------------------------------

export type NotificationPrefs = {
  enabled: boolean;
  /** "HH:MM", 24-hour, in the phone's local time. */
  nudgeTime: string;
  onThisDay: boolean;
  sealed: boolean;
  anniversaries: boolean;
};

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export const defaultPrefs: NotificationPrefs = {
  enabled: false,
  nudgeTime: "20:00",
  onThisDay: true,
  sealed: true,
  anniversaries: true,
};

export function readPrefs(raw: Record<string, unknown> | null | undefined): NotificationPrefs {
  const p = raw ?? {};
  const flag = (key: "enabled" | "onThisDay" | "sealed" | "anniversaries") =>
    typeof p[key] === "boolean" ? (p[key] as boolean) : defaultPrefs[key];
  return {
    enabled: flag("enabled"),
    nudgeTime: typeof p.nudgeTime === "string" && TIME_PATTERN.test(p.nudgeTime) ? p.nudgeTime : defaultPrefs.nudgeTime,
    onThisDay: flag("onThisDay"),
    sealed: flag("sealed"),
    anniversaries: flag("anniversaries"),
  };
}

/** Optimistic writes of the keeper's reminder prefs; resolves false when the server refused. */
export function useSavePrefs() {
  const qc = useQueryClient();
  const inflight = useRef(0);
  return useCallback(
    async (patch: Partial<NotificationPrefs>): Promise<boolean> => {
      const profile = qc.getQueryData<Profile>(keys.profile);
      if (!profile) return false;
      const next = { ...profile.notification_prefs, ...readPrefs(profile.notification_prefs), ...patch };
      qc.setQueryData<Profile>(keys.profile, { ...profile, notification_prefs: next });
      inflight.current += 1;
      const { error } = await db.from("profiles").update({ notification_prefs: next }).eq("user_id", profile.user_id);
      inflight.current -= 1;
      // Refetch only once the last write lands, so rapid taps don't flicker back.
      if (error || inflight.current === 0) qc.invalidateQueries({ queryKey: keys.profile });
      return !error;
    },
    [qc],
  );
}

// Waitlist ----------------------------------------------------------------

export function useWaitlist() {
  const user = useAuth((s) => s.user);
  return useQuery({
    queryKey: queryKeys.waitlist,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db.from("waitlist").select("user_id").maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
}

export function useWaitlistMembership() {
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  const join = useMutation({
    mutationFn: async () => {
      const { error } = await db.from("waitlist").insert({ user_id: user!.id });
      // 23505: unique violation, the keeper is already on the list.
      if (error && error.code !== "23505") throw error;
    },
    onSuccess: () => qc.setQueryData(queryKeys.waitlist, true),
  });
  const leave = useMutation({
    mutationFn: async () => {
      const { error } = await db.from("waitlist").delete().eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.setQueryData(queryKeys.waitlist, false),
  });
  return { join, leave };
}
