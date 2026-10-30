// Press feedback primitive: scale + dim on press-down, synchronous, interruptible.
import { Pressable as RNPressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { duration, scale, spring, timing } from "@/design/motion";
import { haptic } from "@/design/haptics";
import { hitSlop } from "@/design/tokens";

const APressable = Animated.createAnimatedComponent(RNPressable);

export type FeedbackPressableProps = PressableProps & {
  style?: StyleProp<ViewStyle>;
  pressScale?: number;
  haptics?: boolean;
};

export function Pressable({ style, pressScale = scale.pressed, haptics = true, onPressIn, onPressOut, onPress, disabled, ...rest }: FeedbackPressableProps) {
  const s = useSharedValue(1);
  const o = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }], opacity: o.value }));
  return (
    <APressable
      accessibilityRole="button"
      hitSlop={hitSlop}
      disabled={disabled}
      {...rest}
      style={[style, anim, disabled ? { opacity: 0.45 } : null]}
      onPressIn={(e) => {
        s.set(withTiming(pressScale, timing(duration.instant)));
        o.set(withTiming(0.85, timing(duration.instant)));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        s.set(withSpring(1, spring.settle));
        o.set(withTiming(1, timing(duration.quick)));
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptics) haptic.press();
        onPress?.(e);
      }}
    />
  );
}
