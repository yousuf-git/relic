// One Skia canvas for a whole field of day-lamps (a year, or a single month).
// Brightness steps with the day's count and weight; the tint is the mood light
// of the heaviest relic kept that day.
import { Canvas, Circle, RadialGradient, vec } from "@shopify/react-native-skia";
import { color, moodLight, type Mood } from "@/design/tokens";
import type { LampLevel } from "./calendar-source";

export type LampDot = {
  key: string;
  x: number;
  y: number;
  level: LampLevel;
  mood?: Mood;
  today?: boolean;
  future?: boolean;
  selected?: boolean;
};

// Fractions of the lamp size.
const LEVELS = [
  null,
  { core: 0.2, glow: 0.55, coreAlpha: 0.7, glowAlpha: 0.22 },
  { core: 0.26, glow: 0.8, coreAlpha: 0.85, glowAlpha: 0.32 },
  { core: 0.32, glow: 1.0, coreAlpha: 0.95, glowAlpha: 0.42 },
  { core: 0.38, glow: 1.3, coreAlpha: 1, glowAlpha: 0.55 },
] as const;

const UNLIT = 0.13;
const RING = 0.46;

const withAlpha = (hex: string, alpha: number) =>
  `${hex}${Math.round(Math.min(1, alpha) * 255).toString(16).padStart(2, "0")}`;

export function LampField({ width, height, lampSize, lamps }: { width: number; height: number; lampSize: number; lamps: LampDot[] }) {
  return (
    <Canvas style={{ width, height }} pointerEvents="none">
      {lamps.map((lamp) => {
        const spec = LEVELS[lamp.level];
        const tint = moodLight[lamp.mood ?? "honey"];
        return <LampMark key={lamp.key} lamp={lamp} spec={spec} tint={tint} size={lampSize} />;
      })}
    </Canvas>
  );
}

function LampMark({ lamp, spec, tint, size }: { lamp: LampDot; spec: (typeof LEVELS)[number]; tint: string; size: number }) {
  const { x, y } = lamp;
  return (
    <>
      {spec ? (
        <>
          <Circle cx={x} cy={y} r={size * spec.glow}>
            <RadialGradient c={vec(x, y)} r={size * spec.glow} colors={[withAlpha(tint, spec.glowAlpha), withAlpha(tint, 0)]} />
          </Circle>
          <Circle cx={x} cy={y} r={size * spec.core} color={withAlpha(tint, spec.coreAlpha)} />
          {lamp.level === 4 ? <Circle cx={x} cy={y} r={size * spec.core * 0.4} color={withAlpha(color.paper, 0.7)} /> : null}
        </>
      ) : (
        <Circle cx={x} cy={y} r={size * UNLIT} color={lamp.future ? color.iron : color.ironHigh} />
      )}
      {lamp.today ? <Circle cx={x} cy={y} r={size * RING} style="stroke" strokeWidth={1} color={color.lamp} /> : null}
      {lamp.selected ? <Circle cx={x} cy={y} r={size * RING} style="stroke" strokeWidth={1.5} color={color.paper} /> : null}
    </>
  );
}
