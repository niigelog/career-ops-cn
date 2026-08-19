/**
 * Locale primitives — pure, dependency-free, importable from both server and
 * client bundles. Mirrors the Go dashboard's zero-dependency catalog approach
 * (dashboard/internal/i18n/catalog.go): static dictionaries selected by language
 * prefix, no runtime translation service, no extra npm dependency.
 *
 * Adding a language touches this file in four places and ./index.ts in one.
 * TypeScript reports each of them as an error until it is filled — see
 * ./README.md for the walkthrough.
 */

export const LOCALES = ["en", "zh"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Cookie the browser and the server agree on. A cookie (not localStorage) so
 *  server components can resolve the same locale the client renders. */
export const LOCALE_COOKIE = "career-ops:lang";

/** Value for <html lang> — the BCP-47 tag, not our internal short code. */
export const HTML_LANG: Record<Locale, string> = {
  en: "en",
  zh: "zh-Hans",
};

/** Locale used for Intl date/number formatting. */
export const INTL_LOCALE: Record<Locale, string> = {
  en: "en-US",
  zh: "zh-CN",
};

/** Native name, for the language switcher. */
export const LOCALE_LABEL: Record<Locale, string> = {
  en: "English",
  zh: "中文",
};

/**
 * Resolve any language string to a supported locale by prefix — "zh", "zh-CN",
 * "zh_TW", "zh-Hans" → "zh"; "en", "en-GB" → "en"; anything else → the default.
 * Same prefix rule as the Go catalog's SetLang, so the two UIs agree on what
 * `language.output: zh-CN` in config/profile.yml means.
 */
export function normalizeLocale(value: string | null | undefined): Locale {
  const l = (value ?? "").trim().toLowerCase();
  if (!l) return DEFAULT_LOCALE;
  for (const locale of LOCALES) {
    if (l === locale || l.startsWith(`${locale}-`) || l.startsWith(`${locale}_`)) return locale;
  }
  return DEFAULT_LOCALE;
}

/** True when `value` is exactly one of our supported locales. */
export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
