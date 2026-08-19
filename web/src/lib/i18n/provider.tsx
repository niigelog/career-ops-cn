"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import { dictFor, type Dict } from "./index";
import { INTL_LOCALE, LOCALE_COOKIE, HTML_LANG, type Locale } from "./locale";

type I18nValue = {
  locale: Locale;
  t: Dict;
  /** BCP-47 tag for Intl.* formatting (dates, numbers). */
  intlLocale: string;
  setLocale: (next: Locale) => void;
};

const I18nContext = createContext<I18nValue | null>(null);

/**
 * Holds the locale resolved on the server (cookie → profile.yml → default) and
 * hands the catalog to client components. Switching writes the cookie and calls
 * router.refresh() so server components re-render in the new language too —
 * one source of truth, no split-brain between server and client copy.
 */
export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const router = useRouter();

  const setLocale = useCallback(
    (next: Locale) => {
      // 1 year, root path — same lifetime as the theme preference.
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = HTML_LANG[next];
      router.refresh();
    },
    [router],
  );

  const value = useMemo<I18nValue>(
    () => ({ locale, t: dictFor(locale), intlLocale: INTL_LOCALE[locale], setLocale }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** The full i18n context (locale, catalog, switcher). */
export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}

/** The catalog only — the common case. */
export function useT(): Dict {
  return useI18n().t;
}
