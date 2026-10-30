// The Keeper's companion. At rest it wears the age of the vault; when something
// is unearthed (or the screen is pulled to refresh) its head tilts back and the
// dispensing frame develops over it.
import { Image } from "expo-image";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { art } from "@/design/art";
import { duration, ease, timing } from "@/design/motion";
import { color } from "@/design/tokens";
import { Glow } from "@/ui/Glow";

const ASPECT = 864 / 1152;

export function DuckStage({ stage, tilted, height }: { stage: keyof typeof art.duck; tilted: boolean; height: number }) {
  const tilt = useSharedValue(0);
  useEffect(() => {
    tilt.set(withTiming(tilted ? 1 : 0, timing(duration.medium, ease.develop)));
  }, [tilted, tilt]);

  const tiltStyle = useAnimatedStyle(() => ({ opacity: tilt.get() }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.4 + 0.6 * tilt.get() }));

  return (
    <View style={[styles.stage, { height }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[styles.glow, glowStyle]}>
        <Glow size={height * 1.3} tint={color.lamp} intensity={0.3} />
      </Animated.View>
      <View style={{ width: height * ASPECT, height }}>
        <Image source={art.duck[stage]} contentFit="contain" style={StyleSheet.absoluteFill} />
        <Animated.View style={[StyleSheet.absoluteFill, tiltStyle]}>
          <Image source={art.duck.tilt} contentFit="contain" style={StyleSheet.absoluteFill} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: "center", justifyContent: "center" },
  glow: { position: "absolute" },
});
