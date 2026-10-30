import { StyleSheet, View, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { color } from "@/design/tokens";

export function Screen({ style, children, edges = ["top", "bottom"], ...rest }: ViewProps & { edges?: ("top" | "bottom")[] }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      {...rest}
      style={[
        styles.root,
        { paddingTop: edges.includes("top") ? insets.top : 0, paddingBottom: edges.includes("bottom") ? insets.bottom : 0 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: color.shaft } });
