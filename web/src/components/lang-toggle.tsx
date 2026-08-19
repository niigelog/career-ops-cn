"use client";

import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/provider";
import { LOCALE_LABEL, LOCALES } from "@/lib/i18n/locale";

/**
 * Language switcher. Writes the locale cookie and refreshes so BOTH server and
 * client components re-render translated (see I18nProvider.setLocale) — the
 * theme toggle's sibling, same placement and affordance.
 */
export function LangToggle({ className }: { className?: string }) {
  const { locale, t, setLocale } = useI18n();
  // Two locales today: the button flips to the other one. With a third, this
  // becomes a menu — LOCALES stays the single source of truth either way.
  const next = LOCALES[(LOCALES.indexOf(locale) + 1) % LOCALES.length];

  return (
    <Button
      variant="ghost"
      size="icon"
      type="button"
      onClick={() => setLocale(next)}
      aria-label={t.lang.switchTo(LOCALE_LABEL[next])}
      title={t.lang.switchTo(LOCALE_LABEL[next])}
      className={cn("text-muted", className)}
    >
      <Languages className="size-4" />
    </Button>
  );
}
