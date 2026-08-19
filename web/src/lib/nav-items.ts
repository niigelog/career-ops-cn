import { LayoutDashboard, Compass, ListChecks, Send, Radar, BarChart3, FileText, Settings } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import type { Dict } from "@/lib/i18n";

// Single source of truth for the app's primary destinations — shared by the
// desktop sidebar and the mobile nav so they can never drift. Labels are dict
// KEYS, not text: the nav renders `t.nav[labelKey]`, so a new destination is
// translated by construction (a key with no catalog entry fails typecheck).
export type NavLabelKey = Extract<
  keyof Dict["nav"],
  "today" | "explore" | "pipeline" | "followups" | "portals" | "analytics" | "cv" | "config"
>;

export type NavItem = {
  href: string;
  labelKey: NavLabelKey;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  chipKey?: Extract<keyof Dict["nav"], "chipNew">;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", labelKey: "today", icon: LayoutDashboard },
  { href: "/explore", labelKey: "explore", icon: Compass, chipKey: "chipNew" },
  { href: "/pipeline", labelKey: "pipeline", icon: ListChecks },
  { href: "/followups", labelKey: "followups", icon: Send },
  { href: "/portals", labelKey: "portals", icon: Radar },
  { href: "/analytics", labelKey: "analytics", icon: BarChart3 },
  { href: "/cv", labelKey: "cv", icon: FileText },
  { href: "/config", labelKey: "config", icon: Settings },
];

export function isActivePath(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
