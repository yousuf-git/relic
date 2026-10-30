import { StyleSheet } from "react-native";
import { color, minTarget, radius, space, type } from "@/design/tokens";

export const field = StyleSheet.create({
  input: {
    ...type.body,
    minHeight: minTarget + 4,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.ironHigh,
    backgroundColor: color.shaft,
  },
  chip: {
    minHeight: minTarget,
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.ironHigh,
    backgroundColor: color.stone,
  },
  chipOn: { borderColor: color.lamp },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: space.xs },
});
