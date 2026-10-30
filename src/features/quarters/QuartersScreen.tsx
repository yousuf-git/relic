import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { color, space } from "@/design/tokens";
import { useProfile } from "@/features/account/profile";
import { keys } from "@/features/relics/api";
import { signOut } from "@/lib/auth";
import { Button } from "@/ui/Button";
import { Screen } from "@/ui/Screen";
import { Text } from "@/ui/Text";
import { AboutLinks, Footer } from "./AboutLinks";
import { queryKeys } from "./constants";
import { ExportVault } from "./ExportVault";
import { KeeperCard } from "./KeeperCard";
import { LockToggle } from "./LockToggle";
import { ReleaseVault } from "./ReleaseVault";
import { Reminders } from "./Reminders";
import { useQ } from "./strings";
import { VaultCapacity } from "./VaultCapacity";
import { Waitlist } from "./Waitlist";

export default function QuartersScreen() {
  const { t } = useQ();
  const qc = useQueryClient();
  const profile = useProfile();
  const [refreshing, setRefreshing] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    await Promise.allSettled(
      [keys.profile, keys.usage, keys.relics, queryKeys.waitlist].map((queryKey) => qc.invalidateQueries({ queryKey })),
    );
    setRefreshing(false);
  };

  const leave = async () => {
    setLeaving(true);
    await signOut();
    qc.clear();
  };

  return (
    <Screen edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={color.lamp} colors={[color.lamp]} progressBackgroundColor={color.iron} />
        }
      >
        <View style={styles.header}>
          <Text variant="label">{t("header.label")}</Text>
          <Text variant="hero" accessibilityRole="header">
            {t("header.title")}
          </Text>
          <Text variant="bodySmall" style={styles.line}>
            {t("header.line")}
          </Text>
        </View>

        <KeeperCard query={profile} />
        <VaultCapacity />
        <Waitlist />
        <Reminders profile={profile.data} />
        <LockToggle />
        <ExportVault />
        <AboutLinks />
        <Button tone="ghost" label={t("account.signOut")} accessibilityHint={t("account.signOutHint")} loading={leaving} onPress={leave} />
        <ReleaseVault />
        <Footer />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.xl, gap: space.lg },
  header: { gap: space.xxs, paddingBottom: space.xs },
  line: { fontStyle: "italic" },
});
