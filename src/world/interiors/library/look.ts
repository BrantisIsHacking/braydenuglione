import { books } from '../../../content/books';
import type { Book, ThemeColorKey } from '../../../content/types';
import { titleSortKey } from '../../../ui/CollectionList';
import type { SignSpec } from '../../kit/InteriorShell';
import type { InstanceItem } from '../../kit/instancing';
import type { BatchShape } from '../../kit/ShapeBatch';
import { propAnchor, propCollider, type InteriorSpec } from '../../logic/interior';
import type { PlacedExhibit, Rect } from '../../types';

export const WIDTH = 22;
export const LENGTH = 20;
export const WALL_HEIGHT = 3.4;
export const LIBRARY_LOOK = { floor: 'stone', wall: 'offWhite' } as const satisfies Record<string, ThemeColorKey>;

/** Three tall units against the north wall, four shelves each. Capacity grows with the content (spines shrink only past ~32 per unit). */
export const SHELF = { units: 3, shelves: 4, innerW: 2.4, height: 2.6, pitch: 0.6, xs: [-6.5, 0, 6.5], z: -17.6, depth: 0.6 } as const;
/** Spine size ranges (metres) and colours; deterministic per title. */
export const SPINE = { wMin: 0.18, wMax: 0.3, hMin: 0.36, hMax: 0.5, gap: 0.02, pad: 0.04 } as const;
export const SPINE_COLORS: readonly ThemeColorKey[] = ['brick', 'mustard', 'teal', 'slate', 'sky'];

export const SIGNS: readonly string[] = ['LIBRARY', 'FAVORITES'];
/** Book table: ring at books `pos`, prop 1.6 m south. */
export const TABLE_POS: [number, number] = [0, -8];
export const TABLE = { w: 2.8, d: 1.2, h: 0.9 } as const;
const [TX, TZ] = propAnchor(TABLE_POS);

export const SIGN_SPECS: readonly SignSpec[] = [
  { text: 'LIBRARY', position: [0, 3.0, -19.85], board: 'brick' },
  { text: 'FAVORITES', position: [TX, 0.5, TZ + TABLE.d / 2 + 0.07], board: 'mustard', size: 0.35 },
];

export type Spine = { title: string; unit: 0 | 1 | 2; shelf: number; x: number; y: number; z: number; w: number; h: number; color: ThemeColorKey };

function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h;
}

/** Books in shelf order: alphabetical by `titleSortKey` (ties by exact title). */
export function shelfOrder(list: readonly Book[] = books): Book[] {
  return [...list].sort((a, b) => titleSortKey(a.title).localeCompare(titleSortKey(b.title)) || a.title.localeCompare(b.title));
}

/** Even split of n items into k parts, extras to the first parts. */
function split(n: number, k: number): number[] {
  return Array.from({ length: k }, (_, i) => Math.floor(n / k) + (i < n % k ? 1 : 0));
}

/** Every book on a shelf: three alphabetical runs, each spread evenly over four shelves, left to right. Empty space stays free for growth. */
export function shelfLayout(list: readonly Book[] = books): Spine[] {
  const sorted = shelfOrder(list);
  const out: Spine[] = [];
  let at = 0;
  split(sorted.length, SHELF.units).forEach((nu, u) => {
    const unitBooks = sorted.slice(at, at + nu);
    at += nu;
    let ui = 0;
    split(nu, SHELF.shelves).forEach((ns, s) => {
      const row = unitBooks.slice(ui, ui + ns);
      ui += ns;
      const raw = row.map((b) => {
        const h = hash(b.title);
        return { b, h, w: SPINE.wMin + ((h % 13) / 12) * (SPINE.wMax - SPINE.wMin), ht: SPINE.hMin + (((h >>> 4) % 15) / 14) * (SPINE.hMax - SPINE.hMin) };
      });
      const room = SHELF.innerW - 2 * SPINE.pad - SPINE.gap * Math.max(0, row.length - 1);
      const sum = raw.reduce((a, r) => a + r.w, 0);
      const k = sum > room ? room / sum : 1;
      let x = SHELF.xs[u] - SHELF.innerW / 2 + SPINE.pad;
      const boardTop = 0.1 + s * SHELF.pitch + 0.03;
      for (const r of raw) {
        const w = r.w * k;
        out.push({
          title: r.b.title, unit: u as 0 | 1 | 2, shelf: s, x: x + w / 2, y: boardTop + r.ht / 2, z: SHELF.z + 0.06, w, h: r.ht,
          color: SPINE_COLORS[(r.h >>> 8) % SPINE_COLORS.length],
        });
        x += w + SPINE.gap;
      }
    });
  });
  return out;
}

function letter(title: string): string {
  const c = titleSortKey(title).charAt(0);
  return /[a-z]/.test(c) ? c.toUpperCase() : '#';
}

