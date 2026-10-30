// Data API (PostgREST) client. Every request carries the keeper's short-lived
// JWT; Postgres RLS decides which rows come back.
import { PostgrestClient } from "@supabase/postgrest-js";
import { getJwt } from "./auth";
import { config } from "./config";

async function authedFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const send = async (force: boolean) => {
    const headers = new Headers(init.headers);
    headers.set("authorization", `Bearer ${await getJwt(force)}`);
    return fetch(input, { ...init, headers });
  };
  const res = await send(false);
  return res.status === 401 ? send(true) : res;
}

export const db = new PostgrestClient(config.dataApiUrl, { fetch: authedFetch });

// Server-enforced limits surface as Postgres errors with a stable `hint`.
export type LimitHint = "daily_limit" | "photo_limit" | "voice_limit" | "profile_missing";

export function limitHint(error: { hint?: string | null } | null): LimitHint | null {
  const h = error?.hint;
  return h === "daily_limit" || h === "photo_limit" || h === "voice_limit" || h === "profile_missing" ? h : null;
}
