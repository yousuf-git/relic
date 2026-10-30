import { FadeIn } from "react-native-reanimated";
import { duration, ease } from "@/design/motion";

/** Lamps ignite and views develop out of the dark; under reduce-motion Reanimated plays it as an instant crossfade. */
export const develop = FadeIn.duration(duration.medium).easing(ease.develop);
