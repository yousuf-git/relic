// The Preserve ritual (DESIGN.md §2.3): choose what is in your hand, let the relic
// form as you add to it, open quiet drawers one at a time, then hold the seal.
import { skipToken, useQuery } from "@tanstack/react-query";
import { useRouter, usePreventRemove } from "expo-router";
import { useCallback, useEffect, useRef, useState, type ComponentRef } from "react";
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { duckStage } from "@/design/art";
import { haptic } from "@/design/haptics";
import { duration, useReducedMotion } from "@/design/motion";
import { color, space } from "@/design/tokens";
import type { Profile } from "@/features/account/profile";
import { keys, localDate, useMediaUrls, useRelic, useRelics, useUsage, vesselFor } from "@/features/relics/api";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { Pressable } from "@/ui/Pressable";
import { Screen } from "@/ui/Screen";
import { Text } from "@/ui/Text";
import { formatShort } from "./dates";
import {
  DEFAULT_MOOD,
  DEFAULT_WEIGHT,
  appendSpoken,
  draftFromRelic,
  emptyDraft,
  hasSomethingToKeep,
  photoRoom,
  signature,
  usePreserveDraft,
  type PreserveDraft,
} from "./draft";
import { FacetDrawer } from "./FacetDrawer";
import { FacetRail, type FacetSummary } from "./FacetRail";
import type { FacetKey } from "./facets";
import { HandChoice, type Start } from "./HandChoice";
import { LeaveSheet } from "./LeaveSheet";
import { LinkFacet } from "./LinkFacet";
import { MoodLamps } from "./MoodLamps";
import { enterUp } from "./motion";
import { Notice } from "./Notice";
import { PhotoPlates } from "./PhotoPlates";
import { SealButton } from "./SealButton";
import { SealError, applyResume, useSealRelic, type SealProblem } from "./sealFlow";
import { SealFacet } from "./SealFacet";
import { SealingScene, type SealStage } from "./SealingScene";
import { useKeyboardVisible } from "./useKeyboardVisible";
import { VesselPreview, type InlayKey } from "./VesselPreview";
import { VoiceRecorder } from "./VoiceRecorder";
import { WeightSlider } from "./WeightSlider";
import { WhenFacet } from "./WhenFacet";
import { WhereFacet } from "./WhereFacet";
import { WhoFacet } from "./WhoFacet";
import { WordsField } from "./WordsField";
import "./i18n";

type Params = { relicId?: string; prompt?: string; start?: Start; date?: string };
type ProfileWithJoined = Profile & { created_at?: string };

const SUGGESTED: FacetKey[] = ["when", "where", "who", "weight", "light"];
const PRIMARY_INLAY: Record<ReturnType<typeof vesselFor>, InlayKey> = {
  letter: "words",
  plate: "photo",
  shell: "voice",
  map: "place",
  locket: "people",
  reel: "link",
};
const BODY_HEIGHT = { min: 176, max: 280, share: 0.3 };
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function PreserveScreen({ relicId, ...rest }: Params) {
  return relicId ? <EditGate relicId={relicId} {...rest} /> : <Ritual initial={emptyDraft(rest.date)} {...rest} />;
}

function EditGate({ relicId, ...rest }: Params & { relicId: string }) {
  const { t } = useTranslation("preserve");
  const router = useRouter();
  const relic = useRelic(relicId);
  const gone = !relic.data || !!relic.data.deleted_at;

  if (relic.data && !gone) return <Ritual initial={draftFromRelic(relic.data)} {...rest} />;
  return (
    <Screen>
      <Header label={t("header.reopened")} onClose={() => (router.canGoBack() ? router.back() : router.replace("/"))} />
      <View style={styles.center}>
        {relic.isPending ? (
          <>
            <ActivityIndicator color={color.lamp} />
            <Text variant="bodySmall">{t("edit.loading")}</Text>
          </>
        ) : (
          <>
            <Text variant="body" style={styles.centered}>
              {gone && !relic.isError ? t("edit.gone") : t("edit.error")}
            </Text>
            {relic.isError ? <Button tone="ghost" label={t("retry")} onPress={() => void relic.refetch()} /> : null}
          </>
        )}
      </View>
    </Screen>
  );
}

