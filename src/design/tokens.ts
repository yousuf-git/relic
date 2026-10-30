// Single source of truth for Relic's visual language. See docs/DESIGN.md §3.
export const color = {
  shaft: "#0D0B09",
  stone: "#17140F",
  iron: "#27221B",
  ironHigh: "#352E25",
  paper: "#EDE3D1",
  ash: "#A39788",
  // Decorative / large text only (4.05:1 on shaft).
  faint: "#7A7064",
  lamp: "#F2A54A",
  lampDeep: "#B8742A",
  onLamp: "#0D0B09",
  danger: "#E0735A",
  scrim: "rgba(13, 11, 9, 0.72)",
} as const;

// Relic glows only — never UI chrome.
export const moodLight = {
  ember: "#E9764A",
  honey: "#F2B65A",
  moss: "#9DB26B",
  tide: "#6FA5B4",
  dusk: "#A88BC4",
  ash: "#C8BCAA",
} as const;
export type Mood = keyof typeof moodLight;
export const moods = Object.keys(moodLight) as Mood[];

export const vessels = ["letter", "plate", "shell", "map", "locket", "reel"] as const;
export type Vessel = (typeof vessels)[number];

export const space = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48, xxxl: 64 } as const;
export const radius = { sm: 6, md: 12, lg: 20, pill: 999 } as const;

export const font = {
  display: "IMFellDWPica_400Regular",
  displayItalic: "IMFellDWPica_400Regular_Italic",
  body: "Newsreader_400Regular",
  bodyItalic: "Newsreader_400Regular_Italic",
  bodyMedium: "Newsreader_500Medium",
  mono: "IBMPlexMono_400Regular",
  monoMedium: "IBMPlexMono_500Medium",
} as const;

// Four sizes per family keeps hierarchy legible.
export const type = {
  hero: { fontFamily: font.display, fontSize: 40, lineHeight: 46, color: color.paper },
  title: { fontFamily: font.display, fontSize: 28, lineHeight: 34, color: color.paper },
  heading: { fontFamily: font.display, fontSize: 21, lineHeight: 27, color: color.paper },
  body: { fontFamily: font.body, fontSize: 18, lineHeight: 27, color: color.paper },
  bodySmall: { fontFamily: font.body, fontSize: 16, lineHeight: 23, color: color.ash },
  label: { fontFamily: font.monoMedium, fontSize: 12, lineHeight: 16, letterSpacing: 1.4, color: color.ash, textTransform: "uppercase" as const },
  catalog: { fontFamily: font.mono, fontSize: 13, lineHeight: 18, letterSpacing: 0.6, color: color.ash },
  button: { fontFamily: font.monoMedium, fontSize: 14, lineHeight: 18, letterSpacing: 1.6, textTransform: "uppercase" as const },
} as const;

export const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 } as const;
export const minTarget = 48;
