import { useEffect } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useAuth } from "@/lib/auth";
import { isAuthenticating } from "./biometrics";
import { lockNow, useLockSession, useLockStore } from "./store";

const RELOCK_AFTER_MS = 30_000;

let leftAt: number | null = null;
let pausedDepth = 0;

/**
 * Wrap flows that background the app on purpose (photo picker, permission dialogs) so a long
 * pick does not lock the vault on the way back.
 */
export async function withLockPaused<T>(task: () => Promise<T>): Promise<T> {
  pausedDepth += 1;
  try {
    return await task();
  } finally {
    pausedDepth -= 1;
  }
}

function onAppStateChange(next: AppStateStatus) {
  if (!useLockStore.getState().enabled || useAuth.getState().status !== "signedIn") {
    leftAt = null;
    return;
  }
  if (next === "background") {
    if (pausedDepth > 0 || isAuthenticating()) return;
    leftAt = Date.now();
    // Cover the vault at once so the app switcher and the resume frame never show it.
    useLockSession.setState({ veiled: true });
    return;
  }
  if (next !== "active" || leftAt === null) return;
  const away = Date.now() - leftAt;
  leftAt = null;
  if (away >= RELOCK_AFTER_MS) lockNow();
  else useLockSession.setState({ veiled: false });
}

/**
 * Lock state for the gate. When the lock is enabled the vault starts locked on a cold start and
 * relocks after the app has been in the background for 30 seconds. Mount once (LockGate does).
 */
export function useAppLock() {
  const enabled = useLockStore((s) => s.enabled);
  const ready = useLockSession((s) => s.hydrated);
  const locked = useLockSession((s) => s.locked);
  const veiled = useLockSession((s) => s.veiled);
  useEffect(() => {
    const sub = AppState.addEventListener("change", onAppStateChange);
    return () => sub.remove();
  }, []);
  return { ready, enabled, locked: enabled && locked, veiled: enabled && veiled };
}
