export const VISITED_KEY = 'arena.visited.v1';
const MAX = 24;

export function safeLocalStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function loadVisited(storage: Storage | null, validIds: ReadonlySet<string>): string[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(VISITED_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out: string[] = [];
    for (const v of parsed) {
      if (typeof v === 'string' && validIds.has(v) && !out.includes(v)) out.push(v);
      if (out.length >= MAX) break;
    }
    return out;
  } catch {
    return [];
  }
}

export function saveVisited(storage: Storage | null, ids: readonly string[]): void {
  if (!storage) return;
  try {
    storage.setItem(VISITED_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}
