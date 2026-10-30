import { Stack } from "expo-router";
import { color } from "@/design/tokens";

export default function WelcomeLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.shaft }, animation: "fade" }} />;
}
