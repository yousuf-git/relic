// Film grain over the whole app: the one texture that unifies every surface.
import { Canvas, Fill, Shader, Skia } from "@shopify/react-native-skia";
import { StyleSheet, useWindowDimensions } from "react-native";

const grain = Skia.RuntimeEffect.Make(`
uniform float2 size;
half4 main(float2 p) {
  float n = fract(sin(dot(floor(p), float2(12.9898, 78.233))) * 43758.5453);
  return half4(half3(n), 1.0) * 0.045;
}`)!;

export function Grain() {
  const { width, height } = useWindowDimensions();
  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Fill>
        <Shader source={grain} uniforms={{ size: [width, height] }} />
      </Fill>
    </Canvas>
  );
}