function Header({ label, onClose }: { label: string; onClose: () => void }) {
  const { t } = useTranslation("preserve");
  return (
    <View style={styles.header}>
      <Pressable onPress={onClose} accessibilityLabel={t("header.close")} style={styles.headerButton}>
        <Icon name="close" />
      </Pressable>
      <Text variant="label" accessibilityRole="header">
        {label}
      </Text>
      <View style={styles.headerButton} />
    </View>
  );
}

function Ritual({ initial, prompt, start }: { initial: PreserveDraft } & Params) {
  const { t } = useTranslation("preserve");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const { height: windowHeight } = useWindowDimensions();
  const keyboardVisible = useKeyboardVisible();
  const editing = initial.relicId !== null;

  const [draft, patch] = usePreserveDraft(initial);
  const [baseline] = useState(() => signature(initial));
  const [phase, setPhase] = useState<"hand" | "ritual">(editing || start ? "ritual" : "hand");
  const [focusBody, setFocusBody] = useState(start === "words");
  const [voiceOpen, setVoiceOpen] = useState(start === "voice");
  const [photosOpen, setPhotosOpen] = useState(start === "photo");
  const [chooserOpen, setChooserOpen] = useState(start === "photo");
  const [openFacet, setOpenFacet] = useState<FacetKey | null>(null);
  const [visited, setVisited] = useState<FacetKey[]>([]);
  const [dictating, setDictating] = useState(false);
  const [recording, setRecording] = useState(false);
  const [stage, setStage] = useState<SealStage>("idle");
  const [problem, setProblem] = useState<SealProblem | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const repeatLeave = useRef<(() => void) | null>(null);
  const savedId = useRef<string | null>(null);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const seal = useSealRelic();

  const relics = useRelics();
  const usage = useUsage();
  const refetchUsage = usage.refetch;
  const profile = useQuery({ queryKey: keys.profile, queryFn: skipToken }).data as ProfileWithJoined | undefined;
  const keptIds = draft.kept.flatMap((k) => (k.id ? [k.id] : []));
  const keptUrls = useMediaUrls(keptIds).data ?? {};

  useEffect(() => {
    void refetchUsage();
  }, [refetchUsage]);

  const relicCount = relics.data?.length ?? 0;
  const joinedOn = profile?.created_at ? localDate(new Date(profile.created_at)) : null;
  const placeName = draft.placeName.trim();
  const photoCount = draft.kept.length + draft.plates.length;
  const hasVoice = !!draft.voice || draft.keptVoice;
  const vessel = vesselFor({ photos: photoCount, voice: hasVoice, links: draft.links.length, people: draft.people.length, place: !!placeName });
  const present: Record<InlayKey, boolean> = {
    words: !!draft.body.trim(),
    voice: hasVoice,
    photo: photoCount > 0,
    place: !!placeName,
    people: draft.people.length > 0,
    link: draft.links.length > 0,
  };
  const inlays = (Object.keys(present) as InlayKey[]).filter((k) => present[k] && k !== PRIMARY_INLAY[vessel]);

  const dailyFull =
    !draft.relicId && usage.data?.relics_today_limit != null && usage.data.relics_today >= usage.data.relics_today_limit;
  const newBytes = draft.plates.reduce((sum, p) => sum + (p.photo?.sizeBytes ?? 0), 0);
  const overQuota = usage.data?.bytes_limit != null && usage.data.bytes_used + newBytes > usage.data.bytes_limit;
  const developing = draft.plates.some((p) => !p.photo);
  const dirty = signature(draft) !== baseline;
  const busy = stage !== "idle";

  const disabledHint = !hasSomethingToKeep(draft)
    ? t("seal.needSomething")
    : developing
      ? t("seal.developing")
      : dictating || recording
        ? t("seal.micBusy")
        : overQuota
          ? t("seal.overQuota")
          : dailyFull
            ? t("seal.rests")
            : "";
  const canSeal = disabledHint === "";

  const disablePrevention = usePreventRemove(dirty || busy, ({ repeat }) => {
    if (busy) return;
    repeatLeave.current = repeat;
    setLeaveOpen(true);
  });

  const close = () => (router.canGoBack() ? router.back() : router.replace("/"));

  const letGo = () => {
    setLeaveOpen(false);
    disablePrevention();
    repeatLeave.current?.();
  };

  const choose = (mode: Start) => {
    setPhase("ritual");
    if (mode === "words") setFocusBody(true);
    if (mode === "voice") setVoiceOpen(true);
    if (mode === "photo") {
      setPhotosOpen(true);
      setChooserOpen(true);
    }
  };

  const openDrawer = (key: FacetKey) => {
    Keyboard.dismiss();
    setOpenFacet((current) => (current === key ? null : key));
    setVisited((list) => (list.includes(key) ? list : [...list, key]));
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: !reduced }), duration.instant);
  };

  const onSpoken = useCallback((text: string) => patch((d) => ({ body: appendSpoken(d.body, text) })), [patch]);

  const sealIt = async () => {
    if (busy) return;
    setProblem(null);
    setOpenFacet(null);
    Keyboard.dismiss();
    haptic.sealed();
    setStage("dispense");
    try {
      savedId.current = await seal(draft);
      await sleep(duration.long);
      setStage("land");
    } catch (error) {
      const failure = error instanceof SealError ? error : new SealError("unknown", null);
      if (failure.resume) {
        const resume = failure.resume;
        patch((d) => applyResume(d, resume));
      }
      setStage("rewind");
      await sleep(duration.medium);
      setStage("idle");
      setProblem(failure.problem);
      haptic.warn();
    }
  };

  const landed = useCallback(() => {
    disablePrevention();
    if (editing && router.canGoBack()) router.back();
    else if (savedId.current) router.replace({ pathname: "/relic/[id]", params: { id: savedId.current } });
    else router.replace("/");
  }, [disablePrevention, editing, router]);

  const summaries: Record<FacetKey, FacetSummary> = {
    when: {
      text: draft.occurredOn === localDate() ? t("summary.today") : formatShort(draft.occurredOn),
      set: draft.occurredOn !== localDate(),
    },
    where: { text: placeName, set: !!placeName },
    who: { text: draft.people.join(", "), set: draft.people.length > 0 },
    weight: { text: t(`weight.step.${draft.weight}`), set: draft.weight !== DEFAULT_WEIGHT },
    light: { text: t(`mood.${draft.mood}`), set: draft.mood !== DEFAULT_MOOD },
    link: { text: draft.links.length ? t("summary.links", { count: draft.links.length }) : "", set: draft.links.length > 0 },
    seal: { text: draft.sealedUntil ? formatShort(draft.sealedUntil) : "", set: !!draft.sealedUntil },
  };
  const suggested = SUGGESTED.find((k) => !summaries[k].set && !visited.includes(k)) ?? null;

  const carrying = draft.plates.length + (draft.voice ? 1 : 0);
  const status = stage === "land" ? t("seal.kept") : carrying > 0 ? t("seal.carrying", { count: carrying }) : t("seal.sealing");
  const label = editing ? t("header.reopened") : t("catalog.relicNo", { ns: "common", n: String(relicCount + 1).padStart(4, "0") });
  const bodyHeight = Math.round(Math.min(BODY_HEIGHT.max, Math.max(BODY_HEIGHT.min, windowHeight * BODY_HEIGHT.share)));
  const showVoice = voiceOpen || !!draft.voice || draft.keptVoice;
  const showPhotos = photosOpen || photoCount > 0;
  const entry = (i: number) => enterUp(reduced, i);

  return (
    <Screen edges={["top"]}>
      <Header label={label} onClose={close} />
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        {phase === "hand" ? (
          dailyFull ? (
            <View style={styles.center}>
              <Notice>{t("problem.daily_limit")}</Notice>
            </View>
          ) : (
            <HandChoice prompt={prompt} onChoose={choose} />
          )
        ) : (
          <>
            <ScrollView
              ref={scrollRef}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
            >
              <VesselPreview vessel={vessel} mood={draft.mood} weight={draft.weight} inlays={inlays} compact={keyboardVisible} />
              {problem ? <Notice>{t(`problem.${problem}`)}</Notice> : null}
              {dailyFull ? <Notice>{t("problem.daily_limit")}</Notice> : null}
              {overQuota ? <Notice>{t("problem.quota")}</Notice> : null}
              <Animated.View entering={entry(0)}>
                <WordsField
                  title={draft.title}
                  body={draft.body}
                  placeholder={prompt || t("letter.bodyPlaceholder")}
                  dateLabel={formatShort(draft.occurredOn)}
                  before={!!joinedOn && draft.occurredOn < joinedOn}
                  bodyHeight={bodyHeight}
                  focusOnMount={focusBody}
                  micBlocked={recording}
                  onTitle={(title) => patch({ title })}
                  onBody={(body) => patch({ body })}
                  onSpoken={onSpoken}
                  onListeningChange={setDictating}
                />
              </Animated.View>
              {showVoice ? (
                <VoiceRecorder
                  take={draft.voice}
                  keptVoice={draft.keptVoice}
                  blocked={dictating}
                  onTake={(voice) => patch({ voice })}
                  onRemove={() => patch({ voice: null })}
                  onRecordingChange={setRecording}
                />
              ) : null}
              {showPhotos ? (
                <PhotoPlates
                  plates={draft.plates}
                  kept={draft.kept}
                  keptUrls={keptUrls}
                  room={photoRoom(draft)}
                  chooserOpen={chooserOpen}
                  onChooser={setChooserOpen}
                  onPlates={(update) => patch((d) => ({ plates: update(d.plates) }))}
                />
              ) : null}
              {!showVoice || !showPhotos ? (
                <View style={styles.adders}>
                  {!showPhotos ? (
                    <Button
                      tone="ghost"
                      label={t("add.photo")}
                      icon={<Icon name="photo" size={20} />}
                      onPress={() => {
                        setPhotosOpen(true);
                        setChooserOpen(true);
                      }}
                      style={styles.flex}
                    />
                  ) : null}
                  {!showVoice ? (
                    <Button tone="ghost" label={t("add.voice")} icon={<Icon name="mic" size={20} />} onPress={() => setVoiceOpen(true)} style={styles.flex} />
                  ) : null}
                </View>
              ) : null}
              <FacetRail summaries={summaries} open={openFacet} suggested={suggested} onOpen={openDrawer} />
              {openFacet ? (
                <FacetDrawer
                  key={openFacet}
                  title={t(`drawer.${openFacet}.title`)}
                  hint={t(`drawer.${openFacet}.hint`)}
                  onClose={() => setOpenFacet(null)}
                >
                  {openFacet === "when" ? (
                    <WhenFacet value={draft.occurredOn} joinedOn={joinedOn} onChange={(occurredOn) => patch({ occurredOn })} />
                  ) : null}
                  {openFacet === "where" ? (
                    <WhereFacet
                      place={{ placeName: draft.placeName, lat: draft.placeLat, lng: draft.placeLng }}
                      onChange={(place) => patch({ placeName: place.placeName, placeLat: place.lat, placeLng: place.lng })}
                    />
                  ) : null}
                  {openFacet === "who" ? <WhoFacet people={draft.people} onChange={(people) => patch({ people })} /> : null}
                  {openFacet === "weight" ? <WeightSlider value={draft.weight} onChange={(weight) => patch({ weight })} /> : null}
                  {openFacet === "light" ? <MoodLamps value={draft.mood} onChange={(mood) => patch({ mood })} /> : null}
                  {openFacet === "link" ? <LinkFacet links={draft.links} onChange={(links) => patch({ links })} /> : null}
                  {openFacet === "seal" ? <SealFacet value={draft.sealedUntil} onChange={(sealedUntil) => patch({ sealedUntil })} /> : null}
                </FacetDrawer>
              ) : null}
            </ScrollView>
            {keyboardVisible ? null : (
              <View style={[styles.footer, { paddingBottom: insets.bottom + space.sm }]}>
                <SealButton disabled={!canSeal} disabledHint={disabledHint} busy={busy} onComplete={() => void sealIt()} />
              </View>
            )}
          </>
        )}
      </KeyboardAvoidingView>
      <LeaveSheet visible={leaveOpen} onKeep={() => setLeaveOpen(false)} onLetGo={letGo} />
      <SealingScene stage={stage} vessel={vessel} mood={draft.mood} duck={duckStage(relicCount)} status={status} onLanded={landed} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: space.xs, minHeight: 56 },
  headerButton: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: space.md, padding: space.lg },
  centered: { textAlign: "center" },
  content: { padding: space.md, gap: space.md, paddingBottom: space.xl },
  adders: { flexDirection: "row", gap: space.sm },
  footer: { alignItems: "center", paddingTop: space.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.iron },
});
