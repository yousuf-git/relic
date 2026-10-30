import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { haptic } from "@/design/haptics";
import { duckStage } from "@/design/art";
import { useReducedMotion } from "@/design/motion";
import { color, radius, space } from "@/design/tokens";
import { addNamespace } from "@/i18n";
import unearth from "@/i18n/en/unearth.json";
import { formatDay } from "@/features/vault/format";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { Screen } from "@/ui/Screen";
import { Text } from "@/ui/Text";
import { ConstellationList } from "./ConstellationList";
import { DuckStage } from "./DuckStage";
import { FlameCard } from "./FlameCard";
import { PromptCard } from "./PromptCard";
import { RitualCard } from "./RitualCard";
import { ritual } from "./ritual";
import { dispensedKey, writeDispensedDate } from "./state";
import { UnlockCard } from "./UnlockCard";
import { useUnearth } from "./useUnearth";

addNamespace("unearth", unearth);

const DUCK_HEIGHT = 190;

export function UnearthScreen() {
  const { t } = useTranslation("unearth");
  const u = useUnearth();

  if (u.isError) {
    return (
      <Screen edges={["top"]}>
        <View style={styles.centered}>
          <DuckStage stage="clean" tilted={false} height={DUCK_HEIGHT} />
          <Text variant="heading">{t("states.errorTitle")}</Text>
          <Text variant="bodySmall" style={styles.center}>
            {t("errors.offline", { ns: "common" })}
          </Text>
          <Button label={t("states.retry")} tone="ghost" onPress={() => u.refetch()} />
        </View>
      </Screen>
    );
  }

  if (u.isPending || !u.data) {
    return (
      <Screen edges={["top"]}>
        <View style={styles.centered}>
          <DuckStage stage="clean" tilted={false} height={DUCK_HEIGHT} />
          <Text variant="bodySmall" accessibilityLiveRegion="polite">
            {t("states.loading")}
          </Text>
        </View>
      </Screen>
    );
  }

  return <Ready key={u.today} data={u.data} today={u.today} fresh={u.fresh} refreshing={u.isRefetching} onRefresh={() => u.refetch()} />;
}

type ReadyProps = {
  data: NonNullable<ReturnType<typeof useUnearth>["data"]>;
  today: string;
  fresh: boolean;
  refreshing: boolean;
  onRefresh: () => void;
};

function Ready({ data, today, fresh, refreshing, onRefresh }: ReadyProps) {
  const { t } = useTranslation("unearth");
  const router = useRouter();
  const qc = useQueryClient();
  const reduced = useReducedMotion();
  const { surfaced, unlocking } = data.unearthing;
  const hasRitual = !!surfaced || unlocking.length > 0;

  // Decided once per mount: the ceremony is for the first view of a day, not for every re-render after it is marked seen.
  const [playing] = useState(hasRitual && fresh);
  const animate = playing && !reduced;
  const [tilted, setTilted] = useState(true);

  useEffect(() => {
    if (!playing) return;
    void writeDispensedDate(today);
    qc.setQueryData(dispensedKey, today);
  }, [playing, today, qc]);

  const landingVessel = surfaced?.relic.vessel;
  useEffect(() => {
    if (!animate) return;
    const timers = [
      setTimeout(() => (landingVessel ? haptic.lift(landingVessel) : haptic.sealed()), ritual.landing),
      setTimeout(() => setTilted(false), ritual.tiltBack),
    ];
    return () => timers.forEach(clearTimeout);
  }, [animate, landingVessel]);

  const openRelic = (id: string) => router.push({ pathname: "/relic/[id]", params: { id } });

  return (
    <Screen edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.lamp} colors={[color.lamp]} progressBackgroundColor={color.iron} />}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text variant="label">{`${t("eyebrow")} · ${formatDay(today)}`}</Text>
            <Text variant="title" accessibilityRole="header">
              {t("title")}
            </Text>
          </View>
          {data.flame.current > 0 ? (
            <View style={styles.chip} accessible accessibilityLabel={t("flame.chip", { count: data.flame.current })}>
              <Icon name="flame" size={20} color={color.lamp} />
              <Text variant="catalog" style={{ color: color.paper }}>
                {data.flame.current}
              </Text>
            </View>
          ) : null}
        </View>

        <DuckStage stage={duckStage(data.count)} tilted={(animate && tilted) || refreshing} height={DUCK_HEIGHT} />

        {unlocking.length > 0 ? <UnlockCard relics={unlocking} today={today} onOpen={openRelic} /> : null}

        {surfaced ? (
          <RitualCard surfaced={surfaced} today={today} animate={animate} onOpen={() => openRelic(surfaced.relic.id)} />
        ) : unlocking.length === 0 ? (
          <View style={styles.quiet}>
            <Text variant="heading">{data.count === 0 ? t("states.emptyTitle") : t("states.settlingTitle")}</Text>
            <Text variant="bodySmall">{data.count === 0 ? t("states.emptyBody") : t("states.settlingBody")}</Text>
            {data.count === 0 ? <Button label={t("states.emptyCta")} onPress={() => router.push("/preserve")} /> : null}
          </View>
        ) : null}

        <PromptCard prompt={data.prompt} onAnswer={() => router.push({ pathname: "/preserve", params: { prompt: data.prompt, start: "words" } })} />

        {data.count > 0 ? (
          <ConstellationList
            people={data.threads.people}
            places={data.threads.places}
            onPerson={(person) => router.push({ pathname: "/", params: { person } })}
            onPlace={(place) => router.push({ pathname: "/", params: { place } })}
          />
        ) : null}

        <FlameCard flame={data.flame} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.md, paddingBottom: space.xxl, gap: space.lg },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: space.sm },
  headerText: { flex: 1, gap: space.xxs },
  chip: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: space.xxs,
    paddingHorizontal: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.iron,
    backgroundColor: color.stone,
  },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: space.md, padding: space.lg },
  center: { textAlign: "center" },
  quiet: { gap: space.sm, backgroundColor: color.stone, borderRadius: radius.lg, borderWidth: 1, borderColor: color.iron, padding: space.lg },
});
