import type { UseQueryResult } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, TextInput, View } from "react-native";
import { art, duckStage } from "@/design/art";
import { duration } from "@/design/motion";
import { color, font, minTarget, moodLight, radius, space, type as typography } from "@/design/tokens";
import type { Profile } from "@/features/account/profile";
import { useRelics } from "@/features/relics/api";
import { useAuth } from "@/lib/auth";
import { Glow } from "@/ui/Glow";
import { Icon } from "@/ui/Icon";
import { Pressable } from "@/ui/Pressable";
import { Text } from "@/ui/Text";
import { toast } from "@/ui/Toast";
import { useRenameKeeper } from "./api";
import { useQ } from "./strings";
import { Bone, Divider, Panel, RetryNote } from "./ui";

const NICHE_W = 108;
const NICHE_H = 144;
const NAME_MAX = 60;

// profiles.created_at comes back with select("*") but the shared Profile type omits it.
type KeeperProfile = Profile & { created_at?: string };

function relicsUntilNextStage(count: number): number | null {
  const stage = duckStage(count);
  if (stage === "worn") return null;
  let n = count;
  while (duckStage(n) === stage) n += 1;
  return n - count;
}

export function KeeperCard({ query }: { query: UseQueryResult<Profile> }) {
  const { t, count } = useQ();
  const user = useAuth((s) => s.user);
  const relics = useRelics();
  const rename = useRenameKeeper();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const profile = query.data as KeeperProfile | undefined;
  const relicCount = relics.data?.length ?? 0;
  const stage = duckStage(relicCount);
  const untilNext = relics.data ? relicsUntilNextStage(relicCount) : null;
  const name = profile?.display_name?.trim() || user?.name || t("keeper.fallbackName");
  const stageName = t(`keeper.stage.${stage}.name`);

  const created = profile?.created_at ? new Date(profile.created_at) : null;
  const since = created && !Number.isNaN(created.getTime()) ? created : null;
  const months = t("months", { returnObjects: true }) as unknown as string[];

  const startEdit = () => {
    rename.reset();
    setDraft(profile?.display_name ?? "");
    setEditing(true);
  };
  const submit = () => {
    if (!user) return;
    const next = draft.trim() || null;
    if (next === (profile?.display_name ?? null)) return setEditing(false);
    rename.mutate(
      { userId: user.id, name: next },
      {
        onSuccess: () => {
          setEditing(false);
          toast({ message: t("keeper.nameKept") });
        },
      },
    );
  };

  if (query.isError && !profile) {
    return (
      <Panel>
        <RetryNote message={t("keeper.loadFailed")} retryLabel={t("retry")} onRetry={() => query.refetch()} />
      </Panel>
    );
  }

  return (
    <Panel>
      <Glow size={260} tint={moodLight.honey} intensity={0.3} style={styles.glow} />
      <Text variant="label" accessibilityRole="header">
        {t("keeper.label")}
      </Text>

      {!profile ? (
        <Bone width="60%" height={space.lg} />
      ) : editing ? (
        <View>
          <View style={styles.editRow}>
            <TextInput
              autoFocus
              value={draft}
              onChangeText={(v) => {
                setDraft(v);
                if (rename.isError) rename.reset();
              }}
              onSubmitEditing={submit}
              maxLength={NAME_MAX}
              returnKeyType="done"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              accessibilityLabel={t("keeper.nameLabel")}
              placeholder={t("keeper.namePlaceholder")}
              placeholderTextColor={color.ash}
              selectionColor={color.lamp}
              cursorColor={color.lamp}
              style={styles.input}
            />
            <Pressable accessibilityLabel={t("keeper.saveName")} disabled={rename.isPending} onPress={submit} style={styles.iconButton}>
              {rename.isPending ? <ActivityIndicator color={color.lamp} /> : <Icon name="check" color={color.lamp} />}
            </Pressable>
            <Pressable accessibilityLabel={t("keeper.cancelName")} disabled={rename.isPending} onPress={() => setEditing(false)} style={styles.iconButton}>
              <Icon name="close" color={color.ash} />
            </Pressable>
          </View>
          {rename.isError ? (
            <Text variant="bodySmall" accessibilityLiveRegion="polite" style={styles.error}>
              {t("keeper.nameFailed")}
            </Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.nameRow}>
          <Text variant="title" numberOfLines={2} style={styles.name}>
            {name}
          </Text>
          <Pressable accessibilityLabel={t("keeper.editName")} onPress={startEdit} style={styles.iconButton}>
            <Icon name="edit" color={color.ash} />
          </Pressable>
        </View>
      )}

      <View style={styles.identity}>
        <View style={styles.niche}>
          <Image
            source={art.duck[stage]}
            contentFit="cover"
            transition={duration.medium}
            accessible
            accessibilityLabel={t("keeper.duckAlt", { stage: stageName.toLowerCase() })}
            style={styles.duck}
          />
        </View>
        <View style={styles.facts}>
          {user?.email ? (
            <Text variant="catalog" selectable>
              {user.email}
            </Text>
          ) : null}
          {since ? (
            <Text variant="catalog">{t("keeper.since", { month: months[since.getMonth()].toUpperCase(), year: since.getFullYear() })}</Text>
          ) : null}
          {relics.data ? <Text variant="catalog">{count("keeper.relicsKept", relicCount)}</Text> : null}
        </View>
      </View>

      <Divider />
      <View style={styles.stage}>
        <Text variant="label">{t("keeper.stageLabel", { stage: stageName.toUpperCase() })}</Text>
        <Text variant="bodySmall">{t(`keeper.stage.${stage}.line`)}</Text>
        {untilNext !== null ? <Text variant="catalog">{count("keeper.toNext", untilNext)}</Text> : null}
      </View>
    </Panel>
  );
}

const styles = StyleSheet.create({
  glow: { position: "absolute", left: -space.xl, top: space.xxl },
  nameRow: { flexDirection: "row", alignItems: "center", gap: space.xs },
  name: { flex: 1 },
  editRow: { flexDirection: "row", alignItems: "center", gap: space.xxs },
  input: {
    flex: 1,
    minHeight: minTarget,
    paddingHorizontal: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.ironHigh,
    backgroundColor: color.shaft,
    color: color.paper,
    fontFamily: font.body,
    fontSize: typography.body.fontSize,
  },
  iconButton: { width: minTarget, height: minTarget, alignItems: "center", justifyContent: "center" },
  error: { color: color.danger, marginTop: space.xs },
  identity: { flexDirection: "row", gap: space.md, alignItems: "flex-end" },
  niche: {
    width: NICHE_W,
    height: NICHE_H,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.ironHigh,
    overflow: "hidden",
    backgroundColor: color.shaft,
  },
  duck: { width: NICHE_W, height: NICHE_H },
  facts: { flex: 1, gap: space.xs, paddingBottom: space.xxs },
  stage: { gap: space.xs },
});
