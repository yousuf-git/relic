// The 4:5 share card. It is captured as a PNG, so it is built from plain views
// and images only (no Skia, no running animations) and never scales with system
// font size; everything is sized from one unit so the preview matches the file.
import { Image } from "expo-image";
import type { ComponentRef, Ref } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { art } from "@/design/art";
import { color, font } from "@/design/tokens";
import type { Relic } from "@/features/relics/api";
import { excerpt, formatDay } from "@/features/vault/format";
import { WaxSeal } from "@/features/vault/WaxSeal";
import { Icon } from "@/ui/Icon";
import { Text } from "@/ui/Text";
import "./i18n";

export type CardStyle = "plate" | "letter";

type Props = {
  ref?: Ref<ComponentRef<typeof View>>;
  relic: Relic;
  cardStyle: CardStyle;
  width: number;
  number: number | null;
  /** Signed URL of the first photograph, when the card should be photo-led. */
  photoUrl: string | null;
  onPhotoLoad: () => void;
  onPhotoError: () => void;
};

const RATIO = 1.25;
const DESIGN_WIDTH = 360;
// The generated paper sheet sits inside the stone backdrop at these fractions of the card.
const PAPER = { left: 0.145, top: 0.105, width: 0.715, height: 0.79 };

function Footer({ u, n, ink, muted }: { u: number; n: number | null; ink: string; muted: string }) {
  const { t } = useTranslation("share");
  return (
    <View style={[styles.footer, { gap: 6 * u }]}>
      <Icon name="nut" size={16 * u} color={ink} strokeWidth={1.4} />
      <Text variant="catalog" allowFontScaling={false} style={{ fontSize: 10.5 * u, lineHeight: 14 * u, letterSpacing: 1.4 * u, color: ink }}>
        {t("card.kept")}
      </Text>
      <View style={styles.spacer} />
      {n === null ? null : (
        <Text variant="catalog" allowFontScaling={false} style={{ fontSize: 10.5 * u, lineHeight: 14 * u, letterSpacing: 1.2 * u, color: muted }}>
          {t("card.number", { n: String(n).padStart(4, "0") })}
        </Text>
      )}
    </View>
  );
}

export function ShareCard({ ref, relic, cardStyle, width, number, photoUrl, onPhotoLoad, onPhotoError }: Props) {
  const u = width / DESIGN_WIDTH;
  const height = Math.round(width * RATIO);
  const title = relic.title?.trim() ?? "";
  const meta = [formatDay(relic.occurred_on), relic.place_name].filter(Boolean).join("  ·  ");

  if (cardStyle === "letter") {
    const sheet = { left: width * PAPER.left, top: height * PAPER.top, width: width * PAPER.width, height: height * PAPER.height };
    const pad = 22 * u;
    return (
      <View ref={ref} collapsable={false} style={{ width, height, backgroundColor: color.shaft, overflow: "hidden" }}>
        <Image source={art.share.paper} contentFit="cover" transition={0} accessible={false} style={StyleSheet.absoluteFill} />
        <View style={[styles.sheet, sheet, { padding: pad }]}>
          <Text variant="catalog" allowFontScaling={false} numberOfLines={2} style={{ fontSize: 11 * u, lineHeight: 16 * u, letterSpacing: 1.6 * u, color: color.ironHigh, textTransform: "uppercase", paddingRight: 52 * u }}>
            {meta}
          </Text>
          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: color.ironHigh, opacity: 0.5, marginVertical: 12 * u }} />
          {title ? (
            <Text variant="title" allowFontScaling={false} numberOfLines={2} style={{ fontSize: 26 * u, lineHeight: 31 * u, color: color.shaft, marginBottom: 10 * u }}>
              {title}
            </Text>
          ) : null}
          <Text
            variant="body"
            allowFontScaling={false}
            numberOfLines={title ? 7 : 10}
            style={{ fontFamily: font.body, fontSize: 16 * u, lineHeight: 24 * u, color: color.iron }}
          >
            {excerpt(relic.body, title ? 230 : 330)}
          </Text>
          <View style={styles.spacer} />
          <Footer u={u} n={number} ink={color.iron} muted={color.ironHigh} />
        </View>
        <WaxSeal size={46 * u} style={{ position: "absolute", top: height * PAPER.top - 14 * u, right: width * (1 - PAPER.left - PAPER.width) + 18 * u }} />
      </View>
    );
  }

  const frame = { left: 28 * u, top: 28 * u, width: width - 56 * u, height: 244 * u };
  const text = relic.body?.trim() ? excerpt(relic.body, title ? 110 : 165) : "";
  return (
    <View ref={ref} collapsable={false} style={{ width, height, backgroundColor: color.shaft, overflow: "hidden" }}>
      <Image source={art.share.stone} contentFit="cover" transition={0} accessible={false} style={StyleSheet.absoluteFill} />
      <View style={[styles.frame, frame, { padding: 6 * u, borderWidth: 1.5 * u }]}>
        <Image
          source={photoUrl ? { uri: photoUrl } : art.vessel[relic.vessel]}
          contentFit="cover"
          transition={0}
          onLoad={photoUrl ? onPhotoLoad : undefined}
          onError={photoUrl ? onPhotoError : undefined}
          accessible={false}
          style={styles.fill}
        />
      </View>
      <View style={{ position: "absolute", left: 28 * u, right: 28 * u, top: frame.top + frame.height + 20 * u, gap: 6 * u }}>
        <Text variant="catalog" allowFontScaling={false} numberOfLines={1} style={{ fontSize: 11 * u, lineHeight: 16 * u, letterSpacing: 1.6 * u, color: color.ash, textTransform: "uppercase" }}>
          {meta}
        </Text>
        {title ? (
          <Text variant="heading" allowFontScaling={false} numberOfLines={1} style={{ fontSize: 23 * u, lineHeight: 29 * u }}>
            {title}
          </Text>
        ) : null}
        {text ? (
          <Text variant="body" allowFontScaling={false} numberOfLines={title ? 2 : 3} style={{ fontFamily: font.bodyItalic, fontSize: 15 * u, lineHeight: 21 * u, color: color.paper, opacity: 0.92 }}>
            {text}
          </Text>
        ) : null}
      </View>
      <View style={{ position: "absolute", left: 28 * u, right: 28 * u, bottom: 22 * u, paddingTop: 12 * u, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.ironHigh }}>
        <Footer u={u} n={number} ink={color.lamp} muted={color.ash} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  frame: { position: "absolute", borderColor: color.lampDeep, backgroundColor: color.stone },
  sheet: { position: "absolute" },
  footer: { flexDirection: "row", alignItems: "center" },
  spacer: { flex: 1 },
});
