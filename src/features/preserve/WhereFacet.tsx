import * as Location from "expo-location";
import { useState } from "react";
import { Linking, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import { color, space } from "@/design/tokens";
import { withLockPaused } from "@/features/lock/useAppLock";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { Pressable } from "@/ui/Pressable";
import { Text } from "@/ui/Text";
import { PLACE_MAX } from "./draft";
import { field } from "./fieldStyle";
import "./i18n";

type Problem = "denied" | "blocked" | "off" | "unnamed" | "failed";
export type Place = { placeName: string; lat: number | null; lng: number | null };

function placeLabel(a: Location.LocationGeocodedAddress): string {
  const first = a.name && !/^\d+[a-z]?$/i.test(a.name) ? a.name : a.street;
  const second = a.city ?? a.district ?? a.subregion ?? a.region;
  return [first, second].filter((part, i, all): part is string => !!part && all.indexOf(part) === i).join(", ");
}

export function WhereFacet({ place, onChange }: { place: Place; onChange: (place: Place) => void }) {
  const { t } = useTranslation("preserve");
  const [locating, setLocating] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);

  const locate = async () => {
    setProblem(null);
    setLocating(true);
    try {
      const permission = await withLockPaused(() => Location.requestForegroundPermissionsAsync());
      if (!permission.granted) {
        setProblem(permission.canAskAgain ? "denied" : "blocked");
        return;
      }
      if (!(await Location.hasServicesEnabledAsync())) {
        setProblem("off");
        return;
      }
      const { coords } = await withLockPaused(() => Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      let name = "";
      try {
        const [address] = await Location.reverseGeocodeAsync({ latitude: coords.latitude, longitude: coords.longitude });
        name = address ? placeLabel(address) : "";
      } catch {
        // Offline or no geocoder on this device: the pin is kept and the keeper names it.
      }
      onChange({ placeName: name.slice(0, PLACE_MAX), lat: coords.latitude, lng: coords.longitude });
      if (!name) setProblem("unnamed");
    } catch {
      setProblem("failed");
    } finally {
      setLocating(false);
    }
  };

  return (
    <View style={{ gap: space.sm }}>
      <TextInput
        style={field.input}
        value={place.placeName}
        onChangeText={(v) => {
          const placeName = v.slice(0, PLACE_MAX);
          onChange(placeName.trim() ? { ...place, placeName } : { placeName, lat: null, lng: null });
        }}
        placeholder={t("where.placeholder")}
        placeholderTextColor={color.ash}
        selectionColor={color.lamp}
        cursorColor={color.lamp}
        returnKeyType="done"
        accessibilityLabel={t("where.label")}
      />
      <Button
        tone="ghost"
        label={locating ? t("where.locating") : t("where.here")}
        icon={<Icon name="place" size={20} />}
        loading={locating}
        onPress={() => void locate()}
        accessibilityHint={t("where.hereHint")}
      />
      {place.lat !== null ? <Text variant="catalog">{t("where.pinned")}</Text> : null}
      {problem ? (
        <View accessibilityLiveRegion="polite">
          <Text variant="bodySmall">{t(`where.problem.${problem}`)}</Text>
          {problem === "blocked" ? (
            <Pressable onPress={() => Linking.openSettings()} accessibilityLabel={t("openSettings")} style={{ minHeight: 44, justifyContent: "center", alignSelf: "flex-start" }}>
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
