import type { Link, Station } from '../content';

export const SECTIONS = [
  { id: 'section-about', label: 'About' },
  { id: 'section-experience', label: 'Experience' },
  { id: 'section-projects', label: 'Projects' },
  { id: 'section-leadership', label: 'Leadership' },
  { id: 'section-education', label: 'Education' },
  { id: 'section-awards', label: 'Awards' },
  { id: 'section-off-the-clock', label: 'Off the clock' },
  { id: 'contact', label: 'Contact' },
] as const;

/** The link the whole card points at: the first one authored (live site, then repo, then write-up). */
export function primaryLink(s: Station): Link | undefined {
  return s.links[0];
}

/** Heading and sub line for an entry. Jobs read "Role · Company"; projects keep their name and show the event underneath. */
export function entryHeading(s: Station): { title: string; sub: string | null } {
  if (s.category === 'project') {
    return { title: s.title, sub: [s.org, s.role].filter(Boolean).join(' · ') || null };
  }
  const redundant = s.org === 'Across several roles' || s.title.includes(s.org);
  const title = redundant ? s.title : `${s.title} · ${s.org}`;
  const sub = s.role && s.role !== s.title ? s.role : null;
  return { title, sub };
}

const endKey = (s: Station) => (s.end === 'present' ? '9999-99' : s.end);

/** Newest first: ongoing roles, then latest end date, then latest start. Stable, returns a copy. */
export function sortByRecency(list: readonly Station[]): Station[] {
  return list
    .map((s, i) => ({ s, i }))
    .sort((a, b) => endKey(b.s).localeCompare(endKey(a.s)) || b.s.start.localeCompare(a.s.start) || a.i - b.i)
    .map((x) => x.s);
}

/** Which nav item is active, given the sections currently crossing the reading band. */
export function pickActive(order: readonly string[], visible: ReadonlySet<string>, prev: string, atEnd: boolean): string {
  if (atEnd) return order[order.length - 1];
  for (let i = order.length - 1; i >= 0; i--) if (visible.has(order[i])) return order[i];
  return prev || order[0];
}
