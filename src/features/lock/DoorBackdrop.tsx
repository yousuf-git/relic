import { Image } from "expo-image";
import { StyleSheet } from "react-native";
import { art } from "@/design/art";
import { Scrim } from "@/features/welcome/Scene";

export function DoorImage() {
  return <Image source={art.scene.door} contentFit="cover" style={StyleSheet.absoluteFill} />;
}

/** The vault door scene. The gate's cover and the lock screen share it so the hand-off is invisible. */
export function DoorBackdrop() {
  return (
    <>
      <DoorImage />
      <Scrim top={0.35} clearTo={0.4} />
    </>
  );
}
