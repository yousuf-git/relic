import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useRelics } from "@/features/relics/api";
import { InAppCalendarSource, type CalendarSource, type DateRange, type DayEntry } from "./calendar-source";

const byDate = (entries: DayEntry[]) => new Map(entries.map((e) => [e.date, e]));

/** The one place a CalendarSource is chosen. Today that is the keeper's own relics. */
export function useCalendarSource() {
  const relics = useRelics();
  const { data, dataUpdatedAt } = relics;
  const source = useMemo<CalendarSource | null>(
    () => (data ? new InAppCalendarSource(data, dataUpdatedAt) : null),
    [data, dataUpdatedAt],
  );
  return { source, isPending: relics.isPending, isError: relics.isError, refetch: relics.refetch };
}

export function useCalendarDays(source: CalendarSource | null, range: DateRange) {
  return useQuery({
    queryKey: ["ledger", "days", source?.id, source?.revision, range.from, range.to],
    enabled: !!source,
    staleTime: Infinity,
    placeholderData: keepPreviousData,
    queryFn: () => source!.getDays(range),
    select: byDate,
  });
}

export function useCalendarExtent(source: CalendarSource | null) {
  return useQuery({
    queryKey: ["ledger", "extent", source?.id, source?.revision],
    enabled: !!source,
    staleTime: Infinity,
    queryFn: () => source!.getExtent(),
  });
}
