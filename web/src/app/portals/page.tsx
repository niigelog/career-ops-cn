import { Radar } from "lucide-react";
import { PortalsView } from "@/components/portals-view";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function PortalsPage() {
  const t = await getT();
  return (
    <div className="mx-auto max-w-none px-6 py-8">
      <div className="flex items-center gap-3">
        <Radar className="size-6 text-brand" />
        <h1 className="font-display text-2xl tracking-tight text-landing">{t.portals.title}</h1>
      </div>
      <p className="mt-1.5 max-w-xl text-sm text-muted">
        {t.portals.intro}
      </p>
      <p className="mt-1.5 text-xs text-faint">
        {t.portals.backedByLead} <code className="text-muted">portals.yml</code> {t.portals.backedByTail}
      </p>
      <div className="mt-6">
        <PortalsView />
      </div>
    </div>
  );
}
