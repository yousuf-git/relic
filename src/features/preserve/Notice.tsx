import { StyleSheet, View } from "react-native";
import { color, radius, space } from "@/design/tokens";
import { Text } from "@/ui/Text";

/** A quiet in-world message: the vault resting, a connection lost, a limit reached. */
export function Notice({ children }: { children: string }) {
  return (
    <View style={styles.box} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Text variant="body">{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.lampDeep,
    backgroundColor: color.stone,
  },
});
