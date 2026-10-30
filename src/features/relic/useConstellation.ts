import { useMemo } from "react";
import { useRelics } from "@/features/relics/api";

/**
 * Numbers and thread counts derived from the loaded vault. Relic Nº follows
 * creation order among relics still kept, so releasing one renumbers the rest.
 */
export function useConstellation() {
  const { data } = useRelics();
  return useMemo(() => {
    const byCreated = [...(data ?? [])].sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
    const numbers = new Map(byCreated.map((r, i) => [r.id, i + 1]));
    const people = new Map<string, number>();
    const places = new Map<string, number>();
    for (const r of data ?? []) {
      for (const { person } of r.people) people.set(person.id, (people.get(person.id) ?? 0) + 1);
      if (r.place_name) places.set(r.place_name, (places.get(r.place_name) ?? 0) + 1);
    }
    return {
      numberOf: (id: string) => numbers.get(id) ?? null,
      personCount: (id: string) => people.get(id) ?? 0,
      placeCount: (name: string) => places.get(name) ?? 0,
    };
  }, [data]);
}
