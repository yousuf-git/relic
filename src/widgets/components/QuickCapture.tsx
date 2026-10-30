"use no memo";
import { FlexWidget, SvgWidget, TextWidget } from "react-native-android-widget";
import { color } from "@/design/tokens";
import i18n from "@/i18n";
import { link, surface, widgetFont, widgetIcon } from "../theme";

const t = (key: string) => i18n.t(`widgets:quickCapture.${key}`);

const BUTTONS = [
  { start: "words", icon: widgetIcon.words, label: "words", a11y: "a11yWords" },
  { start: "voice", icon: widgetIcon.voice, label: "voice", a11y: "a11yVoice" },
  { start: "photo", icon: widgetIcon.photo, label: "photo", a11y: "a11yPhoto" },
] as const;

/** Three ways in: each opens the Preserve ritual already holding words, voice or a photo. */
export function QuickCaptureWidget() {
  return (
    <FlexWidget style={{ ...surface, flexDirection: "row", alignItems: "center", padding: 8 }}>
      {BUTTONS.map((b, i) => (
        <FlexWidget
          key={b.start}
          clickAction="OPEN_URI"
          clickActionData={{ uri: link.preserve(b.start) }}
          accessibilityLabel={t(b.a11y)}
          style={{
            flex: 1,
            height: "match_parent",
            marginLeft: i === 0 ? 0 : 8,
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: color.iron,
            borderRadius: 14,
          }}
        >
          <SvgWidget svg={b.icon(color.lamp)} style={{ width: 24, height: 24 }} />
          <TextWidget
            text={t(b.label).toUpperCase()}
            style={{ fontFamily: widgetFont.mono, fontSize: 10, color: color.paper, letterSpacing: 1.2, marginTop: 4 }}
          />
        </FlexWidget>
      ))}
    </FlexWidget>
  );
}
