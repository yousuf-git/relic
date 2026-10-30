// The duck, docked in the header as the Keeper's companion. It starts clean and
// takes a small lift when the first relic is dispensed (beat 1).
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import Animated, { Extrapolation, interpolate, useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import { art } from "@/design/art";
import { scale } from "@/design/motion";
import { color } from "@/design/tokens";
import { Glow } from "@/ui/Glow";
import "./strings";

const SIZE = 52;
// duck-clean.webp is 864x1152 with the head and shoulders near (0.47, 0.25): zoom the portrait onto them.
const IMG_W = SIZE * 2.7;
const IMG_H = IMG_W * (1152 / 864);
const FOCUS = { x: 0.47, y: 0.25 };

export const COMPANION_SIZE = SIZE;

export function Companion({ depth }: { depth: SharedValue<number> }) {
  const { t } = useTranslation("welcome");
  const lift = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(depth.get(), [0, 1, 2], [1, scale.lifted, 1], Extrapolation.CLAMP) }],
  }));
  const glow = useAnimatedStyle(() => ({
    opacity: interpolate(depth.get(), [0, 1, 2], [0.55, 1, 0.55], Extrapolation.CLAMP),
  }));
  return (
    <Animated.View style={[styles.root, lift]} accessible accessibilityRole="image" accessibilityLabel={t("descent.companion")}>
      <Animated.View style={[styles.glow, glow]} pointerEvents="none">
        <Glow size={SIZE * 2.2} tint={color.lamp} intensity={0.4} />
      </Animated.View>
      <View style={styles.medallion}>
        <Image
          source={art.duck.clean}
          contentFit="cover"
          style={{ position: "absolute", width: IMG_W, height: IMG_H, left: SIZE / 2 - FOCUS.x * IMG_W, top: SIZE / 2 - FOCUS.y * IMG_H }}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { width: SIZE, height: SIZE },
  glow: { position: "absolute", left: -SIZE * 0.6, top: -SIZE * 0.6 },
  medallion: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: color.ironHigh,
    backgroundColor: color.shaft,
  },
});
