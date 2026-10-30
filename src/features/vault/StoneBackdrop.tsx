// The shaft wall: the stone texture tiled with mirrored seams, drifting slower
// than the content so the relics feel closer than the rock behind them.
import { Image } from "expo-image";
import { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import { art } from "@/design/art";
import { color } from "@/design/tokens";

const TILE = 256;
const PARALLAX = 0.35;
const WALL_OPACITY = 0.5;

export const StoneBackdrop = memo(function StoneBackdrop({
  scrollY,
  width,
  height,
  reduced,
}: {
  scrollY: SharedValue<number>;
  width: number;
  height: number;
  reduced: boolean;
}) {
  const tiles = useMemo(() => {
    const cols = Math.ceil(width / TILE);
    const rows = Math.ceil(height / TILE) + 3;
    return Array.from({ length: cols * rows }, (_, i) => ({ col: i % cols, row: Math.floor(i / cols) }));
  }, [width, height]);

  const drift = useAnimatedStyle(() => ({
    // Mirrored tiles repeat every two tiles, so wrapping at 2 * TILE is seamless.
    transform: [{ translateY: reduced ? 0 : -((Math.max(0, scrollY.get()) * PARALLAX) % (TILE * 2)) }],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[{ position: "absolute", left: 0, top: 0, width, height: height + TILE * 3, opacity: WALL_OPACITY }, drift]}>
        {tiles.map(({ col, row }) => (
          <Image
            key={`${col}-${row}`}
            source={art.texture.stone}
            contentFit="cover"
            accessible={false}
            style={{
              position: "absolute",
              left: col * TILE,
              top: row * TILE,
              width: TILE,
              height: TILE,
              transform: [{ scaleX: col % 2 ? -1 : 1 }, { scaleY: row % 2 ? -1 : 1 }],
            }}
          />
        ))}
      </Animated.View>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: color.shaft, opacity: 0.45 }]} />
    </View>
  );
});
