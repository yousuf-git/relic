// Neon Managed Better Auth over plain HTTPS. The SDK targets browsers (cookies,
// iframes), so the app keeps the session token in SecureStore, sends it back as
// the session cookie, and trades it for a short-lived JWT for Data API / vault.
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { config } from "./config";

const SESSION_KEY = "relic.session";
const COOKIE = "__Secure-neon-auth.session_token";
const JWT_TTL_MS = 12 * 60 * 1000; // Neon issues 15-minute tokens; refresh early.

export type User = { id: string; email: string; name: string; emailVerified: boolean };

export class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

type AuthState = {
  status: "loading" | "signedOut" | "signedIn";
  user: User | null;
  set: (s: Partial<Omit<AuthState, "set">>) => void;
};

export const useAuth = create<AuthState>((set) => ({ status: "loading", user: null, set }));

let sessionToken: string | null = null;
let jwt: { token: string; at: number } | null = null;
let jwtInFlight: Promise<string> | null = null;

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    origin: config.authOrigin,
    "content-type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (sessionToken) headers.cookie = `${COOKIE}=${sessionToken}`;
  return fetch(`${config.authUrl}${path}`, { ...init, headers });
}

async function fail(res: Response): Promise<never> {
  const body = await res.json().catch(() => ({}));
  throw new AuthError(body.code ?? `HTTP_${res.status}`, body.message ?? "Something went wrong", res.status);
}

function readSessionCookie(res: Response): string | null {
  const raw = res.headers.get("set-cookie");
  const match = raw?.match(new RegExp(`${COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function adoptSession(res: Response): Promise<User> {
  const body = await res.json();
  // The body's `token` is unsigned and is rejected as a cookie; only the signed cookie value works.
  const token = readSessionCookie(res);
  if (!token) throw new AuthError("NO_SESSION", "Sign-in did not return a session", 500);
  sessionToken = token;
  jwt = null;
  await SecureStore.setItemAsync(SESSION_KEY, token);
  useAuth.getState().set({ status: "signedIn", user: body.user });
  return body.user;
}

export async function restoreSession(): Promise<void> {
  sessionToken = await SecureStore.getItemAsync(SESSION_KEY);
  if (!sessionToken) return useAuth.getState().set({ status: "signedOut", user: null });
  try {
    const res = await request("/get-session");
    const body = res.ok ? await res.json() : null;
    if (body?.user) return useAuth.getState().set({ status: "signedIn", user: body.user });
    if (res.status >= 500) throw new Error("auth unavailable");
    await clearLocal();
  } catch {
    // Offline or server down: keep the vault reachable from cache.
    useAuth.getState().set({ status: "signedIn" });
  }
}

export async function signUpEmail(name: string, email: string, password: string): Promise<User> {
  const res = await request("/sign-up/email", { method: "POST", body: JSON.stringify({ name, email, password }) });
  if (!res.ok) await fail(res);
  return adoptSession(res);
}

export async function signInEmail(email: string, password: string): Promise<User> {
  const res = await request("/sign-in/email", { method: "POST", body: JSON.stringify({ email, password }) });
  if (!res.ok) await fail(res);
  return adoptSession(res);
}

export async function signInGoogleIdToken(idToken: string): Promise<User> {
  const res = await request("/sign-in/social", {
    method: "POST",
    body: JSON.stringify({ provider: "google", idToken: { token: idToken } }),
  });
  if (!res.ok) await fail(res);
  return adoptSession(res);
}

export async function requestPasswordReset(email: string): Promise<void> {
  const res = await request("/request-password-reset", {
    method: "POST",
    body: JSON.stringify({ email, redirectTo: `${config.authOrigin}/relic/reset` }),
  });
  if (!res.ok) await fail(res);
}

async function clearLocal() {
  sessionToken = null;
  jwt = null;
  await SecureStore.deleteItemAsync(SESSION_KEY);
  useAuth.getState().set({ status: "signedOut", user: null });
}

export async function signOut(): Promise<void> {
  await request("/sign-out", { method: "POST", body: "{}" }).catch(() => undefined);
  await clearLocal();
}

export { clearLocal as forgetSession };

export async function getJwt(force = false): Promise<string> {
  if (!force && jwt && Date.now() - jwt.at < JWT_TTL_MS) return jwt.token;
  if (jwtInFlight) return jwtInFlight;
  jwtInFlight = (async () => {
    const res = await request("/token");
    if (res.status === 401) {
      await clearLocal();
      throw new AuthError("SESSION_EXPIRED", "Your session ended. Sign in again.", 401);
    }
    if (!res.ok) await fail(res);
    const { token } = await res.json();
    jwt = { token, at: Date.now() };
    return token as string;
  })().finally(() => (jwtInFlight = null));
  return jwtInFlight;
}
