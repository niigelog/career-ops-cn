import { en } from "./en";
import { zh } from "./zh";
import { DEFAULT_LOCALE, type Locale } from "./locale";

/**
 * The dictionary shape, derived from the English catalog. Every other locale is
 * typed as `Dict`, so a missing or misspelled key — or a parameterised entry
 * whose signature drifted — is a compile error, not a runtime blank.
 */
export type Dict = typeof en;

const DICTS: Record<Locale, Dict> = { en, zh };

/** The catalog for a locale. Unknown locales fall back to the default. */
export function dictFor(locale: Locale): Dict {
  return DICTS[locale] ?? DICTS[DEFAULT_LOCALE];
}

/**
 * Display label for a canonical status token ("APPLIED", "Applied", "applied"
 * all resolve). Unknown tokens — a legacy or hand-written status the core hasn't
 * normalized — are returned as-is rather than blanked, mirroring the Go
 * catalog's StatusLabel fallback.
 */
export function statusLabel(t: Dict, token: string): string {
  const key = token.trim().toLowerCase();
  const labels = t.status as Record<string, string | undefined>;
  return labels[key] ?? token;
}

export { en, zh };
export * from "./locale";
