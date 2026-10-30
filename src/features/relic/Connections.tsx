// People as a locket list, the place, and video links as reel cards.
import * as WebBrowser from "expo-web-browser";
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Linking, StyleSheet, View } from "react-native";
import { font, color, minTarget, radius, space } from "@/design/tokens";
import { Icon } from "@/ui/Icon";
import { Pressable } from "@/ui/Pressable";
import { Text } from "@/ui/Text";
import { toast } from "@/ui/Toast";
import "./i18n";

type Person = { id: string; name: string; count: number };

export const PeopleList = memo(function PeopleList({ people, onOpen }: { people: Person[]; onOpen: (id: string) => void }) {
  const { t } = useTranslation("relic");
  return (
    <View style={styles.list}>
      {people.map((p) => {
        const more = p.count > 1;
        return (
          <Pressable
            key={p.id}
            disabled={!more}
            accessibilityLabel={more ? t("people.open", { name: p.name, count: p.count }) : t("people.only", { name: p.name })}
            onPress={() => onOpen(p.id)}
            style={styles.row}
          >
            <View style={styles.locket}>
              <Text variant="heading" style={styles.initial}>
                {p.name.trim().charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.copy}>
              <Text variant="body" numberOfLines={1}>
                {p.name}
              </Text>
              <Text variant="catalog">{more ? t("people.count", { count: p.count, name: p.name }) : t("people.onlyHere")}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
});

export const PlaceRow = memo(function PlaceRow({ name, count, onOpen }: { name: string; count: number; onOpen: () => void }) {
  const { t } = useTranslation("relic");
  const more = count > 1;
  return (
    <Pressable
      disabled={!more}
      accessibilityLabel={more ? t("place.open", { name, count }) : t("place.only", { name })}
      onPress={onOpen}
      style={styles.row}
    >
      <View style={styles.locket}>
        <Icon name="place" color={color.lamp} />
      </View>
      <View style={styles.copy}>
        <Text variant="body" numberOfLines={1}>
          {name}
        </Text>
        <Text variant="catalog">{more ? t("place.count", { count }) : t("place.onlyHere")}</Text>
      </View>
    </Pressable>
  );
});

const hostOf = (url: string) => url.match(/^https?:\/\/(?:www\.)?([^/?#]+)/i)?.[1] ?? url;

export const LinkReels = memo(function LinkReels({ links }: { links: { id: string; url: string; label: string | null }[] }) {
  const { t } = useTranslation("relic");
  const open = async (url: string) => {
    // Only web links leave the vault; anything else is ignored.
    if (!/^https?:\/\//i.test(url)) return;
    try {
      await Linking.openURL(url);
    } catch {
      try {
        await WebBrowser.openBrowserAsync(url);
      } catch {
        toast({ message: t("links.failed") });
      }
    }
  };
  return (
    <View style={styles.list}>
      {links.map((l) => (
        <Pressable
          key={l.id}
          accessibilityLabel={t("links.open", { name: l.label?.trim() || hostOf(l.url) })}
          accessibilityRole="link"
          onPress={() => open(l.url)}
          style={styles.reel}
        >
          <View style={styles.spool}>
            <Icon name="link" color={color.lamp} />
          </View>
          <View style={styles.copy}>
            <Text variant="body" numberOfLines={1}>
              {l.label?.trim() || hostOf(l.url)}
            </Text>
            <Text variant="catalog" numberOfLines={1}>
              {hostOf(l.url)} {"·"} {t("links.outside")}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  list: { gap: space.xs },
  row: { flexDirection: "row", alignItems: "center", gap: space.md, minHeight: minTarget + space.sm, paddingVertical: space.xs },
  locket: {
    width: minTarget - 4,
    height: minTarget + 4,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: color.lampDeep,
    backgroundColor: color.iron,
    alignItems: "center",
    justifyContent: "center",
  },
  initial: { fontFamily: font.display },
  copy: { flex: 1, gap: 2 },
  reel: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    minHeight: minTarget + space.md,
    padding: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.ironHigh,
    backgroundColor: color.stone,
  },
  spool: { width: minTarget - 4, height: minTarget - 4, borderRadius: radius.pill, borderWidth: 1, borderColor: color.ironHigh, alignItems: "center", justifyContent: "center", backgroundColor: color.shaft },
});
