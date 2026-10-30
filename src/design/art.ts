import type { Vessel } from "./tokens";

export const art = {
  duck: {
    clean: require("../../assets/art/duck-clean.webp"),
    patina: require("../../assets/art/duck-patina.webp"),
    worn: require("../../assets/art/duck-worn.webp"),
    tilt: require("../../assets/art/duck-tilt.webp"),
    hero: require("../../assets/art/duck-hero.webp"),
    niche: require("../../assets/art/duck-niche.webp"),
  },
  vessel: {
    letter: require("../../assets/art/vessel-letter.webp"),
    plate: require("../../assets/art/vessel-plate.webp"),
    shell: require("../../assets/art/vessel-shell.webp"),
    map: require("../../assets/art/vessel-map.webp"),
    locket: require("../../assets/art/vessel-locket.webp"),
    reel: require("../../assets/art/vessel-reel.webp"),
  } satisfies Record<Vessel, number>,
  waxSeal: require("../../assets/art/wax-seal.webp"),
  scene: {
    descent: require("../../assets/art/scene-descent.webp"),
    niches: require("../../assets/art/scene-niches.webp"),
    door: require("../../assets/art/scene-door.webp"),
    emptyNiche: require("../../assets/art/scene-empty-niche.webp"),
  },
  share: {
    stone: require("../../assets/art/share-stone.webp"),
    paper: require("../../assets/art/share-paper.webp"),
  },
  texture: {
    stone: require("../../assets/art/texture-stone.webp"),
    paper: require("../../assets/art/texture-paper.webp"),
  },
} as const;

/** The duck weathers with the vault: clean → patina (30) → worn (365). */
export function duckStage(relicCount: number): keyof typeof art.duck {
  if (relicCount >= 365) return "worn";
  if (relicCount >= 30) return "patina";
  return "clean";
}
