"use no memo";
import type { WidgetInfo } from "react-native-android-widget";
import { addNamespace } from "@/i18n";
import widgets from "@/i18n/en/widgets.json";
import { OnThisDayWidget } from "./components/OnThisDay";
import { QuickCaptureWidget } from "./components/QuickCapture";
import { RelicOfTheDayWidget } from "./components/RelicOfTheDay";
import { VaultStatsWidget } from "./components/VaultStats";
import type { WidgetSnapshot } from "./snapshot";

addNamespace("widgets", widgets);

/** Names match the `widgets[].name` entries of the react-native-android-widget plugin in app.json. */
export const WIDGET_NAMES = ["RelicOfTheDay", "OnThisDay", "QuickCapture", "VaultStats"] as const;
export type WidgetName = (typeof WIDGET_NAMES)[number];

export function renderWidgetByName(name: string, snapshot: WidgetSnapshot | null, info: WidgetInfo) {
  switch (name as WidgetName) {
    case "RelicOfTheDay":
      return <RelicOfTheDayWidget snapshot={snapshot} info={info} />;
    case "OnThisDay":
      return <OnThisDayWidget snapshot={snapshot} info={info} />;
    case "QuickCapture":
      return <QuickCaptureWidget />;
    case "VaultStats":
      return <VaultStatsWidget snapshot={snapshot} />;
    default:
      return null;
  }
}
