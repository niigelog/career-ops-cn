import { ChevronDown, ExternalLink } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import type { Dict } from "@/lib/i18n";

// Transparency = our differentiator ("why it's a 4.0 for YOU"). The wording is
// the CANONICAL public text from career-ops.org/methodology + /docs — rendered
// verbatim, NOT a web reinterpretation of the rubric (whose weights live in the
// core, modes/_shared.md). Native <details> → no client JS.

const dimensions = (t: Dict): [string, string][] => [
  [t.methodology.dimMatch, t.methodology.dimMatchBody],
  [t.methodology.dimNorthStar, t.methodology.dimNorthStarBody],
  [t.methodology.dimComp, t.methodology.dimCompBody],
  [t.methodology.dimCulture, t.methodology.dimCultureBody],
  [t.methodology.dimRedFlags, t.methodology.dimRedFlagsBody],
  [t.methodology.dimOverall, t.methodology.dimOverallBody],
];

// The block LETTERS are the report's own section keys (Blocks A–G in
// modes/oferta.md) — never translated; only the description moves.
const blocks = (t: Dict): [string, string][] => [
  ["A", t.methodology.blockA],
  ["B", t.methodology.blockB],
  ["C", t.methodology.blockC],
  ["D", t.methodology.blockD],
  ["E", t.methodology.blockE],
  ["F", t.methodology.blockF],
  ["G", t.methodology.blockG],
];

export async function ScoreMethodology() {
  const t = await getT();
  const DIMENSIONS = dimensions(t);
  const BLOCKS = blocks(t);
  return (
    <details className="group mt-10 overflow-hidden rounded-2xl border border-border bg-surface/30">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors hover:bg-surface-hover">
        {t.methodology.summary} <span className="text-landing">{t.methodology.summaryYou}</span>
        <ChevronDown className="ml-auto size-4 text-faint transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-5 border-t border-border px-5 py-4 text-sm">
        <p className="text-muted">
          {t.methodology.introLead} <strong className="text-foreground">{t.methodology.introRange}</strong>{" "}
          {t.methodology.introMid} <strong className="text-brand">{t.methodology.introLine}</strong>{" "}
          {t.methodology.introTail}
        </p>
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-faint">{t.methodology.dimensionsTitle}</div>
          <ul className="space-y-1.5">
            {DIMENSIONS.map(([k, v]) => (
              <li key={k}>
                <span className="font-medium text-foreground">{k}</span> <span className="text-muted">— {v}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-faint">{t.methodology.blocksTitle}</div>
          <ul className="space-y-2">
            {BLOCKS.map(([k, v]) => (
              <li key={k} className="flex items-start gap-2.5">
                <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded bg-brand-soft text-xs font-semibold text-brand">
                  {k}
                </span>
                <span className="text-muted">{v}</span>
              </li>
            ))}
          </ul>
        </div>
        <a
          href="https://career-ops.org/methodology"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-brand transition-colors hover:underline"
        >
          {t.methodology.fullMethodology} <ExternalLink className="size-3" />
        </a>
      </div>
    </details>
  );
}
