import { color } from "@/design/tokens";

/** Font names are the TTF file names the widget config plugin copies into the app's assets. */
export const widgetFont = {
  display: "IMFellDWPica_400Regular",
  body: "Newsreader_400Regular",
  mono: "IBMPlexMono_500Medium",
} as const;

export const surface = {
  width: "match_parent",
  height: "match_parent",
  backgroundColor: color.stone,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: color.iron,
} as const;

export const link = {
  relic: (id: string) => `relic://relic/${id}`,
  unearth: "relic://unearth",
  preserve: (start: "words" | "voice" | "photo") => `relic://preserve?start=${start}`,
} as const;

/** Same engraved geometry as src/ui/Icon.tsx, as standalone SVG for SvgWidget. */
const svg = (path: string, stroke: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;

export const widgetIcon = {
  words: (stroke: string) => svg("M5 18.8l1-4.2 9.7-9.8 3.2 3.2-9.7 9.8ZM13.6 6.8l3.4 3.4", stroke),
  voice: (stroke: string) =>
    svg("M12 3.6c-1.7 0-3 1.3-3 3v5.2c0 1.7 1.3 3 3 3s3-1.3 3-3V6.6c0-1.7-1.3-3-3-3ZM5.8 11.4c0 3.5 2.8 6.3 6.2 6.3s6.2-2.8 6.2-6.3M12 17.8v2.8", stroke),
  photo: (stroke: string) => svg("M4.2 7.6h3.1l1.5-2.2h6.4l1.5 2.2h3.1v10.8H4.2Z M12 15.6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z", stroke),
  flame: (stroke: string) =>
    svg("M12 20.4c3.2 0 5.4-2.2 5.4-5.2 0-3.6-3-5.2-3.6-8.8-1.8 1.4-2.6 3.2-2.6 4.8-1-.6-1.6-1.6-1.8-2.8-1.6 1.6-2.8 3.8-2.8 6.6 0 3.2 2.2 5.4 5.4 5.4Z", stroke),
} as const;
