import { Image } from "expo-image";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { art } from "@/design/art";
import type { Vessel } from "@/design/tokens";
import { Vignette } from "./Vignette";

/** A vessel's generated art, edge-faded into the shaft. */
export function VesselArt({ vessel, size, style }: { vessel: Vessel; size: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Image source={art.vessel[vessel]} style={{ width: size, height: size }} contentFit="cover" accessible={false} />
      <Vignette width={size} height={size} />
    </View>
  );
}
