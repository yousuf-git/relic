"use no memo";
import { FlexWidget, ImageWidget, TextWidget, type WidgetInfo } from "react-native-android-widget";
import { art } from "@/design/art";
import { color, moodLight } from "@/design/tokens";
import i18n from "@/i18n";
import { localToday } from "@/features/ledger/dates";
import { dayFor, type WidgetSnapshot } from "../snapshot";
import { link, surface, widgetFont } from "../theme";

const PAD = 12;
const THUMB = 40;
const t = (key: string, options?: Record<string, unknown>) => i18n.t(`widgets:${key}`, options);

/** What was kept on this month-day in earlier years. Each row opens its relic; the header opens Unearth. */
export function OnThisDayWidget({ snapshot, info }: { snapshot: WidgetSnapshot | null; info: WidgetInfo }) {
  const rows = dayFor(snapshot, localToday())?.onThisDay ?? [];
  // Two rows only fit a taller widget; a short one shows the lead relic.
  const visible = rows.slice(0, info.height >= 140 ? 2 : 1);
  const label = t("onThisDay.label").toUpperCase();

  if (visible.length === 0) {
    return (
      <FlexWidget
        clickAction="OPEN_APP"
        accessibilityLabel={t("onThisDay.a11yEmpty")}
        style={{ ...surface, flexDirection: "column", justifyContent: "center", padding: PAD }}
      >
        <TextWidget text={label} style={{ fontFamily: widgetFont.mono, fontSize: 10, color: color.ash, letterSpacing: 1.2 }} />
        <TextWidget text={t("onThisDay.empty")} maxLines={3} style={{ fontFamily: widgetFont.body, fontSize: 15, color: color.paper }} />
      </FlexWidget>
    );
  }

  const summary = visible.map((r) => `${t("onThisDay.yearsAgo", { count: r.yearsAgo })}${r.title ? `, ${r.title}` : ""}`).join("; ");
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: link.unearth }}
      accessibilityLabel={t("onThisDay.a11y", { summary })}
      style={{ ...surface, flexDirection: "column", justifyContent: "center", padding: PAD }}
    >
      <TextWidget text={label} style={{ fontFamily: widgetFont.mono, fontSize: 10, color: color.ash, letterSpacing: 1.2 }} />
      {visible.map((r) => (
        <FlexWidget
          key={r.id}
          clickAction="OPEN_URI"
          clickActionData={{ uri: link.relic(r.id) }}
          style={{ width: "match_parent", flexDirection: "row", alignItems: "center", marginTop: 8 }}
        >
          <ImageWidget image={art.vessel[r.vessel]} imageWidth={THUMB} imageHeight={THUMB} radius={8} />
          <FlexWidget style={{ flex: 1, marginLeft: 10, flexDirection: "column", justifyContent: "center" }}>
            <TextWidget
              text={t("onThisDay.yearsAgo", { count: r.yearsAgo }).toUpperCase()}
              style={{ fontFamily: widgetFont.mono, fontSize: 10, color: moodLight[r.mood], letterSpacing: 1.2 }}
            />
            <TextWidget
              text={r.title ?? r.line ?? (snapshot?.hidePreviews ? t("onThisDay.private") : t("untitled"))}
              maxLines={1}
              truncate="END"
              style={{ fontFamily: widgetFont.display, fontSize: 16, color: color.paper }}
            />
          </FlexWidget>
        </FlexWidget>
      ))}
    </FlexWidget>
  );
}
