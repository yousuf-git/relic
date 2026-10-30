// The day, opened from the Ledger: its relics as small vessels, or a way to
// preserve one for that day.
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { Pressable as RNPressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { art } from "@/design/art";
import { duration, ease } from "@/design/motion";
import { color, moodLight, radius, space } from "@/design/tokens";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { Pressable } from "@/ui/Pressable";
import { Text } from "@/ui/Text";
import type { DayEntry, DayItem } from "./calendar-source";
import { formatDay } from "@/features/vault/format";
import { formatLong } from "./text";

const scrimIn = FadeIn.duration(duration.short).easing(ease.enter);
const scrimOut = FadeOut.duration(duration.short).easing(ease.exit);
const sheetIn = SlideInDown.duration(duration.medium).easing(ease.enter);
const sheetOut = SlideOutDown.duration(duration.short).easing(ease.exit);

type Props = {
  date: string;
  today: string;
  entry: DayEntry | undefined;
  onClose: () => void;
  onOpenRelic: (id: string) => void;
  onPreserve: (date: string) => void;
};

export function DaySheet({ date, today, entry, onClose, onOpenRelic, onPreserve }: Props) {
  const { t } = useTranslation("ledger");
  const items = entry?.items ?? [];
  const future = date > today;
  const emptyKey = future ? "sheet.emptyFuture" : date === today ? "sheet.emptyToday" : "sheet.empty";

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View entering={scrimIn} exiting={scrimOut} style={[StyleSheet.absoluteFill, styles.scrim]}>
        <RNPressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel={t("sheet.close")} />
      </Animated.View>
      <Animated.View entering={sheetIn} exiting={sheetOut} style={styles.sheet} accessibilityViewIsModal>
        <View style={styles.handle} />
        <Text variant="label">{`${formatLong(date, { weekday: "short" })} · ${formatDay(date)}`}</Text>
        <Text variant="heading" style={styles.heading} accessibilityRole="header">
          {items.length > 0 ? t("sheet.kept", { count: items.length }) : t(emptyKey)}
        </Text>
        {items.length > 0 ? (
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {items.map((item) => (
              <RelicRow key={item.id} item={item} onOpen={() => onOpenRelic(item.id)} />
            ))}
          </ScrollView>
        ) : null}
        {!future ? (
          <Button
            label={items.length > 0 ? t("sheet.another") : t("sheet.preserve")}
            tone={items.length > 0 ? "ghost" : "lamp"}
            onPress={() => onPreserve(date)}
            style={styles.cta}
          />
        ) : null}
      </Animated.View>
    </View>
  );
}

function RelicRow({ item, onOpen }: { item: DayItem; onOpen: () => void }) {
  const { t } = useTranslation("ledger");
  const title = item.sealed ? t("sheet.sealedTitle") : (item.title ?? item.excerpt ?? t("sheet.untitled"));
  const showExcerpt = !item.sealed && item.title && item.excerpt;
  return (
    <Pressable onPress={onOpen} accessibilityLabel={t("sheet.open", { title })} accessibilityHint={t("sheet.openHint")} style={styles.row}>
      <View style={[styles.thumb, { borderColor: moodLight[item.mood] }]}>
        <Image source={art.vessel[item.vessel]} contentFit="cover" style={[styles.thumbImage, item.sealed && styles.sealedImage]} />
        {item.sealed ? (
          <View style={styles.lock}>
            <Icon name="lock" size={22} color={color.paper} />
          </View>
        ) : null}
      </View>
      <View style={styles.rowText}>
        <Text variant="body" numberOfLines={1}>
          {title}
        </Text>
        {showExcerpt ? (
          <Text variant="bodySmall" numberOfLines={2}>
            {item.excerpt}
          </Text>
        ) : null}
        {item.sealed && item.sealedUntil ? (
          <Text variant="catalog">{t("sheet.sealedUntil", { date: formatDay(item.sealedUntil) })}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrim: { backgroundColor: color.scrim },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "74%",
    backgroundColor: color.stone,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: color.iron,
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    paddingBottom: space.md,
  },
  handle: { alignSelf: "center", width: 36, height: 4, borderRadius: radius.pill, backgroundColor: color.ironHigh, marginBottom: space.md },
  heading: { marginTop: space.xxs },
  list: { flexGrow: 0, marginTop: space.sm },
  listContent: { gap: space.xs },
  cta: { marginTop: space.md },
  row: { flexDirection: "row", alignItems: "center", gap: space.sm, minHeight: 72, paddingVertical: space.xs },
  thumb: { width: 56, height: 56, borderRadius: radius.md, borderWidth: 1, overflow: "hidden", backgroundColor: color.shaft },
  thumbImage: { width: "100%", height: "100%" },
  sealedImage: { opacity: 0.3 },
  lock: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
  rowText: { flex: 1, gap: space.xxs },
});
