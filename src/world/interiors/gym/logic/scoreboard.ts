import type { Profile, Station } from '../../../../content/types';
import { toFontSafe } from '../../../logic/fontSafe';

export const JUMBO_STAT_IDS = ['tranquility-base', 'zayi-ai-studio', 'airbnb-classifier', 'dreams-come-true'] as const;
export const JUMBO_PERIOD_S = 6;

export function jumbotronHeader(p: Profile): string {
  return toFontSafe(`${p.name.toUpperCase()} #${p.jersey}`);
}

export function jumbotronLines(list: readonly Station[], ids: readonly string[] = JUMBO_STAT_IDS): string[] {
  const out: string[] = [];
  for (const id of ids) {
    const s = list.find((x) => x.id === id);
    if (!s || !s.stat) continue;
    out.push(`${toFontSafe(s.title.toUpperCase())}\n${toFontSafe(s.stat.value)} ${toFontSafe(s.stat.label)}`);
  }
  return out;
}

export function jumbotronIndex(t: number, n: number, period: number = JUMBO_PERIOD_S): number {
  if (n <= 0) return -1;
  if (!Number.isFinite(t) || t < 0) return 0;
  return Math.floor(t / period) % n;
}

export function wordmark(p: Profile): string {
  const last = p.name.trim().split(/\s+/).pop() ?? '';
  return toFontSafe(`${last.toUpperCase()} '${String(p.jersey).padStart(2, '0')}`);
}

export function scoreboardLines(list: readonly Station[]): string[] {
  return [
    'CAREER\n112 PTS / 26 GAMES',
    '2024–25\n84 PTS / 20 GAMES',
    '2023–24\n28 PTS / 6 GAMES',
    'CAREER HIGH\n12 PTS',
    ...jumbotronLines(list),
  ];
}
