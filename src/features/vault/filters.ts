import { isSealed, type Relic } from "@/features/relics/api";
import type { Mood, Vessel } from "@/design/tokens";

export type Filters = { q: string; person: string | null; place: string | null; mood: Mood | null; vessel: Vessel | null };

export const NO_FILTERS: Filters = { q: "", person: null, place: null, mood: null, vessel: null };

export const isFiltering = (f: Filters) => !!(f.q.trim() || f.person || f.place || f.mood || f.vessel);

/** Lower-cased searchable text per relic; sealed relics never match text. */
export function searchIndex(relics: Relic[], today: string): Map<string, string> {
  const index = new Map<string, string>();
  for (const r of relics) {
    if (isSealed(r, today)) continue;
    const people = r.people.map((p) => p.person.name).join(" ");
    index.set(r.id, `${r.title ?? ""}\n${r.body ?? ""}\n${r.place_name ?? ""}\n${people}`.toLowerCase());
  }
  return index;
}

export function applyFilters(relics: Relic[], f: Filters, index: Map<string, string>): Relic[] {
  if (!isFiltering(f)) return relics;
  const q = f.q.trim().toLowerCase();
  return relics.filter((r) => {
    if (f.person && !r.people.some((p) => p.person.id === f.person)) return false;
    if (f.place && r.place_name !== f.place) return false;
    if (f.mood && r.mood !== f.mood) return false;
    if (f.vessel && r.vessel !== f.vessel) return false;
    if (q && !index.get(r.id)?.includes(q)) return false;
    return true;
  });
}

export type Facets = {
  people: { id: string; name: string; count: number }[];
  places: { name: string; count: number }[];
};

export function facetsOf(relics: Relic[]): Facets {
  const people = new Map<string, { id: string; name: string; count: number }>();
  const places = new Map<string, { name: string; count: number }>();
  for (const r of relics) {
    for (const { person } of r.people) {
      const entry = people.get(person.id) ?? { id: person.id, name: person.name, count: 0 };
      entry.count += 1;
      people.set(person.id, entry);
    }
    if (r.place_name) {
      const entry = places.get(r.place_name) ?? { name: r.place_name, count: 0 };
      entry.count += 1;
      places.set(r.place_name, entry);
    }
  }
  const byCount = <T extends { count: number; name: string }>(a: T, b: T) => b.count - a.count || a.name.localeCompare(b.name);
  return { people: [...people.values()].sort(byCount), places: [...places.values()].sort(byCount) };
}
