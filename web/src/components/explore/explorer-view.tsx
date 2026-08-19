"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Compass, ChevronDown, RotateCcw, AlertTriangle, Sparkles, Settings } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { instrumentSerif } from "@/lib/fonts";
import type { Application, InboxJob } from "@/lib/career-ops";
import { normalizeTextKey } from "@/lib/core/normalize-text-key.mjs";
import { paramsToFilters, paramsToAi, type ExploreFilters } from "@/lib/explore";
import { FilterBuilder } from "./filter-builder";
import { DiscoveringState } from "./discovering-state";
import { AiHuntView } from "./ai-hunt-view";
import { ExploreModeToggle } from "./explore-mode-toggle";
import { AiSearchBox } from "./ai-search-box";
import { ResultsList, type EnrichedOffer } from "./results-list";
import { useExplore } from "./explore-provider";
import { useT } from "@/lib/i18n/provider";
import type { Dict } from "@/lib/i18n";

// Same shape as core normalizeTextKey(s, " ") — never [^a-z0-9] (#2666).
const norm = (s: string) => normalizeTextKey(s, " ");
const CLI_NAMES: Record<string, string> = {
  claude: "Claude Code",
  codex: "Codex",
  gemini: "Gemini CLI",
  opencode: "OpenCode",
  copilot: "Copilot CLI",
  qwen: "Qwen CLI",
  antigravity: "Antigravity CLI",
};

