// Glass plates: photos developing out of the dark. Up to five per relic, counting
// the ones the relic already keeps. Each is shrunk to 1600 px WebP before sealing.
import { Image } from "expo-image";
import {
  launchCameraAsync,
  launchImageLibraryAsync,
  requestCameraPermissionsAsync,
  type ImagePickerResult,
} from "expo-image-picker";
import { useRef, useState } from "react";
import { ActivityIndicator, Linking, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { duration, useReducedMotion } from "@/design/motion";
import { haptic } from "@/design/haptics";
import { color, radius, space } from "@/design/tokens";
import { withLockPaused } from "@/features/lock/useAppLock";
import { LIMITS, preparePhoto } from "@/lib/media";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { Pressable } from "@/ui/Pressable";
import { Text } from "@/ui/Text";
import type { KeptPlate, PlateItem } from "./draft";
import "./i18n";

const PLATE = 88;
type Problem = "cameraDenied" | "cameraBlocked" | "failed";

export function PhotoPlates({
  plates,
  kept,
  keptUrls,
  room,
  chooserOpen,
  onChooser,
  onPlates,
}: {
  plates: PlateItem[];
  kept: KeptPlate[];
  keptUrls: Record<string, string>;
  room: number;
  chooserOpen: boolean;
  onChooser: (open: boolean) => void;
  onPlates: (update: (plates: PlateItem[]) => PlateItem[]) => void;
}) {
  const { t } = useTranslation("preserve");
  const reduced = useReducedMotion();
  const [problem, setProblem] = useState<Problem | null>(null);
  const counter = useRef(0);
  const total = kept.length + plates.length;

  const develop = async (key: string, uri: string, width: number, height: number) => {
    try {
      const photo = await preparePhoto(uri, width, height);
      onPlates((list) => list.map((p) => (p.key === key ? { ...p, photo } : p)));
    } catch {
      onPlates((list) => list.filter((p) => p.key !== key));
      setProblem("failed");
    }
  };

  const pick = async (source: "camera" | "library") => {
    setProblem(null);
    try {
      let result: ImagePickerResult;
      if (source === "camera") {
        const permission = await withLockPaused(() => requestCameraPermissionsAsync());
        if (!permission.granted) {
          setProblem(permission.canAskAgain ? "cameraDenied" : "cameraBlocked");
          return;
        }
        result = await withLockPaused(() => launchCameraAsync({ mediaTypes: ["images"], quality: 1 }));
      } else {
        result = await withLockPaused(() =>
          launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsMultipleSelection: room > 1,
            selectionLimit: Math.max(1, room),
            quality: 1,
          }),
        );
      }
      if (result.canceled) return;
      const assets = result.assets.slice(0, room).map((asset) => ({ asset, key: `plate-${Date.now().toString(36)}-${counter.current++}` }));
      onPlates((list) => [...list, ...assets.map(({ asset, key }) => ({ key, previewUri: asset.uri, photo: null }))]);
      onChooser(false);
      haptic.select();
      for (const { asset, key } of assets) await develop(key, asset.uri, asset.width, asset.height);
    } catch {
      setProblem("failed");
    }
  };

  return (
    <View style={styles.section}>
      <Text variant="label">{t("photos.title", { n: total, max: LIMITS.photosPerRelic })}</Text>
      <View style={styles.row}>
        {kept.map((k, i) => (
          <View key={`kept-${i}`} style={styles.plate} accessible accessibilityLabel={t("photos.kept", { n: i + 1 })}>
            {k.id && keptUrls[k.id] ? (
              <Image source={{ uri: keptUrls[k.id] }} contentFit="cover" style={StyleSheet.absoluteFill} />
            ) : (
              <View style={styles.dark}>
                <Icon name="photo" color={color.ash} />
              </View>
            )}
          </View>
        ))}
        {plates.map((p, i) => (
          <View key={p.key} style={styles.plate}>
            <Image
              source={{ uri: p.photo?.uri ?? p.previewUri }}
              contentFit="cover"
              transition={reduced ? 0 : duration.long}
              style={StyleSheet.absoluteFill}
              accessibilityLabel={t("photos.plate", { n: kept.length + i + 1 })}
            />
            {p.photo ? null : (
              <View style={[styles.dark, styles.developing]} accessibilityLabel={t("photos.developing")}>
                <ActivityIndicator color={color.lamp} />
              </View>
            )}
            <Pressable
              onPress={() => onPlates((list) => list.filter((x) => x.key !== p.key))}
              accessibilityLabel={t("photos.remove", { n: kept.length + i + 1 })}
              style={styles.remove}
            >
              <Icon name="close" size={16} />
            </Pressable>
          </View>
        ))}
        {room > 0 ? (
          <Pressable
            onPress={() => onChooser(!chooserOpen)}
            accessibilityLabel={t("photos.add")}
            accessibilityState={{ expanded: chooserOpen }}
            style={[styles.plate, styles.add]}
          >
            <Icon name="plus" color={color.lamp} />
          </Pressable>
        ) : null}
      </View>
      {chooserOpen && room > 0 ? (
        <View style={styles.row}>
          <Button tone="ghost" label={t("photos.camera")} icon={<Icon name="photo" size={20} />} onPress={() => void pick("camera")} style={styles.source} />
          <Button tone="ghost" label={t("photos.library")} icon={<Icon name="vault" size={20} />} onPress={() => void pick("library")} style={styles.source} />
        </View>
      ) : null}
      {room === 0 ? <Text variant="bodySmall">{t("photos.full", { max: LIMITS.photosPerRelic })}</Text> : null}
      {problem ? (
        <View accessibilityLiveRegion="polite">
          <Text variant="bodySmall">{t(`photos.problem.${problem}`)}</Text>
          {problem === "cameraBlocked" ? (
            <Pressable onPress={() => Linking.openSettings()} accessibilityLabel={t("openSettings")} style={styles.settings}>
              <Text variant="button" style={{ color: color.lamp }}>
                {t("openSettings")}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.sm },
  row: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  plate: {
    width: PLATE,
    height: PLATE,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: color.stone,
    borderWidth: 1,
    borderColor: color.ironHigh,
    borderTopColor: `${color.paper}38`,
  },
  dark: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", backgroundColor: color.stone },
  developing: { backgroundColor: `${color.shaft}B3` },
  remove: {
    position: "absolute",
    top: space.xxs,
    right: space.xxs,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: color.scrim,
    alignItems: "center",
    justifyContent: "center",
  },
  add: { borderStyle: "dashed", borderColor: color.lampDeep, alignItems: "center", justifyContent: "center" },
  source: { flex: 1 },
  settings: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
});
