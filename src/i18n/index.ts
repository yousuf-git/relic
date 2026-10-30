// English only in v1; every user-facing string lives in src/i18n/<lang>/<namespace>.json.
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import common from "./en/common.json";

// Feature namespaces register themselves via addNamespace() so parallel work never
// touches one shared file.
i18n.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  defaultNS: "common",
  resources: { en: { common } },
  interpolation: { escapeValue: false },
  returnNull: false,
});

export function addNamespace(ns: string, strings: Record<string, unknown>) {
  if (!i18n.hasResourceBundle("en", ns)) i18n.addResourceBundle("en", ns, strings);
}

export default i18n;