export function ExplorerView({
  seed,
  inboxSnapshot,
  appsSnapshot,
  rootExists,
}: {
  seed: { filters: ExploreFilters; seededFrom: string[] };
  inboxSnapshot: InboxJob[];
  appsSnapshot: Application[];
  rootExists: boolean;
}) {
  const t = useT();
  const { filters, setFilters, initFilters, phase, running, offers, discover, loadFresh, status, error, mode, setMode, aiIntent, setAiIntent, discoverAI, companiesScanned, companiesAvailable, capHit, droppedNoDate, partial } = useExplore();
  const scanNote =
    companiesScanned > 0
      ? t.explore.scanNote(
          companiesScanned.toLocaleString(),
          companiesAvailable > companiesScanned ? companiesAvailable.toLocaleString() : null,
          partial,
        )
      : undefined;
  const inited = useRef(false);
  const [refineOpen, setRefineOpen] = useState(false);
  const [cli, setCli] = useState<{ id: string | null; name?: string }>({ id: null });
  const [firstRun, setFirstRun] = useState(false);

  useEffect(() => {
    try {
      const id = JSON.parse(localStorage.getItem("career-ops:config") || "{}").cliId || null;
      setCli({ id, name: id ? CLI_NAMES[id] || id : undefined });
    } catch {
      setCli({ id: null });
    }
  }, []);

  // Initialize once from the URL (shareable search) or the server seed — without
  // clobbering anything the assistant set before this mount.
  useEffect(() => {
    if (inited.current) return;
    inited.current = true;
    const sp = new URLSearchParams(window.location.search);
    const ai = paramsToAi(sp);
    if (ai !== null) {
      setMode("ai");
      setAiIntent(ai);
    } else if (sp.get("view") === "fresh") {
      // Today's "See all N" (#84) hands off here instead of a bare config form —
      // load the SAME /api/whats-new offers it already showed, through the normal
      // results-phase UI. The config form (Refine search / Re-cast) stays reachable.
      // Force scan mode: a session restored in "ai" mode (sessionStorage rehydrate)
      // must not show the AI-search UI for this scan-only hand-off.
      setMode("scan");
      initFilters(seed.filters);
      void loadFresh();
    } else {
      initFilters(sp.toString() ? paramsToFilters(sp) : seed.filters);
      // Onboarding hand-off: ?run=1 auto-fires the free scan + flags the first-run
      // banner (the "matches found from your CV, free" reveal).
      if (sp.get("run") === "1") {
        setFirstRun(true);
        void discover();
      }
    }
  }, [seed.filters, initFilters, setMode, setAiIntent, discover, loadFresh]);

  const inboxUrls = useMemo(() => new Set(inboxSnapshot.map((j) => j.url)), [inboxSnapshot]);
  const enriched: EnrichedOffer[] = useMemo(
    () =>
      offers.map((o) => {
        const inPipeline = inboxUrls.has(o.url);
        const c = norm(o.company);
        const t = norm(o.title);
        const ev = appsSnapshot.find((a) => {
          if (norm(a.company) !== c) return false;
          const ar = norm(a.role);
          return ar.length > 3 && (t.includes(ar) || ar.includes(t.split(" ").slice(0, 3).join(" ")));
        });
        return { ...o, inPipeline, evaluatedN: ev?.n };
      }),
    [offers, inboxUrls, appsSnapshot],
  );

  const isAi = mode === "ai";
  if (running) return isAi ? <AiHuntView cliName={cli.name} /> : <DiscoveringState />;

  const canDiscover = filters.ats.length > 0;
  const isResults = phase === "results";

  return (
    <div className="mx-auto max-w-none px-6 py-8">
      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5">
            <Compass className="size-6 text-brand" />
            <h1 className={`${instrumentSerif.className} text-3xl text-foreground`}>{t.explore.title}</h1>
            <span className="rounded-full border border-brand/30 bg-brand-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-text">{t.explore.chipNew}</span>
          </div>
          <div className="w-full sm:ml-auto sm:w-auto">
            <ExploreModeToggle mode={mode} onChange={setMode} cliConfigured={!!cli.id} />
          </div>
        </div>
        {!isResults && (
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
            {isAi ? t.explore.introAi : t.explore.introScan}
          </p>
        )}
      </header>

      {!rootExists && (
        <div className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          {t.explore.noHome}
        </div>
      )}

      {isAi ? (
        phase === "blocked" ? (
          <BlockedCard t={t} />
        ) : (
          <div className="space-y-6">
            <AiSearchBox
              intent={aiIntent}
              onIntent={setAiIntent}
              onSubmit={() => void discoverAI()}
              cliConfigured={!!cli.id}
              cliName={cli.name}
              onRunScan={() => setMode("scan")}
            />
            {phase === "results" && <ResultsList offers={enriched} />}
            {phase === "empty-loose" && (
              <EmptyState
                tone="loose"
                title={t.explore.emptyAiTitle}
                body={t.explore.emptyAiBody}
                onRerun={() => setMode("scan")}
                rerunLabel={t.explore.emptyAiCta}
              />
            )}
            {phase === "failed" && <FailedCard t={t} msg={error || status} onRetry={() => void discoverAI()} />}
          </div>
        )
      ) : (
        <>
          {isResults ? (
            <div className="mb-6 rounded-xl border border-border bg-surface/30">
              <button type="button" onClick={() => setRefineOpen((v) => !v)} className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-foreground">
                <Compass className="size-4 text-brand" /> {t.explore.refineSearch}
                <ChevronDown className={cn("ml-auto size-4 text-muted transition-transform", refineOpen && "rotate-180")} />
              </button>
              {refineOpen && (
                <div className="space-y-4 border-t border-border p-4">
                  <FilterBuilder filters={filters} onChange={setFilters} seededFrom={seed.seededFrom} />
                  <DiscoverBar canDiscover={canDiscover} onDiscover={discover} label={t.explore.recastFree} />
                </div>
              )}
            </div>
          ) : (
            <div className="mb-6 rounded-2xl border border-border bg-surface/30 p-5">
              <FilterBuilder filters={filters} onChange={setFilters} seededFrom={seed.seededFrom} />
              <div className="mt-5">
                <DiscoverBar canDiscover={canDiscover} onDiscover={discover} label={t.explore.discoverFree} />
              </div>
            </div>
          )}

          {isResults && firstRun && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-emerald-500" />
              <p className="text-[13px] leading-relaxed text-foreground">
                {t.explore.firstRunLead} <span className="text-emerald-600 dark:text-emerald-400">{t.explore.firstRunFree}</span> {t.explore.firstRunTail}
              </p>
            </div>
          )}

          {isResults && capHit && (
            <CappedBanner t={t} companiesScanned={companiesScanned} companiesAvailable={companiesAvailable} onRefine={() => setRefineOpen(true)} />
          )}
          {isResults && <ResultsList offers={enriched} />}

          {phase === "empty-current" && (
            <EmptyState
              tone="good"
              title={t.explore.emptyCurrentTitle}
              body={t.explore.emptyCurrentBody}
              note={scanNote}
              onRerun={() => {
                setFilters({ ...filters, sinceDays: Math.max(filters.sinceDays, 30) });
                void discover();
              }}
              rerunLabel={t.explore.emptyCurrentCta}
            />
          )}
          {phase === "empty-loose" && (
            <EmptyState
              tone="loose"
              title={t.explore.emptyLooseTitle}
              body={t.explore.emptyLooseBody}
              note={scanNote}
              onRerun={() => {
                setFilters({ ...filters, sinceDays: 30, block: [], allow: [] });
                void discover();
              }}
              rerunLabel={t.explore.emptyLooseCta}
            />
          )}
          {phase === "degraded" && (
            <DegradedCard
              t={t}
              onRetry={() => void discover()}
              companiesScanned={companiesScanned}
              companiesAvailable={companiesAvailable}
              capHit={capHit}
              droppedNoDate={droppedNoDate}
              partial={partial}
            />
          )}
          {phase === "failed" && <FailedCard t={t} msg={error || status} onRetry={() => void discover()} />}
        </>
      )}
    </div>
  );
}

