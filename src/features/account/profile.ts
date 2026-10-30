import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCalendars } from "expo-localization";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/data";
import { keys } from "@/features/relics/api";

export type Profile = {
  user_id: string;
  display_name: string | null;
  timezone: string;
  plan: "free" | "premium";
  notification_prefs: Record<string, unknown>;
  onboarded_at: string | null;
  created_at: string;
};

export function deviceTimeZone(): string {
  return getCalendars()[0]?.timeZone ?? "UTC";
}

/** Loads the keeper's profile, creating it on first sign-in and keeping the timezone current. */
export function useProfile() {
  const user = useAuth((s) => s.user);
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: keys.profile,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db.from("profiles").select("*").maybeSingle();
      if (error) throw error;
      if (data) return data as Profile;
      const created = await db
        .from("profiles")
        .insert({ user_id: user!.id, display_name: user!.name || null, timezone: deviceTimeZone() })
        .select("*")
        .single();
      if (created.error) throw created.error;
      return created.data as Profile;
    },
  });

  const profile = query.data;
  useEffect(() => {
    if (!profile) return;
    const tz = deviceTimeZone();
    if (profile.timezone !== tz) {
      db.from("profiles").update({ timezone: tz }).eq("user_id", profile.user_id).then(() => qc.invalidateQueries({ queryKey: keys.profile }));
    }
  }, [profile, qc]);

  return query;
}
