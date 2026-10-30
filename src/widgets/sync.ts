import { useEffect } from "react";
import { Platform } from "react-native";
import { requestWidgetUpdate } from "react-native-android-widget";
import { useRelics, type Relic } from "@/features/relics/api";
import { useAuth } from "@/lib/auth";
import { WIDGET_NAMES, renderWidgetByName } from "./render";
import { buildWidgetSnapshot, deleteSnapshot, saveSnapshot, type WidgetSnapshot } from "./snapshot";

async function redrawWidgets(snapshot: WidgetSnapshot | null): Promise<void> {
  await Promise.all(
    WIDGET_NAMES.map((widgetName) => requestWidgetUpdate({ widgetName, renderWidget: (info) => renderWidgetByName(widgetName, snapshot, info)! })),
  );
}

/**
 * Writes what the widgets show and redraws any that are on the home screen. Call
 * after relics change; `hidePreviews` keeps titles and words off the home screen.
 * Best effort: a widget that fails to draw must never break saving a relic.
 */
export async function writeWidgetSnapshot(relics: readonly Relic[], options: { hidePreviews?: boolean } = {}): Promise<void> {
  if (Platform.OS !== "android") return;
  try {
    const snapshot = buildWidgetSnapshot(relics, new Date(), options.hidePreviews ?? false);
    await saveSnapshot(snapshot);
    await redrawWidgets(snapshot);
  } catch {
    // The next change or launch writes it again.
  }
}

/** On sign-out: forget the vault and send the widgets back to their empty state. */
export async function clearWidgetSnapshot(): Promise<void> {
  if (Platform.OS !== "android") return;
  try {
    deleteSnapshot();
    await redrawWidgets(null);
  } catch {
    // Nothing was written, or there is nothing on screen to redraw.
  }
}

// The widgets show the keeper's own relics, so they go quiet with the session.
useAuth.subscribe((state, previous) => {
  if (state.status === "signedOut" && previous.status !== "signedOut") void clearWidgetSnapshot();
});

/** Mount in the signed-in vault layout: keeps the widgets in step with the keeper's relics. */
export function useWidgetSync(hidePreviews = false) {
  const relics = useRelics().data;
  useEffect(() => {
    if (relics) void writeWidgetSnapshot(relics, { hidePreviews });
  }, [relics, hidePreviews]);
}
