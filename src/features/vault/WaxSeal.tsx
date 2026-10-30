import { Image } from "expo-image";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { art } from "@/design/art";

/** The wax seal art is an oval disc sitting a little above centre on a dark square; crop to it. */
const DISC_CENTER_Y = 0.44;
export function WaxSeal({ size, dim, style }: { size: number; dim?: boolean; style?: StyleProp<ViewStyle> }) {
  const full = size * 1.5;
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, overflow: "hidden", opacity: dim ? 0.22 : 1 }, style]}>
      <Image
        source={art.waxSeal}
        contentFit="cover"
        accessible={false}
        style={{ position: "absolute", width: full, height: full, left: (size - full) / 2, top: size / 2 - DISC_CENTER_Y * full }}
      />
    </View>
  );
}
