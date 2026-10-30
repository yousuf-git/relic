"use no memo";
import { FlexWidget, ImageWidget, TextWidget, type WidgetInfo } from "react-native-android-widget";
import { art } from "@/design/art";
import { color, moodLight } from "@/design/tokens";
import i18n from "@/i18n";
import { localToday } from "@/features/ledger/dates";
import { dayFor, type WidgetSnapshot } from "../snapshot";
import { link, surface, widgetFont } from "../theme";

const PAD = 12;
const t = (key: string, options?: Record<string, unknown>) => i18n.t(`widgets:${key}`, options);

/** The day's unearthed relic: its vessel on the left, a line of it on the right. Tap opens the relic. */
export function RelicOfTheDayWidget({ snapshot, info }: { snapshot: WidgetSnapshot | null; info: WidgetInfo }) {
  const daily = dayFor(snapshot, localToday())?.daily ?? null;
  const size = Math.min(Math.max(info.height - PAD * 2, 48), 104);

  if (!daily) {
    return (
      <FlexWidget
        clickAction="OPEN_URI"
        clickActionData={{ uri: link.unearth }}
        accessibilityLabel={t("relicOfTheDay.a11yEmpty")}
        style={{ ...surface, flexDirection: "row", alignItems: "center", padding: PAD }}
      >
        <ImageWidget image={art.duck.clean} imageWidth={Math.round(size * 0.75)} imageHeight={size} />
        <FlexWidget style={{ flex: 1, marginLeft: PAD, flexDirection: "column", justifyContent: "center" }}>
          <TextWidget text={t("relicOfTheDay.label").toUpperCase()} style={{ fontFamily: widgetFont.mono, fontSize: 10, color: color.ash, letterSpacing: 1.2 }} />
          <TextWidget text={t("relicOfTheDay.empty")} maxLines={3} style={{ fontFamily: widgetFont.body, fontSize: 15, color: color.paper }} />
        </FlexWidget>
      </FlexWidget>
    );
  }

  const heading = daily.title ?? daily.line ?? (snapshot?.hidePreviews ? t("relicOfTheDay.private") : t("untitled"));
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: link.relic(daily.id) }}
      accessibilityLabel={t("relicOfTheDay.a11y", { title: heading })}
      style={{ ...surface, flexDirection: "row", alignItems: "center", padding: PAD }}
    >
      <ImageWidget image={art.vessel[daily.vessel]} imageWidth={size} imageHeight={size} radius={12} />
      <FlexWidget style={{ flex: 1, marginLeft: PAD, flexDirection: "column", justifyContent: "center" }}>
        <TextWidget text={t("relicOfTheDay.label").toUpperCase()} style={{ fontFamily: widgetFont.mono, fontSize: 10, color: moodLight[daily.mood], letterSpacing: 1.2 }} />
        <TextWidget text={heading} maxLines={2} truncate="END" style={{ fontFamily: widgetFont.display, fontSize: 18, color: color.paper }} />
        {daily.title && daily.line ? (
          <TextWidget text={daily.line} maxLines={2} truncate="END" style={{ fontFamily: widgetFont.body, fontSize: 14, color: color.ash }} />
        ) : null}
      </FlexWidget>
    </FlexWidget>
  );
}
