"use no memo";
import { FlexWidget, ImageWidget, SvgWidget, TextWidget } from "react-native-android-widget";
import { art } from "@/design/art";
import { color } from "@/design/tokens";
import i18n from "@/i18n";
import { localToday } from "@/features/ledger/dates";
import { flameOn, type WidgetSnapshot } from "../snapshot";
import { link, surface, widgetFont, widgetIcon } from "../theme";

const t = (key: string, options?: Record<string, unknown>) => i18n.t(`widgets:stats.${key}`, options);

/** The flame, the relic count and a small duck that weathers with the vault. Tap opens Unearth. */
export function VaultStatsWidget({ snapshot }: { snapshot: WidgetSnapshot | null }) {
  const flame = flameOn(snapshot, localToday());
  const relics = snapshot?.relicCount ?? 0;
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: link.unearth }}
      accessibilityLabel={t("a11y", { count: relics, flame })}
      style={{ ...surface, flexDirection: "column", justifyContent: "space-between", padding: 12 }}
    >
      <FlexWidget style={{ flexDirection: "column" }}>
        <FlexWidget style={{ flexDirection: "row", alignItems: "center" }}>
          <SvgWidget svg={widgetIcon.flame(flame > 0 ? color.lamp : color.faint)} style={{ width: 22, height: 22 }} />
          {flame > 0 ? (
            <TextWidget text={String(flame)} style={{ fontFamily: widgetFont.display, fontSize: 30, color: color.paper, marginLeft: 4 }} />
          ) : null}
        </FlexWidget>
        <TextWidget
          text={(flame > 0 ? t("flame", { count: flame }) : t("flameNone")).toUpperCase()}
          maxLines={1}
          style={{ fontFamily: widgetFont.mono, fontSize: 9, color: color.ash, letterSpacing: 1 }}
        />
      </FlexWidget>
      <FlexWidget style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", width: "match_parent" }}>
        <FlexWidget style={{ flexDirection: "column" }}>
          <TextWidget text={String(relics)} style={{ fontFamily: widgetFont.mono, fontSize: 16, color: color.paper }} />
          <TextWidget text={t("relics", { count: relics }).toUpperCase()} style={{ fontFamily: widgetFont.mono, fontSize: 9, color: color.ash, letterSpacing: 1 }} />
        </FlexWidget>
        <ImageWidget image={art.duck[snapshot?.duck ?? "clean"]} imageWidth={36} imageHeight={48} />
      </FlexWidget>
    </FlexWidget>
  );
}
