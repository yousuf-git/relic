// A bottom sheet in a transparent Modal. Mount it only while open: it rises on
// mount (a crossfade under reduced motion) and leaves instantly, because the
// keeper has already decided.
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeIn, ReduceMotion, SlideInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { duration, ease, useReducedMotion } from "@/design/motion";
import { color, radius, space } from "@/design/tokens";

export function Sheet({
  onClose,
  dismissable = true,
  scrollable = false,
  closeLabel,
  children,
}: {
  onClose: () => void;
  dismissable?: boolean;
  /** Long copy scrolls instead of overflowing small screens or large text. Keep wheels and lists out of it. */
  scrollable?: boolean;
  closeLabel: string;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const entering = reduced
    ? FadeIn.duration(duration.short).reduceMotion(ReduceMotion.Never)
    : SlideInDown.duration(duration.medium).easing(ease.enter);
  return (
    <Modal transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={dismissable ? onClose : undefined}>
      <View style={styles.root}>
        <Animated.View entering={FadeIn.duration(duration.short).reduceMotion(ReduceMotion.Never)} style={StyleSheet.absoluteFill}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={closeLabel}
            onPress={dismissable ? onClose : undefined}
            style={[StyleSheet.absoluteFill, styles.scrim]}
          />
        </Animated.View>
        <KeyboardAvoidingView behavior="padding" pointerEvents="box-none" style={styles.dock}>
          <Animated.View entering={entering} style={[styles.sheet, { paddingBottom: insets.bottom + space.lg }]}>
            {scrollable ? (
              <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" bounces={false}>
                {children}
              </ScrollView>
            ) : (
              <View style={styles.content}>{children}</View>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  scrim: { backgroundColor: color.scrim },
  dock: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    backgroundColor: color.stone,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderTopWidth: 1,
    borderColor: color.ironHigh,
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    maxHeight: "92%",
  },
  scroll: { flexGrow: 0 },
  content: { gap: space.md },
});
