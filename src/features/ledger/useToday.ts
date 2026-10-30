import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { localToday } from "./dates";

/** The keeper's local date, refreshed when the app returns to the foreground. */
export function useToday(): string {
  const [today, setToday] = useState(() => localToday());
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") setToday(localToday());
    });
    return () => sub.remove();
  }, []);
  return today;
}
