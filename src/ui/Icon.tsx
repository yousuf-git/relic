// Relic's engraved line icons: 24-unit grid, 1.5 stroke, slightly irregular
// hand-cut geometry so they sit with the archival type rather than a UI kit.
import Svg, { Circle, Path } from "react-native-svg";
import { color as palette } from "@/design/tokens";

const paths = {
  back: "M14.5 5.2 7.8 12l6.7 6.8",
  close: "M6.3 6.2l11.4 11.6M17.6 6.3 6.4 17.7",
  plus: "M12 4.8v14.4M4.8 12.1h14.4",
  check: "M5.2 12.6l4.3 4.1 9.3-9.6",
  mic: "M12 3.6c-1.7 0-3 1.3-3 3v5.2c0 1.7 1.3 3 3 3s3-1.3 3-3V6.6c0-1.7-1.3-3-3-3ZM5.8 11.4c0 3.5 2.8 6.3 6.2 6.3s6.2-2.8 6.2-6.3M12 17.8v2.8",
  photo: "M4.2 7.6h3.1l1.5-2.2h6.4l1.5 2.2h3.1v10.8H4.2Z M12 15.6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  place: "M12 20.6s-6.1-5.4-6.1-10.1a6.1 6.1 0 0 1 12.2 0c0 4.7-6.1 10.1-6.1 10.1Z M12 12.4a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  people: "M9 11.2a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2ZM3.6 19.2c.6-3.2 2.8-5 5.4-5s4.8 1.8 5.4 5M15.6 5.4a3 3 0 0 1 0 5.6M17.4 14.5c1.6.6 2.7 2.2 3 4.7",
  link: "M10.2 13.8a3.6 3.6 0 0 0 5.1 0l3-3a3.6 3.6 0 0 0-5.1-5.1l-1 1M13.8 10.2a3.6 3.6 0 0 0-5.1 0l-3 3a3.6 3.6 0 0 0 5.1 5.1l1-1",
  calendar: "M4.4 6.4h15.2v13.2H4.4ZM4.4 10.2h15.2M8.2 4v4M15.8 4v4",
  vault: "M12 3.8a8.2 8.2 0 1 0 0 16.4 8.2 8.2 0 0 0 0-16.4ZM12 9.4a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2ZM12 3.8v5.6M12 14.6v5.6M3.8 12h5.6M14.6 12h5.6",
  lamp: "M9 4.4h6l2.4 6.2H6.6ZM12 10.6v6M8.6 19.6h6.8M12 16.6v3",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19 13.2l1.6-1.2-1.6-2.8-1.9.6a6.7 6.7 0 0 0-1.4-.8L15.3 7h-3.2l-.5 2a6.7 6.7 0 0 0-1.4.8l-1.9-.6L6.7 12l1.6 1.2a6.2 6.2 0 0 0 0 1.6",
  share: "M12 3.8v11M8 7.6l4-3.8 4 3.8M5.6 11.4v8.4h12.8v-8.4",
  edit: "M5 18.8l1-4.2 9.7-9.8 3.2 3.2-9.7 9.8ZM13.6 6.8l3.4 3.4",
  release: "M5.2 7.2h13.6M9.4 7V4.8h5.2V7M7 7.2l.9 12.2h8.2l.9-12.2",
  lock: "M6.2 10.6h11.6v9H6.2ZM8.6 10.6V7.8a3.4 3.4 0 0 1 6.8 0v2.8M12 14.2v2",
  seal: "M12 3.6l2 1.6 2.5-.3 1 2.3 2.3 1-.3 2.5 1.6 2-1.6 2 .3 2.5-2.3 1-1 2.3-2.5-.3-2 1.6-2-1.6-2.5.3-1-2.3-2.3-1 .3-2.5-1.6-2 1.6-2-.3-2.5 2.3-1 1-2.3 2.5.3Z",
  nut: "M8 5.2h8l4 6.8-4 6.8H8L4 12Z",
  search: "M10.6 17.2a6.6 6.6 0 1 0 0-13.2 6.6 6.6 0 0 0 0 13.2ZM15.4 15.4l4.8 4.8",
  play: "M8 5.4v13.2l10.4-6.6Z",
  pause: "M8.4 5.6v12.8M15.6 5.6v12.8",
  flame: "M12 20.4c3.2 0 5.4-2.2 5.4-5.2 0-3.6-3-5.2-3.6-8.8-1.8 1.4-2.6 3.2-2.6 4.8-1-.6-1.6-1.6-1.8-2.8-1.6 1.6-2.8 3.8-2.8 6.6 0 3.2 2.2 5.4 5.4 5.4Z",
  feather: "M19.2 4.8C13 5 7.4 9.6 6.4 17.6l-1.6 1.6M6.4 17.6l7.2-7.2M9.2 15c3.6.4 7.6-2.4 10-10.2",
  stone: "M5 15.4c0-4.6 3-8.4 7.2-8.4 4 0 6.8 3 6.8 6.8 0 3.4-2.8 5.4-7 5.4-4.4 0-7-1.4-7-3.8Z",
  hourglass: "M7 4h10M7 20h10M8 4c0 4 8 4.4 8 8s-8 4-8 8M16 4c0 4-8 4.4-8 8s8 4 8 8",
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, size = 24, color = palette.paper, strokeWidth = 1.5 }: { name: IconName; size?: number; color?: string; strokeWidth?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessibilityElementsHidden importantForAccessibility="no">
      <Path d={paths[name]} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      {name === "nut" ? <Circle cx={12} cy={12} r={2.6} stroke={color} strokeWidth={strokeWidth} /> : null}
    </Svg>
  );
}
