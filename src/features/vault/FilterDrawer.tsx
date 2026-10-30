// Sift the vault: text search plus person, place, mood and vessel, in a slim
// drawer rather than a toolbar of chips.
import { memo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, TextInput, View } from "react-native";
import { color, font, minTarget, moods, radius, space, vessels, moodLight, type Mood, type Vessel } from "@/design/tokens";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { Pressable } from "@/ui/Pressable";
import { Text } from "@/ui/Text";
import { Drawer } from "./Drawer";
import { isFiltering, NO_FILTERS, type Facets, type Filters } from "./filters";
import "./i18n";

const FACET_LIMIT = 8;

type Props = {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  onChange: (next: Filters) => void;
  facets: Facets;
  matchCount: number;
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="label">{title}</Text>
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

function Chip({ label, selected, onPress, dot }: { label: string; selected: boolean; onPress: () => void; dot?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipOn]}
    >
      {dot ? <View style={[styles.dot, { backgroundColor: dot }]} /> : null}
      <Text variant="bodySmall" numberOfLines={1} style={{ color: selected ? color.paper : color.ash, flexShrink: 1 }}>
        {label}
      </Text>
    </Pressable>
  );
}

export const FilterDrawer = memo(function FilterDrawer({ open, onClose, filters, onChange, facets, matchCount }: Props) {
  const { t } = useTranslation("vault");
  const [allPeople, setAllPeople] = useState(false);
  const [allPlaces, setAllPlaces] = useState(false);
  const toggle = <K extends keyof Filters>(key: K, value: Filters[K]) => onChange({ ...filters, [key]: filters[key] === value ? NO_FILTERS[key] : value });
  const people = allPeople ? facets.people : facets.people.slice(0, FACET_LIMIT);
  const places = allPlaces ? facets.places : facets.places.slice(0, FACET_LIMIT);

  return (
    <Drawer open={open} onClose={onClose} side="left" closeLabel={t("filters.close")}>
      <View style={styles.head}>
        <Text variant="heading">{t("filters.title")}</Text>
        <Pressable accessibilityLabel={t("filters.close")} onPress={onClose} style={styles.close}>
          <Icon name="close" />
        </Pressable>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.search}>
          <Icon name="search" color={color.ash} size={20} />
          <TextInput
            value={filters.q}
            onChangeText={(q) => onChange({ ...filters, q })}
            placeholder={t("filters.searchPlaceholder")}
            placeholderTextColor={color.ash}
            accessibilityLabel={t("filters.searchLabel")}
            returnKeyType="search"
            autoCorrect={false}
            selectionColor={color.lamp}
            cursorColor={color.lamp}
            style={styles.input}
          />
        </View>

        {facets.people.length > 0 ? (
          <Section title={t("filters.person")}>
            {people.map((p) => (
              <Chip key={p.id} label={`${p.name} · ${p.count}`} selected={filters.person === p.id} onPress={() => toggle("person", p.id)} />
            ))}
            {facets.people.length > FACET_LIMIT ? <Chip label={allPeople ? t("filters.fewer") : t("filters.more")} selected={false} onPress={() => setAllPeople((v) => !v)} /> : null}
          </Section>
        ) : null}

        {facets.places.length > 0 ? (
          <Section title={t("filters.place")}>
            {places.map((p) => (
              <Chip key={p.name} label={`${p.name} · ${p.count}`} selected={filters.place === p.name} onPress={() => toggle("place", p.name)} />
            ))}
            {facets.places.length > FACET_LIMIT ? <Chip label={allPlaces ? t("filters.fewer") : t("filters.more")} selected={false} onPress={() => setAllPlaces((v) => !v)} /> : null}
          </Section>
        ) : null}

        <Section title={t("filters.mood")}>
          {moods.map((m: Mood) => (
            <Chip key={m} label={t(`mood.${m}`)} dot={moodLight[m]} selected={filters.mood === m} onPress={() => toggle("mood", m)} />
          ))}
        </Section>

        <Section title={t("filters.vessel")}>
          {vessels.map((v: Vessel) => (
            <Chip key={v} label={t(`vessel.${v}`)} selected={filters.vessel === v} onPress={() => toggle("vessel", v)} />
          ))}
        </Section>
      </ScrollView>
      <View style={styles.foot}>
        <Button
          label={t("filters.clear")}
          tone="ghost"
          disabled={!isFiltering(filters)}
          onPress={() => onChange(NO_FILTERS)}
          style={styles.footButton}
        />
        <Button label={t("filters.show", { count: matchCount })} onPress={onClose} style={styles.footButton} />
      </View>
    </Drawer>
  );
});

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: space.md, paddingBottom: space.sm },
  close: { width: minTarget, height: minTarget, alignItems: "center", justifyContent: "center" },
  body: { paddingHorizontal: space.md, paddingBottom: space.lg, gap: space.lg },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
    minHeight: minTarget + 4,
    paddingHorizontal: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.ironHigh,
    backgroundColor: color.iron,
  },
  input: { flex: 1, minHeight: minTarget, fontFamily: font.body, fontSize: 18, color: color.paper, padding: 0 },
  section: { gap: space.xs },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.xs },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
    maxWidth: "100%",
    minHeight: minTarget,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.iron,
    backgroundColor: color.shaft,
  },
  chipOn: { borderColor: color.lamp, backgroundColor: color.iron },
  dot: { width: space.xs + 2, height: space.xs + 2, borderRadius: radius.pill },
  foot: { flexDirection: "row", gap: space.xs, paddingHorizontal: space.md, paddingTop: space.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.iron },
  footButton: { flex: 1 },
});
