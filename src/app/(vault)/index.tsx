// The Vault: a shaft you scroll down through time, one level per month.
import { useRouter, useLocalSearchParams } from "expo-router";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
  type ListRenderItemInfo,
} from "react-native";
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useReducedMotion } from "@/design/motion";
import { color, minTarget, moods, radius, space, vessels, type Mood, type Vessel } from "@/design/tokens";
import { localDate, useRelics, useUsage, type Relic } from "@/features/relics/api";
import { DepthGauge } from "@/features/vault/DepthGauge";
import { FilterDrawer } from "@/features/vault/FilterDrawer";
import { applyFilters, facetsOf, isFiltering, NO_FILTERS, searchIndex, type Filters } from "@/features/vault/filters";
import { buildLayout, GAUGE_WIDTH, type LevelStop, type Row } from "@/features/vault/layout";
import { LevelDrawer } from "@/features/vault/LevelDrawer";
import { PeekCard } from "@/features/vault/PeekCard";
import { StoneBackdrop } from "@/features/vault/StoneBackdrop";
import { VaultHeader } from "@/features/vault/VaultHeader";
import { LevelMarker, RelicRowView } from "@/features/vault/VaultRows";
import { EmptyVault, ErrorShaft, LoadingShaft, NoMatches } from "@/features/vault/VaultStates";
import { useAuth } from "@/lib/auth";
import { Icon } from "@/ui/Icon";
import { Pressable } from "@/ui/Pressable";
import { Text } from "@/ui/Text";
import "@/features/vault/i18n";

const HEADER_ESTIMATE = 200;
const FOOTER_HEIGHT = 160;
const VIEWABILITY = { itemVisiblePercentThreshold: 20 } as const;

const isMood = (v: unknown): v is Mood => moods.includes(v as Mood);
const isVessel = (v: unknown): v is Vessel => vessels.includes(v as Vessel);
const keyOf = (row: Row) => row.key;

