// Dissolves the square edges of generated vessel art into the shaft.
import { Canvas, Rect, RadialGradient, vec } from "@shopify/react-native-skia";
import { StyleSheet } from "react-native";
import { color } from "@/design/tokens";

export function Vignette({ width, height, tint = color.shaft }: { width: number; height: number; tint?: string }) {
  const r = Math.max(width, height) / 2;
  return (
    <Canvas style={[StyleSheet.absoluteFill, { width, height }]} pointerEvents="none">
      <Rect x={0} y={0} width={width} height={height}>
        <RadialGradient c={vec(width / 2, height / 2)} r={r} colors={[`${tint}00`, `${tint}00`, tint]} positions={[0, 0.5, 0.98]} />
      </Rect>
    </Canvas>
  );
}
