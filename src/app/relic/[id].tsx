// A single relic: the object you tilt toward the light, then everything it holds.
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn, useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { duration, ease, stagger, useReducedMotion } from "@/design/motion";
import { color, minTarget, radius, space, type, type Vessel } from "@/design/tokens";
import { ActionBar, ACTION_BAR_HEIGHT } from "@/features/relic/ActionBar";
import { CatalogCard, type CatalogRow } from "@/features/relic/CatalogCard";
import { LinkReels, PeopleList, PlaceRow } from "@/features/relic/Connections";
import { mediaIdsOf, mediaOf } from "@/features/relic/media";
import { PhotoPlates } from "@/features/relic/PhotoPlates";
import { HeroLayer, HeroTouch, useTilt } from "@/features/relic/RelicHero";
import { RelicLoading, RelicMissing } from "@/features/relic/RelicStates";
import { SealedPanel } from "@/features/relic/SealedPanel";
import { useConstellation } from "@/features/relic/useConstellation";
import { VoicePlayer } from "@/features/relic/VoicePlayer";
import { formatDay, formatMonth, levelOf } from "@/features/vault/format";
import { isSealed, localDate, useMediaUrls, useRelic, useReleaseRelic } from "@/features/relics/api";
import { Icon } from "@/ui/Icon";
import { Pressable } from "@/ui/Pressable";
import { Text } from "@/ui/Text";
import { toast } from "@/ui/Toast";
import "@/features/relic/i18n";

const HERO_SHARE = 0.56;
// Beyond this, paragraphs appear together instead of writing on one by one.
const INK_LIMIT = 10;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="label">{title}</Text>
      {children}
    </View>
  );
}

