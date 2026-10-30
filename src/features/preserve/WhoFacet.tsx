import { useState } from "react";
import { TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import { haptic } from "@/design/haptics";
import { color, space } from "@/design/tokens";
import { usePeople } from "@/features/relics/api";
import { Icon } from "@/ui/Icon";
import { Pressable } from "@/ui/Pressable";
import { Text } from "@/ui/Text";
import { NAME_MAX } from "./draft";
import { field } from "./fieldStyle";
import "./i18n";

const SUGGESTIONS = 8;

export function WhoFacet({ people, onChange }: { people: string[]; onChange: (names: string[]) => void }) {
  const { t } = useTranslation("preserve");
  const known = usePeople();
  const [query, setQuery] = useState("");
  const q = query.trim();
  const chosen = new Set(people.map((p) => p.toLowerCase()));
  const everyone = known.data ?? [];
  const match = everyone.find((p) => p.name.toLowerCase() === q.toLowerCase());
  const suggestions = everyone
    .filter((p) => !chosen.has(p.name.toLowerCase()) && (!q || p.name.toLowerCase().includes(q.toLowerCase())))
    .slice(0, SUGGESTIONS);
  const canCreate = q.length > 0 && !match && !chosen.has(q.toLowerCase());

  const add = (name: string) => {
    const clean = name.trim().slice(0, NAME_MAX);
    if (!clean || chosen.has(clean.toLowerCase())) return;
    haptic.select();
    onChange([...people, clean]);
    setQuery("");
  };

  return (
    <View style={{ gap: space.sm }}>
      {people.length ? (
        <View style={field.wrap}>
          {people.map((name) => (
            <Pressable
              key={name}
              onPress={() => onChange(people.filter((p) => p !== name))}
              accessibilityLabel={t("who.remove", { name })}
              style={[field.chip, field.chipOn]}
            >
              <Text variant="bodySmall" style={{ color: color.paper }}>
                {name}
              </Text>
              <Icon name="close" size={16} color={color.ash} />
            </Pressable>
          ))}
        </View>
      ) : null}
      <TextInput
        style={field.input}
        value={query}
        onChangeText={(v) => setQuery(v.slice(0, NAME_MAX))}
        onSubmitEditing={() => add(match?.name ?? q)}
        placeholder={t("who.placeholder")}
        placeholderTextColor={color.ash}
        selectionColor={color.lamp}
        cursorColor={color.lamp}
        autoCapitalize="words"
        returnKeyType="done"
        blurOnSubmit={false}
        accessibilityLabel={t("who.label")}
      />
      <View style={field.wrap}>
        {canCreate ? (
          <Pressable onPress={() => add(q)} accessibilityLabel={t("who.add", { name: q })} style={[field.chip, field.chipOn]}>
            <Icon name="plus" size={16} color={color.lamp} />
            <Text variant="bodySmall" style={{ color: color.paper }}>
              {t("who.add", { name: q })}
            </Text>
          </Pressable>
        ) : null}
        {suggestions.map((p) => (
          <Pressable key={p.id} onPress={() => add(p.name)} accessibilityLabel={t("who.pick", { name: p.name })} style={field.chip}>
            <Text variant="bodySmall" style={{ color: color.paper }}>
              {p.name}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text variant="bodySmall">{known.isPending ? t("who.loading") : people.length || suggestions.length || canCreate ? t("who.private") : t("who.empty")}</Text>
    </View>
  );
}
