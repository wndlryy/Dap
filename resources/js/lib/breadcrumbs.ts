import type { NavItem } from "@/components/nav-items";

export type Crumb = { title: string; url?: string };

const titleCase = (s: string) =>
  decodeURIComponent(s)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export function buildTrail(items: NavItem[], currentUrl: string): Crumb[] {
  // Inertia's page.url includes the query string and hash, so strip them
  const pathname = currentUrl.split("?")[0].split("#")[0];

  const candidates: { trail: Crumb[]; url: string }[] = [];

  for (const item of items) {
    if (item.url !== "#") {
      candidates.push({
        trail: [{ title: item.title, url: item.url }],
        url: item.url,
      });
    }
    for (const sub of item.items ?? []) {
      candidates.push({
        trail: [{ title: item.title }, { title: sub.title, url: sub.url }],
        url: sub.url,
      });
    }
  }

  // Longest matching URL wins (handles /orders vs /orders/123)
  const match = candidates
    .filter((c) => pathname === c.url || pathname.startsWith(c.url + "/"))
    .sort((a, b) => b.url.length - a.url.length)[0];

  if (!match) return [];

  // Extra segments beyond the nav URL, e.g. /orders/123/edit -> "123", "Edit"
  const extras: Crumb[] = pathname
    .slice(match.url.length)
    .split("/")
    .filter(Boolean)
    .map((seg) => ({ title: titleCase(seg) }));

  return [...match.trail, ...extras];
}