export default function VaultScreen() {
  const { t } = useTranslation("vault");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const relics = useRelics();
  const usage = useUsage();
  const userName = useAuth((s) => s.user?.name);
  const params = useLocalSearchParams<{ person?: string; place?: string; mood?: string; vessel?: string; t?: string }>();

  const listRef = useRef<FlatList<Row>>(null);
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.set(e.contentOffset.y);
  });

  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [siftOpen, setSiftOpen] = useState(false);
  const [levelsOpen, setLevelsOpen] = useState(false);
  const [peek, setPeek] = useState<Relic | null>(null);
  const [headerHeight, setHeaderHeight] = useState(HEADER_ESTIMATE);
  const [viewHeight, setViewHeight] = useState(height);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [pulling, setPulling] = useState(false);

  // Constellation links arrive as params (person, place, mood, vessel); apply them once, then clear them.
  const { person, place, mood, vessel, t: stamp } = params;
  const paramsKey = [person, place, mood, vessel, stamp].join("|");
  const [seenParams, setSeenParams] = useState("");
  if (paramsKey !== seenParams) {
    setSeenParams(paramsKey);
    if (person || place || mood || vessel) {
      setFilters({ ...NO_FILTERS, person: person ?? null, place: place ?? null, mood: isMood(mood) ? mood : null, vessel: isVessel(vessel) ? vessel : null });
    }
  }
  useEffect(() => {
    if (person || place || mood || vessel) router.setParams({ person: undefined, place: undefined, mood: undefined, vessel: undefined, t: undefined });
  }, [person, place, mood, vessel, router]);

  const today = localDate();
  const all = useMemo(() => relics.data ?? [], [relics.data]);
  const index = useMemo(() => searchIndex(all, today), [all, today]);
  const facets = useMemo(() => facetsOf(all), [all]);
  const deferredQ = useDeferredValue(filters.q);
  const shown = useMemo(() => applyFilters(all, { ...filters, q: deferredQ }, index), [all, filters, deferredQ, index]);
  const layout = useMemo(() => buildLayout(shown, today, headerHeight), [shown, today, headerHeight]);

  const changeFilters = useCallback((next: Filters) => {
    setFilters(next);
    setCurrentLevel(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, []);
  const clearFilters = useCallback(() => changeFilters(NO_FILTERS), [changeFilters]);

  const open = useCallback((id: string) => router.push({ pathname: "/relic/[id]", params: { id } }), [router]);
  const onPeek = useCallback((relic: Relic) => setPeek(relic), []);
  const onPeekEnd = useCallback(() => setPeek(null), []);

  const onViewable = useCallback(({ viewableItems }: { viewableItems: { item: Row | null }[] }) => {
    const first = viewableItems.find((v) => v.item);
    if (first?.item) setCurrentLevel(first.item.levelIndex);
  }, []);

  const getItemLayout = useCallback(
    (_: ArrayLike<Row> | null | undefined, i: number) => {
      const row = layout.rows[i];
      return { length: row?.height ?? 0, offset: row?.offset ?? 0, index: i };
    },
    [layout.rows],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Row>) =>
      item.type === "level" ? (
        <LevelMarker row={item} />
      ) : (
        <RelicRowView row={item} width={width} reduced={reduced} onOpen={open} onPeek={onPeek} onPeekEnd={onPeekEnd} />
      ),
    [width, reduced, open, onPeek, onPeekEnd],
  );

  const jumpTo = useCallback(
    (stop: LevelStop) => {
      setLevelsOpen(false);
      listRef.current?.scrollToOffset({ offset: stop.offset, animated: !reduced && Math.abs(stop.offset - scrollY.get()) < viewHeight * 6 });
    },
    [reduced, scrollY, viewHeight],
  );

  const refresh = useCallback(() => {
    setPulling(true);
    Promise.allSettled([relics.refetch(), usage.refetch()]).finally(() => setPulling(false));
  }, [relics, usage]);

  const onHeaderLayout = useCallback((e: LayoutChangeEvent) => {
    const h = Math.round(e.nativeEvent.layout.height);
    setHeaderHeight((prev) => (prev === h ? prev : h));
  }, []);

  const name = userName?.trim().split(/\s+/)[0] || t("greeting.keeper");
  const refreshControl = (
    <RefreshControl refreshing={pulling} onRefresh={refresh} tintColor={color.lamp} colors={[color.lamp]} progressBackgroundColor={color.iron} />
  );
  const header = (count: number | null) => (
    <VaultHeader name={name} relicCount={count} todayCount={usage.data?.relics_today ?? 0} todayLimit={usage.data?.relics_today_limit} refreshing={pulling} />
  );

  // Non-list states share one scrollable surface so pull-to-refresh always works.
  const stateView =
    relics.isPending ? (
      <LoadingShaft />
    ) : relics.isError && !relics.data ? (
      <ErrorShaft error={relics.error} onRetry={() => relics.refetch()} retrying={relics.isRefetching} />
    ) : all.length === 0 ? (
      <EmptyVault onPreserve={() => router.push("/preserve")} />
    ) : null;

  const filtering = isFiltering(filters);
  const current = layout.stops[Math.min(currentLevel, layout.stops.length - 1)];
  const summary = filters.person
    ? t("summary.person", { count: shown.length, name: facets.people.find((p) => p.id === filters.person)?.name ?? t("summary.someone") })
    : filters.place
      ? t("summary.place", { count: shown.length, place: filters.place })
      : filters.q.trim()
        ? t("summary.query", { count: shown.length, q: filters.q.trim() })
        : t("summary.sifted", { count: shown.length });

  return (
    <View style={styles.root} onLayout={(e) => setViewHeight(e.nativeEvent.layout.height)}>
      <StoneBackdrop scrollY={scrollY} width={width} height={viewHeight} reduced={reduced} />

      {stateView ? (
        <ScrollView refreshControl={refreshControl} contentContainerStyle={styles.stateContent} showsVerticalScrollIndicator={false}>
          {header(relics.data ? all.length : null)}
          {stateView}
        </ScrollView>
      ) : (
        <>
          <Animated.FlatList
            ref={listRef}
            data={layout.rows}
            keyExtractor={keyOf}
            renderItem={renderItem}
            getItemLayout={getItemLayout}
            onScroll={onScroll}
            scrollEventThrottle={16}
            onViewableItemsChanged={onViewable}
            viewabilityConfig={VIEWABILITY}
            initialNumToRender={6}
            maxToRenderPerBatch={4}
            windowSize={3}
            removeClippedSubviews
            refreshControl={refreshControl}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View onLayout={onHeaderLayout}>
                {header(all.length)}
                {filtering ? (
                  <View style={styles.banner}>
                    <Text variant="label" style={styles.bannerText} accessibilityLiveRegion="polite">
                      {summary}
                    </Text>
                    <Pressable accessibilityLabel={t("filters.clear")} onPress={clearFilters} style={styles.bannerClear}>
                      <Icon name="close" size={20} />
                    </Pressable>
                  </View>
                ) : null}
              </View>
            }
            ListEmptyComponent={filtering ? <NoMatches onClear={clearFilters} /> : undefined}
            ListFooterComponent={
              layout.rows.length > 0 ? (
                <View style={styles.footer}>
                  <Text variant="bodySmall" style={styles.footerText}>
                    {t("footer.end")}
                  </Text>
                </View>
              ) : undefined
            }
          />
          {layout.rows.length > 0 ? (
            <DepthGauge
              scrollY={scrollY}
              contentHeight={layout.contentEnd + FOOTER_HEIGHT}
              viewHeight={viewHeight}
              top={insets.top + minTarget + space.md * 2}
              bottom={space.md}
              stops={layout.stops}
              current={current}
              onPress={() => setLevelsOpen(true)}
            />
          ) : null}
          <Pressable
            accessibilityLabel={filtering ? t("filters.openActive") : t("filters.open")}
            onPress={() => setSiftOpen(true)}
            style={[styles.sift, { top: insets.top + space.xs }]}
          >
            <Icon name="search" color={filtering ? color.lamp : color.paper} />
            {filtering ? <View style={styles.siftDot} /> : null}
          </Pressable>
        </>
      )}

      {peek ? <PeekCard key={peek.id} relic={peek} today={today} /> : null}

      <FilterDrawer
        open={siftOpen}
        onClose={() => setSiftOpen(false)}
        filters={filters}
        onChange={changeFilters}
        facets={facets}
        matchCount={shown.length}
      />
      <LevelDrawer open={levelsOpen} onClose={() => setLevelsOpen(false)} stops={layout.stops} currentIndex={current?.levelIndex ?? 0} onJump={jumpTo} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.shaft },
  stateContent: { flexGrow: 1, paddingRight: 0 },
  banner: { flexDirection: "row", alignItems: "center", gap: space.xs, marginLeft: space.md, marginRight: GAUGE_WIDTH, marginBottom: space.sm, paddingLeft: space.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: color.ironHigh, backgroundColor: color.stone },
  bannerText: { flex: 1, color: color.paper },
  bannerClear: { width: minTarget, height: minTarget, alignItems: "center", justifyContent: "center" },
  footer: { height: FOOTER_HEIGHT, alignItems: "center", justifyContent: "flex-start", paddingTop: space.xl, paddingRight: GAUGE_WIDTH, paddingLeft: space.lg },
  footerText: { textAlign: "center" },
  sift: {
    position: "absolute",
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
  siftDot: { position: "absolute", top: space.xs, right: space.xs, width: space.xs, height: space.xs, borderRadius: radius.pill, backgroundColor: color.lamp },
});
