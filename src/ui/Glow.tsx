// Lamp light: a soft radial pool, used behind relics and the active element only.
import { Canvas, Circle, RadialGradient, vec } from "@shopify/react-native-skia";
import type { StyleProp, ViewStyle } from "react-native";

export function Glow({ size, tint, intensity = 0.55, style }: { size: number; tint: string; intensity?: number; style?: StyleProp<ViewStyle> }) {
  const r = size / 2;
  const alpha = Math.round(Math.min(1, intensity) * 255).toString(16).padStart(2, "0");
  return (
    <Canvas style={[{ width: size, height: size }, style]} pointerEvents="none">
      <Circle cx={r} cy={r} r={r}>
        <RadialGradient c={vec(r, r)} r={r} colors={[`${tint}${alpha}`, `${tint}00`]} />
      </Circle>
    </Canvas>
  );
}
