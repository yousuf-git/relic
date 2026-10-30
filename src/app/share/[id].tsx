// Share card: a 4:5 plate or letter, rendered locally and handed to the system
// share sheet as a PNG. Nothing is uploaded.
import * as Sharing from "expo-sharing";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState, type ComponentRef } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { captureRef } from "react-native-view-shot";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { color, minTarget, radius, space } from "@/design/tokens";
import { mediaIdsOf, mediaOf } from "@/features/relic/media";
import { RelicLoading, RelicMissing } from "@/features/relic/RelicStates";
import { useConstellation } from "@/features/relic/useConstellation";
import { isSealed, localDate, useMediaUrls, useRelic } from "@/features/relics/api";
import { ShareCard, type CardStyle } from "@/features/share/ShareCard";
import { formatDay } from "@/features/vault/format";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { Pressable } from "@/ui/Pressable";
import { Text } from "@/ui/Text";
import { toast } from "@/ui/Toast";
import "@/features/share/i18n";

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; disabled?: boolean }[];
  onChange: (next: T) => void;
}) {
  return (
    <View style={styles.segmented} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityLabel={o.label}
            accessibilityState={{ checked: on, disabled: o.disabled }}
            disabled={o.disabled}
            onPress={() => onChange(o.value)}
            style={[styles.option, on && styles.optionOn]}
          >
            <Text variant="button" style={{ color: on ? color.lamp : color.ash }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function ShareScreen() {
  const { t } = useTranslation("share");
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const query = useRelic(id);
  const constellation = useConstellation();
  const cardRef = useRef<ComponentRef<typeof View>>(null);

  const relic = query.data;
  const today = localDate();
  const sealed = relic ? isSealed(relic, today) : false;
  const media = useMemo(() => (relic ? mediaOf(relic, today) : { photos: [], voice: null }), [relic, today]);
  const urls = useMediaUrls(useMemo(() => (relic ? mediaIdsOf(relic, today) : []), [relic, today]));

  const [choice, setChoice] = useState<CardStyle | null>(null);
  const [useArt, setUseArt] = useState(false);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const goBack = useCallback(() => (router.canGoBack() ? router.back() : router.replace("/")), [router]);

  const onShare = useCallback(async () => {
    if (!cardRef.current || busy) return;
    setBusy(true);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        toast({ message: t("errors.unavailable") });
        return;
      }
      const uri = await captureRef(cardRef, { format: "png", quality: 1, result: "tmpfile" });
      await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: t("dialogTitle") });
    } catch {
      toast({ message: t("errors.capture") });
    } finally {
      setBusy(false);
    }
  }, [busy, t]);

  const closeButton = (
    <Pressable accessibilityLabel={t("close")} onPress={goBack} style={styles.close}>
      <Icon name="close" />
    </Pressable>
  );

  if (!relic) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        {query.isPending ? <RelicLoading /> : <RelicMissing error={query.error} onRetry={() => query.refetch()} onBack={goBack} />}
        {closeButton}
      </View>
    );
  }

  if (sealed) {
    return (
      <View style={[styles.root, styles.sealed, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Icon name="seal" size={40} color={color.lamp} />
        <Text variant="title" style={styles.centered}>
          {t("sealed.title")}
        </Text>
        <Text variant="body" style={[styles.centered, { color: color.ash }]}>
          {t("sealed.body", { date: formatDay(relic.sealed_until ?? today) })}
        </Text>
        <Button label={t("close")} tone="ghost" onPress={goBack} />
      </View>
    );
  }

  const photo = media.photos[0];
  const photoUrl = photo ? (urls.data?.[photo.id] ?? null) : null;
  const wordsOk = !!(relic.body?.trim() || relic.title?.trim());
  const defaultStyle: CardStyle = wordsOk && !photo ? "letter" : "plate";
  const cardStyle: CardStyle = choice === "letter" && !wordsOk ? "plate" : (choice ?? defaultStyle);
  // The signed URL can fail to arrive or to load; the card then falls back to the relic's art.
  const photoFailed = (!!photoUrl && failedUrl === photoUrl) || (urls.isError && !urls.data);
  const wantsPhoto = cardStyle === "plate" && !!photo && !useArt && !photoFailed;
  const ready = !wantsPhoto || (!!photoUrl && loadedUrl === photoUrl);
  const cardWidth = Math.min(width - space.md * 2, 440);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.lg }]} showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <View style={styles.headCopy}>
            <Text variant="title" accessibilityRole="header">
              {t("title")}
            </Text>
            <Text variant="bodySmall">{t("subtitle")}</Text>
          </View>
        </View>

        <View style={[styles.preview, { width: cardWidth + 2 }]} accessible accessibilityLabel={t("card.a11y")} accessibilityLiveRegion="polite">
          <ShareCard
            ref={cardRef}
            relic={relic}
            cardStyle={cardStyle}
            width={cardWidth}
            number={constellation.numberOf(relic.id)}
            photoUrl={wantsPhoto ? photoUrl : null}
            onPhotoLoad={() => setLoadedUrl(photoUrl)}
            onPhotoError={() => setFailedUrl(photoUrl)}
          />
        </View>

        <View style={styles.controls}>
          <Segmented
            label={t("style.label")}
            value={cardStyle}
            onChange={setChoice}
            options={[
              { value: "plate", label: t("style.plate") },
              { value: "letter", label: t("style.letter"), disabled: !wordsOk },
            ]}
          />
          {!wordsOk ? <Text variant="bodySmall">{t("style.letterNeedsWords")}</Text> : null}
          {cardStyle === "plate" && photo ? (
            <Segmented
              label={t("image.label")}
              value={useArt || photoFailed ? "art" : "photo"}
              onChange={(next) => setUseArt(next === "art")}
              options={[
                { value: "photo", label: t("image.photo") },
                { value: "art", label: t("image.art") },
              ]}
            />
          ) : null}
        </View>

        <Button
          label={busy ? t("actions.sharing") : ready ? t("actions.share") : t("actions.preparing")}
          icon={<Icon name="share" color={color.onLamp} />}
          loading={busy || !ready}
          onPress={onShare}
          style={[styles.shareButton, { width: cardWidth }]}
        />
      </ScrollView>
      {closeButton}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.shaft },
  content: { alignItems: "center", gap: space.lg, paddingTop: minTarget + space.sm },
  head: { width: "100%", paddingHorizontal: space.md },
  headCopy: { gap: space.xxs },
  close: {
    position: "absolute",
    top: space.xs,
    right: space.md,
    width: minTarget,
    height: minTarget,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: color.stone,
    borderWidth: 1,
    borderColor: color.iron,
  },
  preview: { borderWidth: 1, borderColor: color.iron },
  controls: { width: "100%", paddingHorizontal: space.md, gap: space.sm },
  segmented: { flexDirection: "row", borderRadius: radius.pill, borderWidth: 1, borderColor: color.ironHigh, backgroundColor: color.stone, padding: space.xxs },
  option: { flex: 1, minHeight: minTarget, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  optionOn: { backgroundColor: color.iron },
  shareButton: { alignSelf: "center" },
  sealed: { alignItems: "center", justifyContent: "center", gap: space.md, padding: space.lg },
  centered: { textAlign: "center" },
});
