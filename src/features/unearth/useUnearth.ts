import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useToday } from "@/features/ledger/useToday";
import { promptForDate } from "@/features/prompts";
import { useRelics } from "@/features/relics/api";
import { constellations } from "./constellations";
import { selectUnearthing } from "./selection";
import { dispensedKey, readDispensedDate } from "./state";
import { computeFlame } from "./streak";

export function useUnearth() {
  const relics = useRelics();
  const today = useToday();
  const dispensed = useQuery({ queryKey: dispensedKey, queryFn: readDispensedDate, staleTime: Infinity, gcTime: Infinity });

  const data = useMemo(() => {
    if (!relics.data) return null;
    return {
      count: relics.data.length,
      unearthing: selectUnearthing(relics.data, today),
      threads: constellations(relics.data),
      flame: computeFlame(relics.data, today),
      prompt: promptForDate(today),
    };
  }, [relics.data, today]);

  return {
    today,
    data,
    /** The ceremony has not played yet today. */
    fresh: dispensed.data !== today,
    isPending: relics.isPending || dispensed.isPending,
    isError: relics.isError,
    isRefetching: relics.isRefetching,
    refetch: relics.refetch,
  };
}
