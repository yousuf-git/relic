import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { color, space } from "@/design/tokens";
import { Icon, type IconName } from "@/ui/Icon";
import { Pressable } from "@/ui/Pressable";
import { Text } from "@/ui/Text";
import type { PersonThread, PlaceThread } from "./constellations";

type Props = {
  people: PersonThread[];
  places: PlaceThread[];
  onPerson: (id: string) => void;
  onPlace: (name: string) => void;
};

export function ConstellationList({ people, places, onPerson, onPlace }: Props) {
  const { t } = useTranslation("unearth");
  const hasThreads = people.length + places.length > 0;
  return (
    <View style={styles.section}>
      <Text variant="label" accessibilityRole="header">
        {t("constellations.title")}
      </Text>
      {hasThreads ? (
        <View>
          {people.map((p) => (
            <Row key={`p-${p.id}`} icon="people" text={t("constellations.person", { count: p.count, name: p.name })} hint={t("constellations.hint")} onPress={() => onPerson(p.id)} />
          ))}
          {places.map((p) => (
            <Row key={`l-${p.name}`} icon="place" text={t("constellations.place", { count: p.count, name: p.name })} hint={t("constellations.hint")} onPress={() => onPlace(p.name)} />
          ))}
        </View>
      ) : (
        <Text variant="bodySmall">{t("constellations.empty")}</Text>
      )}
    </View>
  );
}

function Row({ icon, text, hint, onPress }: { icon: IconName; text: string; hint: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={text} accessibilityHint={hint} style={styles.row}>
      <Icon name={icon} color={color.ash} />
      <Text variant="body" style={styles.rowText} numberOfLines={1}>
        {text}
      </Text>
      <View style={styles.forward}>
        <Icon name="back" color={color.faint} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.xs },
  row: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.iron,
  },
  rowText: { flex: 1 },
  forward: { transform: [{ rotate: "180deg" }] },
});