function DiscoverBar({ canDiscover, onDiscover, label }: { canDiscover: boolean; onDiscover: () => void; label: string }) {
  const t = useT();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={!canDiscover}
        onClick={onDiscover}
        className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground shadow-sm transition-all hover:brightness-110 disabled:opacity-50 max-sm:min-h-[44px]"
      >
        <Compass className="size-4" /> {label}
      </button>
      <span className="inline-flex items-center gap-1.5 text-[12px] text-muted">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        {t.explore.discoverNeverCosts}
      </span>
    </div>
  );
}

function EmptyState({ tone, title, body, note, onRerun, rerunLabel }: { tone: "good" | "loose"; title: string; body: string; note?: string; onRerun: () => void; rerunLabel: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface/30 px-6 py-12 text-center">
      <div className={cn("mx-auto grid size-12 place-items-center rounded-full", tone === "good" ? "bg-emerald-500/12 text-emerald-500" : "bg-brand-soft text-brand")}>
        <Sparkles className="size-6" />
      </div>
      <h2 className={`${instrumentSerif.className} mt-4 text-2xl text-foreground`}>{title}</h2>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">{body}</p>
      {note && <p className="mx-auto mt-1 max-w-md text-[12px] text-faint">{note}</p>}
      <button onClick={onRerun} className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface/50 px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-brand/40 hover:text-brand">
        <RotateCcw className="size-4" /> {rerunLabel}
      </button>
    </div>
  );
}

