// Scene helpers: scrims keep type on shaft, vignettes melt dark-ground art into the vault.
import { Canvas, Fill, LinearGradient, RadialGradient, vec } from "@shopify/react-native-skia";
import { StyleSheet, useWindowDimensions } from "react-native";
import { color } from "@/design/tokens";

export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255).toString(16).padStart(2, "0");
  return `${hex}${a}`;
}

const clear = withAlpha(color.shaft, 0);

/** Darkens the top lightly and the bottom heavily so copy and buttons always sit on shaft. */
export function Scrim({ top = 0.55, bottom = 0.96, clearFrom = 0.3, clearTo = 0.5 }: { top?: number; bottom?: number; clearFrom?: number; clearTo?: number }) {
  const { height } = useWindowDimensions();
  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Fill>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(0, height)}
          colors={[withAlpha(color.shaft, top), clear, clear, withAlpha(color.shaft, bottom)]}
          positions={[0, clearFrom, clearTo, 1]}
        />
      </Fill>
    </Canvas>
  );
}

/** Fades a square image into the shaft so its dark studio ground disappears. */
export function Vignette({ size, inner = 0.5 }: { size: number; inner?: number }) {
  const r = size / 2;
  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Fill>
        <RadialGradient c={vec(r, r)} r={r} colors={[clear, clear, color.shaft]} positions={[0, inner, 1]} />
      </Fill>
    </Canvas>
  );
}
