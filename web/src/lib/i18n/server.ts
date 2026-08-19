import fs from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import * as yaml from "js-yaml";
import { careerOpsRoot } from "@/lib/career-ops";
import { dictFor, type Dict } from "./index";
import { DEFAULT_LOCALE, LOCALE_COOKIE, normalizeLocale, type Locale } from "./locale";

/**
 * The user's declared output language from config/profile.yml — the same
 * `language.output` the CLI modes already honour (AGENTS.md: "language.output
 * is authoritative for prose"). Reading it here means a user who set
 * `output: zh-CN` for their reports gets a Chinese UI without configuring
 * anything twice.
 */
export function profileLocale(): Locale | null {
  try {
    const raw = fs.readFileSync(path.join(careerOpsRoot(), "config", "profile.yml"), "utf8");
    const parsed = yaml.load(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const lang = (parsed as { language?: { output?: unknown } }).language;
    const output = lang?.output;
    return typeof output === "string" && output.trim() ? normalizeLocale(output) : null;
  } catch {
    return null; // no profile yet (first run) — fall through to the default
  }
}

/**
 * Resolve the locale for a server render: an explicit in-app choice (cookie)
 * wins, then the profile's declared output language, then English.
 */
export async function getLocale(): Promise<Locale> {
  const chosen = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (chosen) return normalizeLocale(chosen);
  return profileLocale() ?? DEFAULT_LOCALE;
}

/** The catalog for the current server render. */
export async function getT(): Promise<Dict> {
  return dictFor(await getLocale());
}