export type UnitRange = { unit: number; first: string; last: string; label: string };
/** First/last title and letter-range label of each unit. */
export function unitRanges(list: readonly Book[] = books): UnitRange[] {
  const sorted = shelfOrder(list);
  let at = 0;
  return split(sorted.length, SHELF.units).map((n, unit) => {
    const run = sorted.slice(at, at + n);
    at += n;
    const first = run[0]?.title ?? '';
    const last = run[run.length - 1]?.title ?? '';
    return { unit, first, last, label: `${letter(first)}–${letter(last)}` };
  });
}

export function favoriteTitles(list: readonly Book[] = books): string[] {
  return list.filter((b) => b.favorite).map((b) => b.title);
}

/** The only non-sign 3D text: range labels and the favorites' titles, from content. */
export const TEXT_LINES: readonly string[] = [...unitRanges().map((r) => r.label), ...favoriteTitles()];

/** Shelf unit stops: each opens the books panel on the first title of its unit (focus is read at call time so content edits flow through). */
export function unitStops(list: readonly Book[] = books): PlacedExhibit[] {
  return unitRanges(list).map((r) => ({ id: 'books', pos: [SHELF.xs[r.unit], -16] as [number, number], focus: r.first }));
}
export const STOPS: PlacedExhibit[] = unitStops();

const CLUSTER_X = 7.4;
export const READING_COLLIDERS: Rect[] = [-1, 1].map((s) => ({ x: s * CLUSTER_X, z: -8, w: 3.6, d: 6 }));

export const SPEC: InteriorSpec = {
  width: WIDTH,
  length: LENGTH,
  colliders: [
    ...SHELF.xs.map((x) => ({ x, z: SHELF.z, w: SHELF.innerW + 0.4, d: SHELF.depth })),
    propCollider(TABLE_POS, TABLE.w, TABLE.d),
    ...READING_COLLIDERS,
  ],
  cameraDistance: 18,
  cameraSouthPad: 0.5,
};

export type BatchSpec = { key: string; shape: BatchShape; color: ThemeColorKey; glow?: number; items: InstanceItem[] };

/** Lightweight batch collector: one batch per shape / colour / glow. */
export function collector() {
  const map = new Map<string, BatchSpec>();
  const add = (shape: BatchShape, color: ThemeColorKey, item: InstanceItem, glow?: number) => {
    const key = `${shape}:${color}:${glow ?? 0}`;
    let b = map.get(key);
    if (!b) map.set(key, (b = { key, shape, color, ...(glow ? { glow } : {}), items: [] }));
    b.items.push(item);
  };
  const box = (c: ThemeColorKey, x: number, y: number, z: number, sx: number, sy: number, sz: number, glow?: number, rotY?: number) =>
    add('box', c, { x, y, z, sx, sy, sz, ...(rotY ? { rotY } : {}) }, glow);
  return { add, box, list: () => [...map.values()] };
}

/** Shelf frames (white), back panels, and the top boards. */
export function shelfBatches(): BatchSpec[] {
  const c = collector();
  for (const x of SHELF.xs) {
    const t = 0.08;
    const w = SHELF.innerW + 2 * t;
    c.box('offWhite', x - SHELF.innerW / 2 - t / 2, SHELF.height / 2, SHELF.z, t, SHELF.height, SHELF.depth);
    c.box('offWhite', x + SHELF.innerW / 2 + t / 2, SHELF.height / 2, SHELF.z, t, SHELF.height, SHELF.depth);
    for (let s = 0; s < SHELF.shelves; s++) c.box('offWhite', x, 0.1 + s * SHELF.pitch, SHELF.z, w, 0.06, SHELF.depth);
    c.box('offWhite', x, SHELF.height, SHELF.z, w + 0.1, 0.1, SHELF.depth + 0.06);
    c.box('stone', x, SHELF.height / 2, SHELF.z - SHELF.depth / 2 + 0.03, SHELF.innerW, SHELF.height, 0.04);
  }
  return c.list();
}

/** Spines grouped by colour: one draw call per colour. */
export function spineBatches(list: readonly Book[] = books): BatchSpec[] {
  const c = collector();
  for (const s of shelfLayout(list)) c.box(s.color, s.x, s.y, s.z, s.w, s.h, 0.36);
  return c.list();
}

/** Warm string lights draped between the shelf units, static. */
export function stringBulbs(): InstanceItem[] {
  const out: InstanceItem[] = [];
  const x0 = -9.5;
  const x1 = 9.5;
  const n = 30;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const x = x0 + (x1 - x0) * t;
    const swag = Math.abs(Math.sin(t * Math.PI * 3));
    out.push({ x, y: 3.05 - 0.28 * swag, z: -16.9, sx: 0.14, sy: 0.14, sz: 0.14 });
  }
  return out;
}

