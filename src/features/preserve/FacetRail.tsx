// The drawer handles: one quiet chip per facet. Opening one closes the last, so the
// ritual never grows into a form. The suggested next facet carries a lamp outline.
import { ScrollView, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { color, minTarget, radius, space } from "@/design/tokens";
import { Icon } from "@/ui/Icon";
import { Pressable } from "@/ui/Pressable";
import { Text } from "@/ui/Text";
import { facetIcon, facetKeys, type FacetKey } from "./facets";
import "./i18n";

export type FacetSummary = { text: string; set: boolean };

export function FacetRail({
  summaries,
  open,
  suggested,
  onOpen,
}: {
  summaries: Record<FacetKey, FacetSummary>;
  open: FacetKey | null;
  suggested: FacetKey | null;
  onOpen: (key: FacetKey) => void;
}) {
  const { t } = useTranslation("preserve");
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.rail}
      accessibilityRole="tablist"
    >
      {facetKeys.map((key) => {
        const { text, set } = summaries[key];
        const isOpen = open === key;
        const label = t(`facet.${key}`);
        return (
          <Pressable
            key={key}
            onPress={() => onOpen(key)}
            accessibilityRole="tab"
            accessibilityLabel={text ? `${label}, ${text}` : label}
            accessibilityState={{ selected: isOpen }}
            style={[styles.chip, isOpen && styles.chipOpen, !isOpen && suggested === key && styles.chipSuggested]}
          >
            <Icon name={facetIcon[key]} size={22} color={isOpen || set ? color.lamp : color.ash} />
            <View style={styles.text}>
              <Text variant="label" style={{ color: isOpen ? color.paper : color.ash }}>
                {label}
              </Text>
              {text ? (
                <Text variant="bodySmall" numberOfLines={1} style={styles.summary}>
                  {text}
                </Text>
              ) : null}
            </View>
            {set ? <View style={styles.dot} /> : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  rail: { gap: space.xs, paddingVertical: space.xxs },
  chip: {
    minHeight: minTarget + 8,
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
    paddingHorizontal: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.iron,
    backgroundColor: color.stone,
  },
  chipOpen: { borderColor: color.lamp, backgroundColor: color.iron },
  chipSuggested: { borderColor: color.lampDeep },
  text: { maxWidth: 132 },
  summary: { color: color.paper },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: color.lamp },
});
