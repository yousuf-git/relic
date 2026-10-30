import type { IconName } from "@/ui/Icon";

export const facetKeys = ["when", "where", "who", "weight", "light", "link", "seal"] as const;
export type FacetKey = (typeof facetKeys)[number];

export const facetIcon: Record<FacetKey, IconName> = {
  when: "calendar",
  where: "place",
  who: "people",
  weight: "stone",
  light: "lamp",
  link: "link",
  seal: "lock",
};
