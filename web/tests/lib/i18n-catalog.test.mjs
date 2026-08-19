// Tests for the i18n catalogs (#web-i18n): every locale must be complete, and
// the profile→locale bridge must agree with the CLI's reading of
// config/profile.yml `language.output`.
//
// TypeScript already enforces KEY parity (each locale is typed as `Dict`,
// derived from the English catalog), so these tests cover what the type system
// cannot see: entries that were copied but never translated, empty strings,
// parameterised entries whose arity drifted, and the locale-resolution rule that
// decides which catalog a user actually gets.
//
// Run:  node --test tests/lib/i18n-catalog.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { en } from "../../src/lib/i18n/en.ts";
import { zh } from "../../src/lib/i18n/zh.ts";
import { LOCALES, DEFAULT_LOCALE, normalizeLocale, HTML_LANG, INTL_LOCALE } from "../../src/lib/i18n/locale.ts";

const CATALOGS = { en, zh };

/** Flatten a catalog to `section.key` → value, one level of nesting deep. */
function flatten(dict, prefix = "") {
  const out = new Map();
  for (const [k, v] of Object.entries(dict)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      for (const [nk, nv] of flatten(v, path)) out.set(nk, nv);
    } else {
      out.set(path, v);
    }
  }
  return out;
}

// Entries that are legitimately identical across locales: brand names, product
// nouns career-ops does not translate, and numeric/symbolic labels. Anything NOT
// listed here that matches English is almost certainly an untranslated string.
const SHARED_VERBATIM = new Set([
  "analytics.bucketUnder3", // "< 3.0"
  "methodology.introRange", // "1.0–5.0"
  "methodology.introLine", // "4.0" — the apply/don't-apply threshold
  "meta.title",
  "nav.localFirst",
]);

test("every supported locale has a catalog", () => {
  // Given the list of locales the app advertises
  // When each is looked up
  // Then a catalog exists for it — a locale can never resolve to nothing
  for (const locale of LOCALES) {
    assert.ok(CATALOGS[locale], `no catalog registered for locale "${locale}"`);
    assert.ok(HTML_LANG[locale], `no <html lang> mapping for "${locale}"`);
    assert.ok(INTL_LOCALE[locale], `no Intl locale mapping for "${locale}"`);
  }
});

test("each locale has exactly the English catalog's keys", () => {
  // Given the English catalog as the source of record
  const expected = [...flatten(en).keys()].sort();

  for (const [locale, dict] of Object.entries(CATALOGS)) {
    // When its keys are compared
    const actual = [...flatten(dict).keys()].sort();

    // Then they match exactly — no missing entry (a blank in the UI) and no
    // stale one (dead weight that outlived its English original)
    assert.deepEqual(actual, expected, `locale "${locale}" key set drifted from English`);
  }
});

test("no entry is empty, and parameterised entries keep their arity", () => {
  const source = flatten(en);

  for (const [locale, dict] of Object.entries(CATALOGS)) {
    for (const [key, value] of flatten(dict)) {
      const original = source.get(key);

      // Given an entry, when its shape is checked against English
      assert.equal(typeof value, typeof original, `${locale}.${key}: type drifted from English`);

      if (typeof value === "string") {
        // Then a string entry is never blank — a blank renders as nothing at all
        assert.notEqual(value.trim(), "", `${locale}.${key} is empty`);
      } else if (typeof value === "function") {
        // Then a function entry takes the same arguments the call sites pass
        assert.equal(value.length, original.length, `${locale}.${key}: argument count drifted from English`);
      } else if (Array.isArray(value)) {
        assert.ok(value.length > 0, `${locale}.${key} is an empty list`);
      }
    }
  }
});

test("the Chinese catalog is actually translated, not copied", () => {
  const source = flatten(en);
  const untranslated = [];

  for (const [key, value] of flatten(zh)) {
    if (typeof value !== "string" || SHARED_VERBATIM.has(key)) continue;
    // Given a Chinese entry identical to its English original
    if (value === source.get(key)) untranslated.push(key);
  }

  // Then it is flagged — an exact match is a copy-paste that never got translated
  assert.deepEqual(untranslated, [], `these zh entries are still the English text: ${untranslated.join(", ")}`);
});

test("normalizeLocale reads config/profile.yml language.output the way the CLI does", () => {
  // Given the forms `language.output` takes across career-ops profiles
  // When each is normalized
  // Then the region/script suffix is dropped to the base locale, matching the Go
  // dashboard's SetLang prefix rule — one profile drives both UIs
  assert.equal(normalizeLocale("zh-CN"), "zh");
  assert.equal(normalizeLocale("zh_TW"), "zh");
  assert.equal(normalizeLocale("zh-Hans"), "zh");
  assert.equal(normalizeLocale("ZH"), "zh");
  assert.equal(normalizeLocale("en-GB"), "en");

  // And anything unsupported or absent falls back rather than blanking the UI
  assert.equal(normalizeLocale("de-DE"), DEFAULT_LOCALE);
  assert.equal(normalizeLocale(""), DEFAULT_LOCALE);
  assert.equal(normalizeLocale(null), DEFAULT_LOCALE);
  assert.equal(normalizeLocale(undefined), DEFAULT_LOCALE);
});
