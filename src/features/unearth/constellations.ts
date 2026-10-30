// Constellations: threads drawn automatically between relics that share a
// person or a place. Built from tags only.
import type { Relic } from "@/features/relics/api";

export type PersonThread = { id: string; name: string; count: number };
export type PlaceThread = { name: string; count: number };

/** A thread needs at least two relics. */
const MIN_RELICS = 2;

export function constellations(relics: readonly Relic[], limit = 4): { people: PersonThread[]; places: PlaceThread[] } {
  const people = new Map<string, PersonThread>();
  const places = new Map<string, PlaceThread>();

  for (const r of relics) {
    for (const { person } of r.people) {
      const thread = people.get(person.id);
      if (thread) thread.count++;
      else people.set(person.id, { id: person.id, name: person.name, count: 1 });
    }
    const place = r.place_name?.trim();
    if (place) {
      const key = place.toLowerCase();
      const thread = places.get(key);
      if (thread) thread.count++;
      else places.set(key, { name: place, count: 1 });
    }
  }

  const top = <T extends { name: string; count: number }>(threads: Map<string, T>) =>
    [...threads.values()]
      .filter((t) => t.count >= MIN_RELICS)
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, limit);

  return { people: top(people), places: top(places) };
}