export default function RelicScreen() {
  const { t } = useTranslation("relic");
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const query = useRelic(id);
  const release = useReleaseRelic();
  const constellation = useConstellation();

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.set(e.contentOffset.y);
  });
  const voiceProgress = useSharedValue(0);
  const voiceActive = useSharedValue(0);
  const tilt = useTilt(true);

  const relic = query.data;
  const today = localDate();
  const sealed = relic ? isSealed(relic, today) : false;
  const media = useMemo(() => (relic ? mediaOf(relic, today) : { photos: [], voice: null }), [relic, today]);
  const urls = useMediaUrls(useMemo(() => (relic ? mediaIdsOf(relic, today) : []), [relic, today]));

  const goBack = useCallback(() => (router.canGoBack() ? router.back() : router.replace("/")), [router]);

  const openPerson = useCallback(
    (personId: string) => router.navigate({ pathname: "/", params: { person: personId, t: String(Date.now()) } }),
    [router],
  );
  const openPlace = useCallback(
    (name: string) => router.navigate({ pathname: "/", params: { place: name, t: String(Date.now()) } }),
    [router],
  );

  const onRelease = useCallback(() => {
    release.mutateAsync({ id }).catch(() => toast({ message: t("releaseFailed") }));
    toast({
      message: t("released"),
      actionLabel: t("common:actions.undo"),
      onAction: () => release.mutate({ id, undo: true }),
    });
    goBack();
  }, [release, id, t, goBack]);

  const back = (
    <Pressable accessibilityLabel={t("common:actions.back")} onPress={goBack} style={[styles.back, { top: insets.top + space.xs }]}>
      <Icon name="back" />
    </Pressable>
  );

  if (!relic || relic.deleted_at) {
    return (
      <View style={styles.root}>
        {query.isPending ? (
          <RelicLoading />
        ) : (
          <RelicMissing error={query.error} onRetry={() => query.refetch()} onBack={goBack} />
        )}
        {back}
      </View>
    );
  }

  const heroHeight = Math.round(Math.min(height * HERO_SHARE, width * 1.2));
  const vessel: Vessel = relic.vessel;
  const title = relic.title?.trim();
  const paragraphs = (relic.body ?? "").split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const number = constellation.numberOf(relic.id);
  const people = relic.people.map((p) => ({ id: p.person.id, name: p.person.name, count: constellation.personCount(p.person.id) }));
  const voiceUrl = media.voice ? urls.data?.[media.voice.id] : undefined;
  const mediaFailed = urls.isError && !urls.data;
  const day = formatDay(relic.occurred_on);

  const rows: CatalogRow[] = sealed
    ? [
        { label: t("catalog.status"), value: t("catalog.sealedValue") },
        { label: t("catalog.sealedOn"), value: formatDay(localDate(new Date(relic.created_at))) },
        { label: t("catalog.opens"), value: formatDay(relic.sealed_until ?? today) },
      ]
    : [
        { label: t("catalog.date"), value: day },
        { label: t("catalog.depth"), value: `${t("common:catalog.level", { n: levelOf(relic.occurred_on, today) })} · ${formatMonth(relic.occurred_on)}` },
        ...(relic.place_name ? [{ label: t("catalog.place"), value: relic.place_name }] : []),
        ...(people.length ? [{ label: t("catalog.people"), value: people.map((p) => p.name).join(", ") }] : []),
        { label: t("catalog.vessel"), value: t(`vessel.${vessel}`) },
      ];

  return (
    <View style={styles.root}>
      <HeroLayer
        vessel={vessel}
        mood={relic.mood}
        sealed={sealed}
        reduced={reduced}
        width={width}
        height={heroHeight}
        scrollY={scrollY}
        tilt={tilt}
        voiceProgress={voiceProgress}
        voiceActive={voiceActive}
      />
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: ACTION_BAR_HEIGHT + insets.bottom + space.xl }}
      >
        <HeroTouch tilt={tilt} height={heroHeight} vessel={vessel} sealed={sealed} />
        <Animated.View
          entering={FadeIn.delay(reduced ? 0 : duration.medium).duration(reduced ? duration.short : duration.medium).easing(ease.enter)}
          style={styles.sheet}
        >
          <View style={styles.titleBlock}>
            <Text variant="label">{sealed ? t("sealed.until", { date: formatDay(relic.sealed_until ?? today) }) : [day, relic.place_name].filter(Boolean).join("  ·  ")}</Text>
            {!sealed && title ? (
              <Text variant="title" accessibilityRole="header">
                {title}
              </Text>
            ) : null}
            {sealed ? (
              <Text variant="title" accessibilityRole="header">
                {t("sealed.title")}
              </Text>
            ) : null}
          </View>

          {sealed && relic.sealed_until ? <SealedPanel sealedUntil={relic.sealed_until} /> : null}

          {!sealed && paragraphs.length > 0 ? (
            <View style={styles.body}>
              {paragraphs.map((p, i) => (
                <Animated.Text
                  key={i}
                  selectable
                  maxFontSizeMultiplier={1.6}
                  entering={FadeIn.delay(reduced || i >= INK_LIMIT ? 0 : duration.long + i * stagger * 4).duration(reduced ? duration.short : duration.medium)}
                  style={styles.paragraph}
                >
                  {p}
                </Animated.Text>
              ))}
            </View>
          ) : null}

          {media.photos.length > 0 ? (
            <Section title={t("section.plates")}>
              <PhotoPlates photos={media.photos} urls={urls.data} loading={urls.isPending} failed={mediaFailed} onRetry={() => urls.refetch()} />
            </Section>
          ) : null}

          {media.voice ? (
            <Section title={t("section.voice")}>
              {voiceUrl ? (
                <VoicePlayer
                  url={voiceUrl}
                  durationMs={media.voice.duration_ms ?? 0}
                  mood={relic.mood}
                  seed={relic.id}
                  progress={voiceProgress}
                  active={voiceActive}
                />
              ) : (
                <Text variant="bodySmall" accessibilityLiveRegion="polite">
                  {mediaFailed ? t("voice.urlFailed") : t("voice.preparing")}
                </Text>
              )}
            </Section>
          ) : null}

          {!sealed && people.length > 0 ? (
            <Section title={t("section.people")}>
              <PeopleList people={people} onOpen={openPerson} />
            </Section>
          ) : null}

          {!sealed && relic.place_name ? (
            <Section title={t("section.place")}>
              <PlaceRow name={relic.place_name} count={constellation.placeCount(relic.place_name)} onOpen={() => openPlace(relic.place_name!)} />
            </Section>
          ) : null}

          {!sealed && relic.links.length > 0 ? (
            <Section title={t("section.links")}>
              <LinkReels links={relic.links} />
            </Section>
          ) : null}

          <CatalogCard number={number} rows={rows} />
        </Animated.View>
      </Animated.ScrollView>
      {back}
      <ActionBar
        sealed={sealed}
        onShare={() => router.push({ pathname: "/share/[id]", params: { id: relic.id } })}
        onReopen={() => router.push({ pathname: "/preserve", params: { id: relic.id } })}
        onRelease={onRelease}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.shaft },
  back: {
    position: "absolute",
    left: space.md,
    width: minTarget,
    height: minTarget,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: color.scrim,
  },
  sheet: {
    gap: space.lg,
    paddingHorizontal: space.md,
    paddingTop: space.lg,
    paddingBottom: space.lg,
    backgroundColor: color.shaft,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: color.iron,
  },
  titleBlock: { gap: space.xs },
  body: { gap: space.md },
  paragraph: { ...type.body },
  section: { gap: space.sm },
});
