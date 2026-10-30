import { Tabs, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { color, minTarget, space } from "@/design/tokens";
import { useProfile } from "@/features/account/profile";
import { useLockStore } from "@/features/lock/store";
import { useNotificationSync } from "@/features/notifications";
import { useWidgetSync } from "@/widgets/sync";
import { Icon, type IconName } from "@/ui/Icon";
import { Pressable } from "@/ui/Pressable";
import { Text } from "@/ui/Text";

const TABS: { name: string; icon: IconName; label: string }[] = [
  { name: "index", icon: "vault", label: "nav.vault" },
  { name: "ledger", icon: "calendar", label: "nav.ledger" },
  { name: "unearth", icon: "lamp", label: "nav.unearth" },
  { name: "quarters", icon: "gear", label: "nav.quarters" },
];

export default function VaultLayout() {
  useProfile();
  useNotificationSync();
  // With the vault door on, home-screen widgets hide relic titles.
  useWidgetSync(useLockStore((s) => s.enabled));
  return (
    <Tabs screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: color.shaft } }} tabBar={(p) => <TabBar state={p.state} navigateToTab={p.navigateToTab} />}>
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} />
      ))}
    </Tabs>
  );
}

function TabBar({ state, navigateToTab }: { state: { index: number; routes: { name: string; key: string }[] }; navigateToTab: (routeKey: string) => void }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const item = (i: number) => {
    const tab = TABS[i];
    const route = state.routes.find((r) => r.name === tab.name)!;
    const focused = state.routes[state.index]?.name === tab.name;
    return (
      <Pressable
        key={tab.name}
        accessibilityRole="tab"
        accessibilityLabel={t(tab.label)}
        accessibilityState={{ selected: focused }}
        onPress={() => !focused && navigateToTab(route.key)}
        style={styles.tab}
      >
        <Icon name={tab.icon} color={focused ? color.lamp : color.ash} />
        <Text variant="label" style={{ fontSize: 10, color: focused ? color.paper : color.faint }}>
          {t(tab.label)}
        </Text>
      </Pressable>
    );
  };
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.sm) }]}>
      {item(0)}
      {item(1)}
      <Pressable
        accessibilityLabel={t("nav.preserve")}
        onPress={() => router.push("/preserve")}
        pressScale={0.92}
        style={styles.preserve}
      >
        <Icon name="plus" color={color.onLamp} size={28} strokeWidth={2} />
      </Pressable>
      {item(2)}
      {item(3)}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: color.shaft,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.iron,
    paddingTop: space.xs,
  },
  tab: { minWidth: minTarget + 8, minHeight: minTarget + 8, alignItems: "center", justifyContent: "center", gap: 2 },
  preserve: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: color.lamp,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -22,
    borderWidth: 4,
    borderColor: color.shaft,
  },
});