function DegradedCard({
  t,
  onRetry,
  companiesScanned,
  companiesAvailable,
  capHit,
  droppedNoDate,
  partial,
}: {
  t: Dict;
  onRetry: () => void;
  companiesScanned: number;
  companiesAvailable: number;
  capHit: boolean;
  droppedNoDate: number;
  partial: boolean;
}) {
  // 0 results, but the scan was NOT a clean full search → never "all caught up".
  // Pick the most informative reason (authoritative when the scanner's --json mode
  // is available; otherwise the 0-companies fallback).
  let title = t.explore.degradedNoSourcesTitle;
  let body = t.explore.degradedNoSourcesBody;
  const ofTotal = companiesAvailable > companiesScanned ? companiesAvailable.toLocaleString() : null;
  if (companiesScanned > 0 && capHit) {
    title = t.explore.degradedCappedTitle;
    body = t.explore.degradedCappedBody(companiesScanned.toLocaleString(), ofTotal);
  } else if (companiesScanned > 0 && droppedNoDate > 0) {
    title = t.explore.degradedNoDateTitle;
    body = t.explore.degradedNoDateBody(droppedNoDate.toLocaleString(), droppedNoDate !== 1);
  } else if (companiesScanned > 0 && partial) {
    title = t.explore.degradedPartialTitle;
    body = t.explore.degradedPartialBody(companiesScanned.toLocaleString());
  }
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-center">
      <AlertTriangle className="mx-auto size-6 text-amber-500" />
      <p className="mt-2 text-sm font-medium text-foreground">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-[13px] text-muted">{body}</p>
      <button onClick={onRetry} className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-brand-soft px-3 py-1.5 text-sm font-medium text-brand">
        <RotateCcw className="size-4" /> {t.explore.retryScan}
      </button>
    </div>
  );
}

function CappedBanner({ t, companiesScanned, companiesAvailable, onRefine }: { t: Dict; companiesScanned: number; companiesAvailable: number; onRefine: () => void }) {
  // Results ARE present, but the scan was capped — tell the user there's more, so a
  // partial list never reads as "everything there is".
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-4 py-2.5 text-[13px]">
      <span className="text-foreground">
        {t.explore.cappedShowing(
          companiesScanned.toLocaleString(),
          companiesAvailable > companiesScanned ? companiesAvailable.toLocaleString() : null,
        )}
      </span>
      <button onClick={onRefine} className="font-medium text-brand hover:underline">
        {t.explore.raiseDepth}
      </button>
    </div>
  );
}

function FailedCard({ t, msg, onRetry }: { t: Dict; msg: string; onRetry: () => void }) {
  // The scanner-missing 400 (data-only / pre-scan-ats-full checkout) must NOT
  // offer a "Try again" that re-fails forever — give a real next step instead.
  const scannerMissing = /isn'?t available|data only|complete career-ops checkout|scanner/i.test(msg);
  if (scannerMissing) {
    return (
      <div className="rounded-2xl border border-border bg-surface/30 px-6 py-10 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-brand-soft text-brand">
          <Compass className="size-6" />
        </div>
        <h2 className={`${instrumentSerif.className} mt-4 text-2xl text-foreground`}>{t.explore.needsToolkitTitle}</h2>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">
          {t.explore.needsToolkitBody}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Link href="/pipeline" className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-brand-foreground transition hover:brightness-110">
            {t.explore.openPipeline}
          </Link>
          <Link href="/config" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-foreground transition hover:border-brand/40 hover:text-brand">
            {t.explore.openConfig}
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-center">
      <AlertTriangle className="mx-auto size-6 text-amber-500" />
      <p className="mt-2 text-sm font-medium text-foreground">{t.explore.failedTitle}</p>
      <p className="mt-1 text-[13px] text-muted">{msg}</p>
      <button onClick={onRetry} className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-brand-soft px-3 py-1.5 text-sm font-medium text-brand">
        <RotateCcw className="size-4" /> {t.explore.tryAgain}
      </button>
    </div>
  );
}

function BlockedCard({ t }: { t: Dict }) {
  return (
    <div className="rounded-2xl border border-border bg-surface/30 px-6 py-12 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-full bg-brand-soft text-brand">
        <Sparkles className="size-6" />
      </div>
      <h2 className={`${instrumentSerif.className} mt-4 text-2xl text-foreground`}>{t.explore.blockedTitle}</h2>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">
        {t.explore.blockedBody}
      </p>
      <Link href="/config" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-brand-foreground transition hover:brightness-110">
        <Settings className="size-4" /> {t.explore.openConfig}
      </Link>
    </div>
  );
}
