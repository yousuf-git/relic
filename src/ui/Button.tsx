import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { color, minTarget, radius, space } from "@/design/tokens";
import { Pressable } from "./Pressable";
import { Text } from "./Text";

type Props = {
  label: string;
  onPress?: () => void;
  tone?: "lamp" | "ghost" | "quiet" | "danger";
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

export function Button({ label, onPress, tone = "lamp", loading, disabled, icon, style, accessibilityHint }: Props) {
  const fg = tone === "lamp" ? color.onLamp : tone === "danger" ? color.danger : tone === "quiet" ? color.ash : color.paper;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
      style={[styles.base, styles[tone], style]}
    >
      <View style={styles.row}>
        {loading ? <ActivityIndicator color={fg} /> : icon}
        <Text variant="button" style={{ color: fg }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: minTarget + 4, borderRadius: radius.pill, paddingHorizontal: space.lg, justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.xs },
  lamp: { backgroundColor: color.lamp },
  ghost: { borderWidth: 1, borderColor: color.ironHigh, backgroundColor: color.stone },
  quiet: { backgroundColor: "transparent" },
  danger: { borderWidth: 1, borderColor: color.danger },
});
