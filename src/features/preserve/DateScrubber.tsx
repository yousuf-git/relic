// A ruler of days you drag under a fixed lamp. Index 0 is the anchor day; the
// ruler runs away from it into the past (When) or the future (Seal until). Month
// and year marks carry their names, and each step gives a small tick.
import { Canvas, LinearGradient, Rect, vec } from "@shopify/react-native-skia";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { useTranslation } from "react-i18next";
import { haptic } from "@/design/haptics";
import { useReducedMotion } from "@/design/motion";
import { color, font, space } from "@/design/tokens";
import { Pressable } from "@/ui/Pressable";
import { Text } from "@/ui/Text";
import { addDays, clampDate, dayOfMonth, dayOfWeek, daysBetween, formatLong, formatMonth, formatWeekday, monthOfYear } from "./dates";
import "./i18n";

const DAY_W = 12;
const RULER_H = 76;
const TICK_THROTTLE_MS = 50;

export type DatePreset = { label: string; date: string };

const DayTick = memo(function DayTick({ date }: { date: string }) {
  const first = dayOfMonth(date) === 1;
  const newYear = first && monthOfYear(date) === 1;
  const monday = dayOfWeek(date) === 1;
  const height = newYear ? 44 : first ? 34 : monday ? 20 : 12;
  return (
    <View style={styles.cell}>
      {first ? (
        <Text numberOfLines={1} style={newYear ? styles.year : styles.month}>
          {newYear ? date.slice(0, 4) : formatMonth(date)}
        </Text>
      ) : null}
      <View style={[styles.tick, { height, backgroundColor: first ? color.paper : monday ? color.ash : color.faint }]} />
    </View>
  );
});

export function DateScrubber({
  value,
  onChange,
  anchor,
  direction,
  maxDays,
  presets,
  caption,
  label,
}: {
  value: string;
  onChange: (date: string) => void;
  anchor: string;
  direction: "past" | "future";
  maxDays: number;
  presets: DatePreset[];
  caption?: string;
  label: string;
}) {
  const { t } = useTranslation("preserve");
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const listRef = useRef<FlatList<number>>(null);
  const positioned = useRef(false);
  const lastTick = useRef(0);
  const sign = direction === "past" ? -1 : 1;
  const lo = sign < 0 ? addDays(anchor, -maxDays) : anchor;
  const hi = sign < 0 ? anchor : addDays(anchor, maxDays);

  const indexOf = useCallback((date: string) => Math.min(maxDays, Math.max(0, daysBetween(anchor, date) * sign)), [anchor, sign, maxDays]);
  const dateAt = useCallback((index: number) => addDays(anchor, sign * index), [anchor, sign]);
  const shown = useRef(indexOf(value));

  const pad = Math.max(0, (width - DAY_W) / 2);
  const data = useMemo(() => Array.from({ length: maxDays + 1 }, (_, i) => i), [maxDays]);
  const getItemLayout = useCallback((_: unknown, index: number) => ({ length: DAY_W, offset: pad + index * DAY_W, index }), [pad]);
  const renderItem = useCallback(({ item }: { item: number }) => <DayTick date={dateAt(item)} />, [dateAt]);

  useEffect(() => {
    const index = indexOf(value);
    if (!positioned.current || index === shown.current) return;
    shown.current = index;
    listRef.current?.scrollToOffset({ offset: index * DAY_W, animated: !reduced });
  }, [value, indexOf, reduced]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.min(maxDays, Math.max(0, Math.round(e.nativeEvent.contentOffset.x / DAY_W)));
    if (index === shown.current) return;
    const previous = dateAt(shown.current);
    shown.current = index;
    const date = dateAt(index);
    const now = Date.now();
    if (monthOfYear(previous) !== monthOfYear(date)) haptic.lift("letter");
    else if (now - lastTick.current > TICK_THROTTLE_MS) haptic.select();
    lastTick.current = now;
    onChange(date);
  };

  const nudge = (days: number) => {
    const next = clampDate(addDays(value, days), lo, hi);
    if (next !== value) {
      haptic.select();
      onChange(next);
    }
  };

  return (
    <View style={styles.root}>
      <View accessibilityLiveRegion="polite">
        <Text variant="title">{formatLong(value)}</Text>
        <Text variant="bodySmall">{[formatWeekday(value), caption].filter(Boolean).join(" · ")}</Text>
      </View>
      <View
        style={styles.ruler}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ text: formatLong(value) }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={(e) => nudge(e.nativeEvent.actionName === "increment" ? 1 : -1)}
      >
        {width > 0 ? (
          <FlatList
            ref={listRef}
            horizontal
            inverted={direction === "past"}
            data={data}
            keyExtractor={String}
            renderItem={renderItem}
            getItemLayout={getItemLayout}
            contentContainerStyle={{ paddingHorizontal: pad }}
            showsHorizontalScrollIndicator={false}
            snapToInterval={DAY_W}
            decelerationRate="fast"
            scrollEventThrottle={16}
            onScroll={onScroll}
            onContentSizeChange={() => {
              if (positioned.current) return;
              positioned.current = true;
              if (shown.current > 0) listRef.current?.scrollToOffset({ offset: shown.current * DAY_W, animated: false });
            }}
            initialNumToRender={Math.ceil(width / DAY_W) + 8}
            windowSize={9}
            maxToRenderPerBatch={60}
            nestedScrollEnabled
          />
        ) : null}
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          <Rect x={0} y={0} width={width} height={RULER_H}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(width, 0)}
              colors={[color.stone, `${color.stone}00`, `${color.stone}00`, color.stone]}
              positions={[0, 0.2, 0.8, 1]}
            />
          </Rect>
        </Canvas>
        <View pointerEvents="none" style={[styles.marker, { left: pad + DAY_W / 2 - 1 }]} />
      </View>
      <View style={styles.presets}>
        {presets.map((p) => (
          <Pressable
            key={p.label}
            onPress={() => {
              const next = clampDate(p.date, lo, hi);
              if (next !== value) onChange(next);
            }}
            accessibilityLabel={p.label}
            style={styles.preset}
          >
            <Text variant="label" style={{ color: color.paper }}>
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text variant="catalog" style={styles.hint}>
        {t("date.hint")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.sm },
  ruler: { height: RULER_H, overflow: "hidden" },
  cell: { width: DAY_W, height: RULER_H, alignItems: "center", justifyContent: "flex-end" },
  tick: { width: 2, borderRadius: 1 },
  month: { position: "absolute", top: 0, width: 48, textAlign: "center", fontFamily: font.monoMedium, fontSize: 11, color: color.ash },
  year: { position: "absolute", top: 0, width: 56, textAlign: "center", fontFamily: font.display, fontSize: 16, color: color.lamp },
  marker: { position: "absolute", top: 0, width: 2, height: RULER_H, borderRadius: 1, backgroundColor: color.lamp },
  presets: { flexDirection: "row", flexWrap: "wrap", gap: space.xs },
  preset: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: space.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: color.ironHigh,
    backgroundColor: color.stone,
  },
  hint: { color: color.ash },
});
