import { View } from "react-native";
import { Text } from "./Text";

/** Temporary route body until the feature lands. */
export function Placeholder({ name }: { name: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text variant="label">{name}</Text>
    </View>
  );
}
