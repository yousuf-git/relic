// One toast at a time, bottom of screen, with an optional action (undo).
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { create } from "zustand";
import { color, radius, space } from "@/design/tokens";
import { Pressable } from "./Pressable";
import { Text } from "./Text";

type Toast = { id: number; message: string; actionLabel?: string; onAction?: () => void; ms?: number };
const useToastStore = create<{ toast: Toast | null; show: (t: Omit<Toast, "id">) => void; hide: () => void }>((set) => ({
  toast: null,
  show: (t) => set({ toast: { ...t, id: Date.now() } }),
  hide: () => set({ toast: null }),
}));

export const toast = (t: Omit<Toast, "id">) => useToastStore.getState().show(t);

export function ToastHost() {
  const { toast: t, hide } = useToastStore();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (!t) return;
    const timer = setTimeout(hide, t.ms ?? 5000);
    return () => clearTimeout(timer);
  }, [t, hide]);
  if (!t) return null;
  return (
    <Animated.View
      key={t.id}
      entering={FadeInDown.duration(220)}
      exiting={FadeOutDown.duration(160)}
      style={[styles.wrap, { bottom: insets.bottom + space.lg }]}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.toast}>
        <Text variant="bodySmall" style={{ color: color.paper, flex: 1 }}>
          {t.message}
        </Text>
        {t.actionLabel ? (
          <Pressable
            onPress={() => {
              t.onAction?.();
              hide();
            }}
            accessibilityLabel={t.actionLabel}
            style={styles.action}
          >
            <Text variant="button" style={{ color: color.lamp }}>
              {t.actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: space.md, right: space.md },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    backgroundColor: color.iron,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.ironHigh,
    paddingVertical: space.sm,
    paddingLeft: space.md,
    paddingRight: space.xs,
  },
  action: { minHeight: 44, justifyContent: "center", paddingHorizontal: space.sm },
});
