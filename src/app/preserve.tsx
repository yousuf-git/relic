import { useLocalSearchParams } from "expo-router";
import { PreserveScreen } from "@/features/preserve/PreserveScreen";
import type { Start } from "@/features/preserve/HandChoice";

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const isStart = (value: string | undefined): value is Start => value === "words" || value === "voice" || value === "photo";

export default function PreserveRoute() {
  const params = useLocalSearchParams<{ id?: string; prompt?: string; start?: string; date?: string }>();
  const start = first(params.start);
  return (
    <PreserveScreen
      relicId={first(params.id) || undefined}
      prompt={first(params.prompt) || undefined}
      start={isStart(start) ? start : undefined}
      date={first(params.date) || undefined}
    />
  );
}
