// App lock state. `useLockStore` is the keeper's choice, persisted in SecureStore.
// `useLockSession` is runtime only: a cold start always begins locked.
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { authenticate, type AuthResult } from "./biometrics";

export const useLockSession = create<{ hydrated: boolean; locked: boolean; veiled: boolean }>(() => ({
  hydrated: false,
  locked: true,
  veiled: false,
}));

export const useLockStore = create<{ enabled: boolean }>()(
  persist((): { enabled: boolean } => ({ enabled: false }), {
    name: "relic.lock",
    storage: createJSONStorage(() => ({
      getItem: (key) => SecureStore.getItemAsync(key),
      setItem: (key, value) => SecureStore.setItemAsync(key, value),
      removeItem: (key) => SecureStore.deleteItemAsync(key),
    })),
    // Fires on success and on a failed read, so the gate never waits forever.
    onRehydrateStorage: () => () => useLockSession.setState({ hydrated: true }),
  }),
);

export const lockNow = () => useLockSession.setState({ locked: true, veiled: false });
export const unlockNow = () => useLockSession.setState({ locked: false, veiled: false });

/** Turns the lock on only after a successful authentication, so a keeper can't bolt themselves out. */
export async function enableAppLock(): Promise<AuthResult> {
  const result = await authenticate("enable");
  if (result.ok) {
    unlockNow();
    useLockStore.setState({ enabled: true });
  }
  return result;
}

/** Asks for authentication too, unless the phone has no screen lock left to ask with. */
export async function disableAppLock(): Promise<AuthResult> {
  const result = await authenticate("disable");
  if (!result.ok && result.reason !== "unavailable") return result;
  useLockStore.setState({ enabled: false });
  return { ok: true };
}
