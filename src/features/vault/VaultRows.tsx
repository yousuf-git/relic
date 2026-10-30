import { memo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { haptic } from "@/design/haptics";
import { scale, spring } from "@/design/motion";
import { color, space } from "@/design/tokens";
import type { Relic } from "@/features/relics/api";
import { Pressable } from "@/ui/Pressable";
import { Text } from "@/ui/Text";
import { formatDay, relicTitle } from "./format";
import { GAUGE_WIDTH, type LevelRow, type RelicRow } from "./layout";
import { Niche } from "./Niche";
import "./i18n";

export const LevelMarker = memo(function LevelMarker({ row }: { row: LevelRow }) {
  const { t } = useTranslation("vault");
  return (
    <View
      style={[styles.level, { height: row.height, paddingTop: row.extra }]}
      accessible
      accessibilityRole="header"
      accessibilityLabel={t("a11y.level", { level: row.level, month: row.month, count: row.count })}
    >
      <View style={styles.levelLine}>
        <View style={styles.rung} />
        <Text variant="label" style={{ color: color.paper }}>
          {t("level", { n: row.level })}
        </Text>
        <Text variant="label">{row.month}</Text>
        <View style={styles.rule} />
        <Text variant="label">{t("levelCount", { count: row.count })}</Text>
      </View>
    </View>
  );
});

type RowProps = {
  row: RelicRow;
  width: number;
  reduced: boolean;
  onOpen: (id: string) => void;
  onPeek: (relic: Relic) => void;
  onPeekEnd: () => void;
};

export const RelicRowView = memo(function RelicRowView({ row, width, reduced, onOpen, onPeek, onPeekEnd }: RowProps) {
  const { t } = useTranslation("vault");
  const { relic, sealed } = row;
  const lift = useSharedValue(1);
  const liftStyle = useAnimatedStyle(() => ({ transform: [{ scale: lift.get() }] }));

  const date = formatDay(relic.occurred_on);
  const title = sealed ? t("sealed.title") : relicTitle(relic, t);
  const opens = sealed && relic.sealed_until ? formatDay(relic.sealed_until) : null;
  const left = row.side === "left";
  const align = left ? "left" : "right";

  return (
    <View style={{ width, height: row.height, paddingTop: row.top }}>
      <Pressable
        accessibilityLabel={opens ? t("a11y.sealedRelic", { date: opens }) : t("a11y.relic", { title, date, vessel: t(`vessel.${relic.vessel}`) })}
        accessibilityHint={t("a11y.openHint")}
        pressScale={0.98}
        delayLongPress={380}
        onPress={() => onOpen(relic.id)}
        onLongPress={() => {
          haptic.lift(relic.vessel);
          if (!reduced) lift.set(withSpring(scale.lifted, spring.lift));
          onPeek(relic);
        }}
        onPressOut={() => {
          lift.set(withSpring(1, spring.settle));
          onPeekEnd();
        }}
        style={[
          styles.line,
          left ? { flexDirection: "row", paddingLeft: row.inset, paddingRight: GAUGE_WIDTH } : { flexDirection: "row-reverse", paddingRight: GAUGE_WIDTH + row.inset },
        ]}
      >
        <Animated.View style={liftStyle}>
          <Niche
            vessel={relic.vessel}
            mood={relic.mood}
            weight={relic.weight}
            sealed={sealed}
            width={row.nicheWidth}
            height={row.nicheHeight}
            seed={row.seed}
            flicker={!reduced}
          />
        </Animated.View>
        <View style={[styles.label, { maxHeight: row.nicheHeight, [left ? "marginLeft" : "marginRight"]: space.md }]}>
          <Text variant="label" style={{ textAlign: align }}>
            {date}
          </Text>
          <Text variant="heading" numberOfLines={2} style={{ textAlign: align }}>
            {title}
          </Text>
          {opens ? (
            <Text variant="catalog" style={{ textAlign: align }}>
              {t("sealed.opens", { date: opens })}
            </Text>
          ) : relic.place_name ? (
            <Text variant="catalog" numberOfLines={1} style={{ textAlign: align }}>
              {relic.place_name}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  level: { justifyContent: "flex-end", paddingRight: GAUGE_WIDTH, paddingLeft: space.md },
  levelLine: { flexDirection: "row", alignItems: "center", gap: space.xs, paddingBottom: space.sm },
  rung: { width: space.sm, height: 2, backgroundColor: color.lamp },
  rule: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: color.ironHigh },
  line: { alignItems: "flex-start" },
  label: { flex: 1, gap: space.xxs, overflow: "hidden" },
});
