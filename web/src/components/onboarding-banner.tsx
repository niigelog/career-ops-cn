"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, X, Settings } from "lucide-react";
import { useT } from "@/lib/i18n/provider";
import type { Dict } from "@/lib/i18n";

type Doctor = { available: boolean; onboardingNeeded: boolean; missing: string[]; warnings: string[] };

function hasCli(): boolean {
  try {
    return !!JSON.parse(localStorage.getItem("career-ops:config") || "{}").cliId;
  } catch {
    return false;
  }
}

// The core doctor reports missing files by PATH; the UI names them in prose.
// Path → dict key, so the wording is translated while the paths stay canonical.
const LABEL_KEYS: Record<string, keyof Dict["onboarding"]["labels"]> = {
  "cv.md": "cv",
  "config/profile.yml": "profile",
  "modes/_profile.md": "personalization",
  "portals.yml": "portals",
};

// Detect (via the core's doctor.mjs) whether setup is incomplete, and offer to
// finish it CONVERSATIONALLY — the assistant asks in plain language and writes
// the canonical files (no YAML to edit). This is the #1 adoption barrier.
export function OnboardingBanner() {
  const t = useT();
  const [d, setD] = useState<Doctor | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [cli, setCli] = useState(true); // assume until read (avoid CTA flash)

  useEffect(() => {
    setCli(hasCli());
    fetch("/api/doctor")
      .then((r) => r.json())
      .then(setD)
      .catch(() => {});
  }, []);

  if (dismissed || !d || !d.onboardingNeeded) return null;
  const items = d.missing.map((m) => {
    const key = LABEL_KEYS[m];
    return key ? t.onboarding.labels[key] : m;
  });
  const kickoff = t.onboarding.kickoff(items.join("、"));

  return (
    <div className="dot-bg relative mb-6 overflow-hidden rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/10 via-surface/40 to-transparent p-5">
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-3 text-faint transition-colors hover:text-foreground"
        aria-label={t.common.dismiss}
      >
        <X className="size-4" />
      </button>
      <h2 className="font-display text-xl text-landing">{t.onboarding.title}</h2>
      <p className="mt-1.5 max-w-xl text-sm text-muted">
        {t.onboarding.body(items.join("、"))}{" "}
        <span className="text-foreground">{t.onboarding.noYaml}</span> {t.onboarding.bodyTail}
      </p>
      {cli ? (
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("co-assistant", { detail: { message: kickoff } }))}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-200"
        >
          <Sparkles className="size-4" /> {t.onboarding.ctaAssistant}
        </button>
      ) : (
        // The assistant needs a CLI to run — without one the kickoff would silently
        // drop. Send them to connect one first.
        <Link
          href="/config"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-200"
        >
          <Settings className="size-4" /> {t.onboarding.ctaConnectCli}
        </Link>
      )}
    </div>
  );
}
