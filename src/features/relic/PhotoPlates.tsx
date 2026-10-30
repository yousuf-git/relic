// Photographs as glass plates: a swipeable row, each opening full screen.
import { Image } from "expo-image";
import { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Modal, Pressable as RNPressable, StyleSheet, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { art } from "@/design/art";
import { duration } from "@/design/motion";
import { color, minTarget, radius, space } from "@/design/tokens";
import type { MediaRow } from "@/features/relics/api";
import { Button } from "@/ui/Button";
import { Icon } from "@/ui/Icon";
import { Text } from "@/ui/Text";
import "./i18n";

const GAP = space.sm;
const MAT = space.xs;

type Props = {
  photos: MediaRow[];
  urls: Record<string, string> | undefined;
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
};

export const PhotoPlates = memo(function PhotoPlates({ photos, urls, loading, failed, onRetry }: Props) {
  const { t } = useTranslation("relic");
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const [viewer, setViewer] = useState<number | null>(null);

  const plateWidth = width - space.md * 2;
  const first = photos[0];
  const ratio = first?.width && first?.height ? first.width / first.height : 1;
  const plateHeight = Math.round(Math.min(plateWidth * 1.25, Math.max(plateWidth * 0.75, plateWidth / ratio)));

  const onEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => setPage(Math.round(e.nativeEvent.contentOffset.x / (plateWidth + GAP))),
    [plateWidth],
  );

  if (failed) {
    return (
      <View style={styles.notice}>
        <Text variant="bodySmall">{t("photos.failed")}</Text>
        <Button label={t("common:actions.retry")} tone="ghost" onPress={onRetry} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <FlatList
        horizontal
        data={photos}
        keyExtractor={(m) => m.id}
        showsHorizontalScrollIndicator={false}
        snapToInterval={plateWidth + GAP}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: space.md, gap: GAP }}
        onMomentumScrollEnd={onEnd}
        renderItem={({ item, index }) => (
          <RNPressable
            accessibilityRole="imagebutton"
            accessibilityLabel={t("photos.plate", { n: index + 1, total: photos.length })}
            accessibilityHint={t("photos.open")}
            disabled={!urls?.[item.id]}
            onPress={() => setViewer(index)}
            style={[styles.plate, { width: plateWidth, height: plateHeight }]}
          >
            <Image
              source={urls?.[item.id] ? { uri: urls[item.id] } : null}
              placeholder={art.vessel.plate}
              placeholderContentFit="cover"
              contentFit="cover"
              transition={{ duration: duration.long, effect: "cross-dissolve" }}
              recyclingKey={item.id}
              accessible={false}
              style={styles.photo}
            />
            {loading && !urls ? <View style={styles.dim} /> : null}
          </RNPressable>
        )}
      />
      {photos.length > 1 ? (
        <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {photos.map((m, i) => (
            <View key={m.id} style={[styles.dot, i === page && styles.dotOn]} />
          ))}
        </View>
      ) : null}
      <PlateViewer photos={photos} urls={urls} index={viewer} onClose={() => setViewer(null)} />
    </View>
  );
});

function PlateViewer({ photos, urls, index, onClose }: { photos: MediaRow[]; urls: Record<string, string> | undefined; index: number | null; onClose: () => void }) {
  const { t } = useTranslation("relic");
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [shown, setShown] = useState(0);
  const visible = index !== null;
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose} onShow={() => setShown(index ?? 0)}>
      <View style={styles.viewer}>
        {visible ? (
          <FlatList
            horizontal
            pagingEnabled
            data={photos}
            keyExtractor={(m) => m.id}
            initialScrollIndex={index}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setShown(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item, index: i }) => (
              <RNPressable
                onPress={onClose}
                accessibilityLabel={t("photos.plate", { n: i + 1, total: photos.length })}
                accessibilityHint={t("photos.close")}
                style={{ width, height, alignItems: "center", justifyContent: "center" }}
              >
                <Image
                  source={urls?.[item.id] ? { uri: urls[item.id] } : null}
                  contentFit="contain"
                  transition={duration.medium}
                  accessible={false}
                  style={{ width, height }}
                />
              </RNPressable>
            )}
          />
        ) : null}
        <View style={[styles.viewerBar, { top: insets.top + space.xs }]} pointerEvents="box-none">
          <Text variant="label" style={styles.counter}>
            {t("photos.counter", { n: shown + 1, total: photos.length })}
          </Text>
          <RNPressable accessibilityRole="button" accessibilityLabel={t("photos.closeLabel")} onPress={onClose} hitSlop={space.xs} style={styles.closeButton}>
            <Icon name="close" />
          </RNPressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: -space.md, gap: space.sm },
  plate: { padding: MAT, borderRadius: radius.sm, borderWidth: 1, borderColor: color.lampDeep, backgroundColor: color.stone },
  photo: { flex: 1, borderRadius: radius.sm / 2, backgroundColor: color.shaft },
  dim: { ...StyleSheet.absoluteFill, backgroundColor: color.shaft, opacity: 0.4 },
  dots: { flexDirection: "row", justifyContent: "center", gap: space.xs },
  dot: { width: space.md, height: 2, backgroundColor: color.ironHigh },
  dotOn: { backgroundColor: color.lamp },
  notice: { gap: space.sm, alignItems: "flex-start" },
  viewer: { flex: 1, backgroundColor: color.shaft },
  viewerBar: { position: "absolute", left: space.md, right: space.md, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  counter: { color: color.paper },
  closeButton: { width: minTarget, height: minTarget, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: color.stone },
});
