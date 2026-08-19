# Adding a language to the web UI

The web app ships static dictionaries — no translation service, no extra npm
dependency. It mirrors the Go dashboard's catalog
(`dashboard/internal/i18n/catalog.go`): one object per language, selected by
language prefix.

Adding a language is a copy-translate-register job. TypeScript walks you through
every step: after step 1 the build fails until each remaining edit is made, so
you cannot ship a half-registered locale.

## 1. Copy the English catalog

```bash
cp src/lib/i18n/en.ts src/lib/i18n/fr.ts
```

Rename the export and type it as `Dict`, then translate the **values** only —
never the keys:

```ts
import type { Dict } from "./index";

export const fr: Dict = {
  meta: { title: "career-ops — l'expérience web officielle", ... },
  ...
};
```

`Dict` is derived from `en.ts`, so a missing key, a typo, or a parameterised
entry whose arguments drifted is a **compile error**, not a blank in the UI.

### Translating parameterised entries

Some entries are functions, because word order and pluralisation differ per
language:

```ts
seeAll: (n: number) => `See all ${n} →`,
```

Keep the same parameters even when your language does not use one — the arity is
checked by `tests/lib/i18n-catalog.test.mjs`:

```ts
// Chinese has no plural form, but the parameter stays so the signature matches
candidates: (n: number) => "个候选",
```

A few entries return `{ before, after }` segments instead of a whole sentence.
Those wrap a styled number in the JSX, so each language can put the count where
its grammar wants it:

```ts
// EN renders "<n> new matches this week", ZH renders "本周新增 <n> 个匹配"
newMatches: (n: number) => ({ before: "本周新增 ", after: " 个匹配" }),
```

## 2. Register the locale

Four edits in `locale.ts`:

```ts
export const LOCALES = ["en", "zh", "fr"] as const;      // 1. the code
export const HTML_LANG  = { ..., fr: "fr" };             // 2. <html lang>
export const INTL_LOCALE = { ..., fr: "fr-FR" };         // 3. Intl date/number
export const LOCALE_LABEL = { ..., fr: "Français" };     // 4. switcher label
```

One edit in `index.ts`:

```ts
import { fr } from "./fr";
const DICTS: Record<Locale, Dict> = { en, zh, fr };
```

`normalizeLocale` needs no change — it resolves regional variants onto the base
code by prefix (`fr-CA`, `fr_BE` → `fr`), the same rule the Go dashboard uses.

## 3. Verify

```bash
npx tsc --noEmit
npm test
```

`tests/lib/i18n-catalog.test.mjs` checks what the type system cannot see: empty
strings, arity drift, and entries that were copied but never translated. If it
reports an entry as untranslated that is *meant* to stay identical across
languages (a brand name, a number), add its key to `SHARED_VERBATIM` in that
test with a comment saying why.

## What is NOT translated

Values that leave the browser and land in the user's files or the core scripts
stay canonical, in English:

- **Status tokens** written to `data/applications.md` — `Applied`, `Discarded`,
  … (`templates/states.yml`). Only the *label* moves, via `statusLabel()`.
- **Follow-up channels** written to `data/follow-ups.md` — `Email`, `LinkedIn`, …
- **Report block letters** A–G, ATS vendor names, worker tool names.
- **The assistant's page-context strings** in `assistant-console.tsx`. Those go
  into the model's system prompt, not the UI; the assistant answers in the
  user's language because `config/profile.yml` `language.output` tells it to.

## How a user gets your language

In order of precedence:

1. The in-app switcher (writes the `career-ops:lang` cookie).
2. `language.output` in `config/profile.yml` — the same key the CLI modes honour,
   so a user who set `output: fr` for their reports gets a French UI without
   configuring anything twice.
3. English.
