// Mount once in the root layout, after the <Stack>. Sends a locked, signed-in keeper to /lock and
// keeps an opaque cover over the vault until the door screen is up, so nothing flashes through.
import { usePathname, useRootNavigationState, useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, { FadeOut } from "react-native-reanimated";
import { duration } from "@/design/motion";
import { color } from "@/design/tokens";
import { useAuth } from "@/lib/auth";
import { DoorBackdrop } from "./DoorBackdrop";
import { unlockNow } from "./store";
import { useAppLock } from "./useAppLock";

export function LockGate() {
  const router = useRouter();
  const pathname = usePathname();
  const navReady = !!useRootNavigationState()?.key;
  const status = useAuth((s) => s.status);
  const { ready, enabled, locked, veiled } = useAppLock();

  const signedIn = status === "signedIn";
  const shouldLock = signedIn && locked;
  const onDoor = pathname === "/lock";

  // The lock guards a restored session. A keeper who just proved themselves with a password needs no second door.
  useEffect(() => {
    if (status === "signedOut") unlockNow();
  }, [status]);

  useEffect(() => {
    if (shouldLock && navReady && !onDoor) router.push("/lock");
  }, [shouldLock, navReady, onDoor, router]);

  const covered = signedIn && (!ready || veiled || (shouldLock && !onDoor));
  if (!covered) return null;
  return (
    <Animated.View
      style={styles.cover}
      // The door screen fades in underneath; hold the cover until it has settled.
      exiting={FadeOut.delay(shouldLock ? duration.medium : 0).duration(shouldLock ? duration.short : duration.quick)}
    >
      {enabled ? <DoorBackdrop /> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cover: { ...StyleSheet.absoluteFill, backgroundColor: color.shaft },
});
