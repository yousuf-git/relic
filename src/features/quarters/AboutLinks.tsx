import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import { StyleSheet, View } from "react-native";
import { color, font, space } from "@/design/tokens";
import { Icon } from "@/ui/Icon";
import { Text } from "@/ui/Text";
import { toast } from "@/ui/Toast";
import { pages } from "./constants";
import { useQ } from "./strings";
import { Divider, LinkRow, Panel, PanelHead } from "./ui";

export function AboutLinks() {
  const { t } = useQ();
  const open = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url, { toolbarColor: color.shaft, enableBarCollapsing: true, showTitle: true });
    } catch {
      toast({ message: t("links.failed") });
    }
  };
  return (
    <Panel>
      <PanelHead label={t("links.label")} />
      <LinkRow label={t("links.privacy")} hint={t("links.opens")} onPress={() => open(pages.privacy)} />
      <Divider />
      <LinkRow label={t("links.terms")} hint={t("links.opens")} onPress={() => open(pages.terms)} />
      <Divider />
      <LinkRow label={t("links.deletePage")} hint={t("links.opens")} onPress={() => open(pages.deleteAccount)} />
    </Panel>
  );
}

export function Footer() {
  const { t } = useQ();
  const version = Constants.expoConfig?.version ?? "dev";
  const build = Constants.expoConfig?.android?.versionCode;
  return (
    <View style={styles.footer}>
      <Icon name="nut" color={color.faint} />
      <Text variant="catalog">{t("footer.version", { version: build ? `${version} (${build})` : version })}</Text>
      <Text variant="bodySmall" style={styles.care}>
        {t("footer.care")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { alignItems: "center", gap: space.xs, paddingVertical: space.lg },
  care: { fontFamily: font.bodyItalic },
});