export type ArmchairSpec = { x: number; z: number; dir: -1 | 1 };
/** Four mustard armchairs, two per side, backs to the side walls. */
export function armchairs(): ArmchairSpec[] {
  return ([-1, 1] as const).flatMap((s) => [-6, -10].map((z) => ({ x: s * 8.4, z, dir: (-s) as -1 | 1 })));
}

/** Reading nooks: armchairs, side tables, wooden chairs and floor lamps. */
export function readingBatches(): BatchSpec[] {
  const c = collector();
  for (const a of armchairs()) {
    c.box('mustard', a.x, 0.3, a.z, 1.0, 0.45, 1.0);
    c.box('mustard', a.x - a.dir * 0.42, 0.75, a.z, 0.2, 0.85, 1.0);
    for (const dz of [-0.5, 0.5]) c.box('mustard', a.x, 0.5, a.z + dz, 1.0, 0.25, 0.14);
    c.box('brick', a.x + a.dir * 0.05, 0.57, a.z, 0.7, 0.1, 0.7);
  }
  for (const s of [-1, 1]) {
    c.box('hardwood', s * 8.4, 0.35, -8, 0.7, 0.7, 0.7);
    c.add('cylinder', 'hardwood', { x: s * 8.4, y: 0.72, z: -8, sx: 0.8, sy: 0.05, sz: 0.8 });
    // wooden chair facing the table
    const cx = s * 6.2;
    c.box('hardwood', cx, 0.45, -8, 0.6, 0.08, 0.6);
    c.box('hardwood', cx + s * 0.27, 0.85, -8, 0.06, 0.8, 0.6);
    for (const [dx, dz] of [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]]) c.box('hardwood', cx + dx, 0.22, -8 + dz, 0.06, 0.44, 0.06);
    // floor lamp
    c.add('cylinder', 'slate', { x: s * 10.3, y: 0.85, z: -4.2, sx: 0.07, sy: 1.7, sz: 0.07 });
    c.add('cylinder', 'warmGlow', { x: s * 10.3, y: 1.75, z: -4.2, sx: 0.5, sy: 0.4, sz: 0.5 }, 0.8);
    c.add('cylinder', 'slate', { x: s * 10.3, y: 0.03, z: -4.2, sx: 0.4, sy: 0.06, sz: 0.4 });
  }
  return c.list();
}

/** Carpet pattern: stone diamonds on the slate floor plus a brick rug under the favorites table. */
export function carpetBatches(): BatchSpec[] {
  const c = collector();
  for (let i = 0; i < 7; i++)
    for (let j = 0; j < 5; j++) {
      const x = -9 + i * 3;
      const z = -2.5 - j * 3.2;
      if (Math.abs(x) < 2.6 && z < -4 && z > -12) continue;
      c.box('slate', x, 0.012, z, 1.3, 0.01, 1.3, undefined, Math.PI / 4);
    }
  c.box('brick', TX, 0.02, TZ, 4.4, 0.02, 3.4);
  c.box('mustard', TX, 0.03, TZ, 4.0, 0.02, 3.0);
  return c.list();
}

/** Favorites table: top, legs, tiered riser and four standing book cards. */
export type Card = { title: string; x: number; y: number; z: number; h: number; color: ThemeColorKey };
export function favoriteCards(list: readonly Book[] = books): Card[] {
  const t = favoriteTitles(list);
  return t.map((title, i) => {
    const col = i % 2;
    const row = i < 2 ? 1 : 0;
    return { title, x: TX + (col ? 0.75 : -0.75), y: row ? 2.5 : 1.3, h: row ? 1.7 : 0.6, z: TZ + (row ? -0.3 : 0.3), color: i % 2 ? 'mustard' : 'brick' };
  });
}
export const CARD = { w: 1.3, h: 1.2, t: 0.08 } as const;
export function tableBatches(list: readonly Book[] = books): BatchSpec[] {
  const c = collector();
  c.box('hardwood', TX, TABLE.h - 0.04, TZ, TABLE.w, 0.08, TABLE.d);
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) c.box('hardwood', TX + dx * (TABLE.w / 2 - 0.1), (TABLE.h - 0.08) / 2, TZ + dz * (TABLE.d / 2 - 0.1), 0.12, TABLE.h - 0.08, 0.12);
  c.box('offWhite', TX, TABLE.h + 0.45, TZ - 0.5, 2.6, 0.9, 0.3);
  for (const k of favoriteCards(list)) {
    c.box(k.color, k.x, k.y, k.z, CARD.w, k.h, CARD.t);
    c.box('offWhite', k.x, k.y - k.h / 2 - 0.03, k.z, CARD.w * 0.9, 0.06, CARD.t * 3);
  }
  return c.list();
}
