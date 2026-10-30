"use no memo";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { renderWidgetByName } from "./render";
import { loadSnapshot } from "./snapshot";

/**
 * Registered in the app entry with registerWidgetTaskHandler(). Android calls it
 * when a widget is added, resized or due its periodic update; it draws from the
 * snapshot the app last wrote. Every tap is an OPEN_URI deep link handled natively.
 */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  switch (props.widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE":
    case "WIDGET_RESIZED": {
      const element = renderWidgetByName(props.widgetInfo.widgetName, await loadSnapshot(), props.widgetInfo);
      if (element) props.renderWidget(element);
      break;
    }
    default:
      break;
  }
}
