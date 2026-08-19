// The cost-honesty taxonomy — a single source for the FREE vs $ boundary that the
// Explorer teaches by repetition. Discovery (finding roles) is structurally free:
// it calls no LLM. Only evaluation (scoring a role against your CV) spends tokens,
// and only when the user chooses it. The framing is always local-first: "your key,
// your AI, your machine."

export type CostClass = "free" | "free-network" | "spend" | "free-gemini";

// Copy lives in the i18n catalog (t.cost.*); this maps each class to its keys so
// the taxonomy above stays the single source of truth for the FREE/$ boundary.
export const COST_KEYS: Record<CostClass, { label: "free" | "spend" | "freeGemini"; tip: "freeNetworkTip" | "freeTip" | "spendTip" | "freeGeminiTip" }> = {
  "free-network": { label: "free", tip: "freeNetworkTip" },
  free: { label: "free", tip: "freeTip" },
  spend: { label: "spend", tip: "spendTip" },
  "free-gemini": { label: "freeGemini", tip: "freeGeminiTip" },
};
