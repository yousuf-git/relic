import Animated, { useAnimatedProps, type SharedValue } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** A ring that fills clockwise from the top as `progress` runs 0 to 1. */
export function ProgressRing({
  size,
  stroke,
  progress,
  tint,
  track,
}: {
  size: number;
  stroke: number;
  progress: SharedValue<number>;
  tint: string;
  track: string;
}) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - progress.get()) }));
  return (
    <Svg width={size} height={size} pointerEvents="none" style={{ transform: [{ rotate: "-90deg" }] }}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={tint}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        animatedProps={animatedProps}
        fill="none"
      />
    </Svg>
  );
}
