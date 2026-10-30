import { useTranslation } from "react-i18next";
import { addNamespace } from "@/i18n";
import quarters from "@/i18n/en/quarters.json";

addNamespace("quarters", quarters);

/** `count("key", n)` resolves `keyOne` / `keyOther` so copy never depends on Intl plural rules. */
export function useQ() {
  const { t } = useTranslation("quarters");
  const count = (key: string, n: number, vars: Record<string, unknown> = {}) =>
    t(`${key}${n === 1 ? "One" : "Other"}`, { n, ...vars });
  return { t, count };
}
