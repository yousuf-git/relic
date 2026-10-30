// The unearthing ceremony plays once a day. Which day it last played is the only
// thing remembered, and it lives on this device alone.
import * as SecureStore from "expo-secure-store";

const KEY = "relic.unearth.dispensed";

export const dispensedKey = ["unearth", "dispensed"] as const;

export async function readDispensedDate(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KEY);
  } catch {
    // An unreadable keystore only means the ceremony may replay.
    return null;
  }
}

export async function writeDispensedDate(date: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, date);
  } catch {
    // Same: not worth interrupting the ritual for.
  }
}
