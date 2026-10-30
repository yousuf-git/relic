import { Text as RNText, type TextProps } from "react-native";
import { type } from "@/design/tokens";

type Variant = keyof typeof type;

export function Text({ variant = "body", style, ...rest }: TextProps & { variant?: Variant }) {
  return <RNText maxFontSizeMultiplier={1.6} {...rest} style={[type[variant], style]} />;
}
