import { duration } from "@/design/motion";

/** The ceremony's timeline, in ms from mount. The duck tilts, then the relic drops, then its words develop. */
export const ritual = {
  token: duration.medium,
  landing: duration.medium + 250,
  words: duration.medium + duration.short,
  tiltBack: duration.medium + duration.long,
} as const;

/** How far above its resting place the relic starts its fall. */
export const TOKEN_RISE = 120;
