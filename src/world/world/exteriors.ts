import type { BuildingId, ThemeColorKey } from '../../content/types';
import type { BatchShape } from '../kit/ShapeBatch';
import type { InstanceItem } from '../kit/instancing';
import { LOTS } from '../logic/layout';

/** One detail piece: x/y/z = centre, sx/sy/sz = size (unit shape scaled; cylinder/cone sx = diameter). */
export type ExteriorPart = { shape: BatchShape; x: number; y: number; z: number; sx: number; sy: number; sz: number; rotY?: number; color: ThemeColorKey; glow?: number };

type Styled = 'library' | 'cinema' | 'arcade' | 'record-store' | 'playhouse' | 'fan-shop' | 'golf-clubhouse';

export const EXTERIOR_ACCENTS: Record<Styled, readonly ThemeColorKey[]> = {
  library: ['brick', 'mustard'],
  cinema: ['cinemaRed', 'warmGlow'],
  arcade: ['teal', 'brick'],
  'record-store': ['warmGlow', 'brick'],
  playhouse: ['cinemaRed', 'mustard'],
  'fan-shop': ['rack', 'scarlet'],
  'golf-clubhouse': ['fairway', 'hardwood'],
};

/** Sign board / text look per building; undefined = district default. `glow` > 0 adds a neon underline part. */
export const SIGN_STYLE: Partial<Record<BuildingId, { board: ThemeColorKey; color: ThemeColorKey; glow?: number; size?: number }>> = {
  cinema: { board: 'offWhite', color: 'cinemaRed' },
  arcade: { board: 'ink', color: 'teal', glow: 1.3 },
};

export const box = (color: ThemeColorKey, x: number, y: number, z: number, sx: number, sy: number, sz: number, glow?: number): ExteriorPart =>
  ({ shape: 'box', color, x, y, z, sx, sy, sz, ...(glow ? { glow } : {}) });
export const cyl = (color: ThemeColorKey, x: number, y: number, z: number, d: number, h: number): ExteriorPart =>
  ({ shape: 'cylinder', color, x, y, z, sx: d, sy: h, sz: d });
export const cone = (color: ThemeColorKey, x: number, y: number, z: number, d: number, h: number): ExteriorPart =>
  ({ shape: 'cone', color, x, y, z, sx: d, sy: h, sz: d });

const TRI: Record<BatchShape, number> = { box: 12, cylinder: 80, cone: 40, sphere: 560 };
export function triCount(parts: readonly ExteriorPart[]): number {
  return parts.reduce((n, p) => n + TRI[p.shape], 0);
}

const range = (from: number, to: number, step: number): number[] => {
  const out: number[] = [];
  for (let v = from; v <= to + 1e-9; v += step) out.push(+v.toFixed(3));
  return out;
};
/** Alternating stripes across a width, centred at cx. */
function stripes(cx: number, width: number, n: number, a: ThemeColorKey, b: ThemeColorKey, y: number, z: number, sy: number, sz: number): ExteriorPart[] {
  const w = width / n;
  return range(0, n - 1, 1).map((i) => box(i % 2 === 0 ? a : b, cx - width / 2 + w * (i + 0.5), y, z, w, sy, sz));
}

function library(): ExteriorPart[] {
  const { x, z, w, d } = LOTS.library.rect;
  const S = z + d / 2;
  const out: ExteriorPart[] = [
    // entry canopy on two slim posts
    box('offWhite', x, 2.6, S + 0.4, 6, 0.18, 1.6),
    box('offWhite', x - 2.9, 1.3, S - 0.12, 0.18, 2.6, 0.2),
    box('offWhite', x + 2.9, 1.3, S - 0.12, 0.18, 2.6, 0.2),
    // three steps and rails
    box('stone', x, 0.08, S - 0.15, 3.2, 0.16, 0.3),
    box('stone', x, 0.16, S - 0.45, 3.0, 0.16, 0.3),
    box('stone', x, 0.24, S - 0.75, 2.8, 0.16, 0.3),
    box('slate', x - 1.7, 0.7, S - 0.45, 0.06, 0.06, 0.8),
    box('slate', x + 1.7, 0.7, S - 0.45, 0.06, 0.06, 0.8),
    box('slate', x - 1.7, 0.35, S - 0.15, 0.06, 0.7, 0.06),
    box('slate', x + 1.7, 0.35, S - 0.15, 0.06, 0.7, 0.06),
    // sloping brick plinth wall by the steps
    box('brick', x - 3.7, 0.45, S - 0.4, 1.4, 0.9, 0.5),
    box('brick', x + 3.7, 0.45, S - 0.4, 1.4, 0.9, 0.5),
    // door accent
    box('mustard', x, 2.45, S - 0.1, 2.5, 0.12, 0.1),
    // shrubs
    cone('grass', x - 2.4, 0.6, S - 0.4, 0.7, 1.1),
    cone('grass', x + 2.4, 0.6, S - 0.4, 0.7, 1.1),
  ];
  // window band: big panes with ink mullions (east and west of the entry)
  const panes = [-3.6, -2.4, 2.4, 3.6];
  for (const px of panes) out.push(box('sky', x + px, 1.9, S - 0.1, 1.0, 1.2, 0.1));
  for (const mx of [-4.2, -3.0, -1.8, 1.8, 3.0, 4.2]) out.push(box('ink', x + mx, 1.9, S - 0.09, 0.07, 1.3, 0.1));
  void w;
  return out;
}

function cinema(): ExteriorPart[] {
  const { x, z, w, d } = LOTS.cinema.rect;
  const S = z + d / 2;
  const out: ExteriorPart[] = [
    // glowing stacked arch around the entrance
    box('warmGlow', x - 1.55, 1.3, S - 0.1, 0.3, 2.6, 0.2, 1.2),
    box('warmGlow', x + 1.55, 1.3, S - 0.1, 0.3, 2.6, 0.2, 1.2),
    box('warmGlow', x, 2.75, S - 0.1, 3.4, 0.3, 0.2, 1.2),
    box('warmGlow', x, 3.05, S - 0.1, 2.5, 0.3, 0.2, 1.2),
    box('warmGlow', x, 3.35, S - 0.1, 1.5, 0.3, 0.2, 1.2),
    // white band for the sign
    box('offWhite', x, 4.7, S - 0.1, w - 0.3, 1.1, 0.1),
    // slatted canopy
    box('ink', x - 2.3, 3.85, S + 0.7, 0.1, 0.12, 1.4),
    box('ink', x + 2.3, 3.85, S + 0.7, 0.1, 0.12, 1.4),
    ...range(-2.2, 2.2, 0.44).map((sx) => box('ink', x + sx, 3.78, S + 0.7, 0.14, 0.08, 1.4)),
  ];
  // four poster windows: ink frame + flat colour block
  const fills: ThemeColorKey[] = ['cinemaRed', 'warmGlow', 'offWhite', 'cinemaRed'];
  [-3.9, -2.4, 2.4, 3.9].forEach((px, i) => {
    out.push(box('ink', x + px, 1.7, S - 0.1, 1.2, 1.9, 0.1), box(fills[i], x + px, 1.7, S - 0.05, 0.95, 1.6, 0.06));
  });
  return out;
}

function arcade(): ExteriorPart[] {
  const { x, z, w, d } = LOTS.arcade.rect;
  const S = z + d / 2;
  const out: ExteriorPart[] = [
    // west: bank body with four columns and a stepped pediment
    ...range(-4.55, -2.15, 0.8).map((cx) => cyl('offWhite', x + cx, 1.9, S - 0.45, 0.5, 3.8)),
    ...range(-4.55, -2.15, 0.8).map((cx) => box('offWhite', x + cx, 3.9, S - 0.45, 0.7, 0.2, 0.7)),
    box('offWhite', x - 3.1, 4.9, S - 0.4, 3.8, 0.28, 0.5),
    box('offWhite', x - 3.1, 5.18, S - 0.4, 2.8, 0.28, 0.4),
    box('offWhite', x - 3.1, 5.46, S - 0.4, 1.6, 0.28, 0.3),
    box('stone', x - 3.1, 0.1, S - 0.5, 3.8, 0.2, 0.7),
    // east: white and teal boardwalk facade
    box('teal', x + 2.45, 1.7, S - 0.09, 3.9, 3.2, 0.12),
    box('offWhite', x + 2.45, 0.35, S - 0.04, 3.9, 0.7, 0.06),
    box('offWhite', x + 2.45, 3.45, S - 0.04, 3.9, 0.2, 0.06),
    box('teal', x, 3.05, S - 0.09, 2.7, 1.1, 0.12),
    // glowing windows
    box('sky', x + 1.9, 1.7, S - 0.02, 1.0, 1.1, 0.04),
    box('sky', x + 3.3, 1.7, S - 0.02, 1.0, 1.1, 0.04),
    // neon underline beneath the sign
    box('teal', x, 2.75, S + 0.1, 2.1, 0.07, 0.05, SIGN_STYLE.arcade?.glow ?? 1),
    // marquee blade posts
    box('teal', x - 1.45, 1.3, S - 0.1, 0.12, 2.6, 0.2),
    box('teal', x + 1.45, 1.3, S - 0.1, 0.12, 2.6, 0.2),
  ];
  void w;
  return out;
}

function recordStore(): ExteriorPart[] {
  const { x, z, d } = LOTS['record-store'].rect;
  const S = z + d / 2;
  const out: ExteriorPart[] = [
    box('warmGlow', x, 2.75, S + 0.55, 6.4, 0.12, 1.3),
    ...stripes(x, 6.4, 8, 'warmGlow', 'brick', 2.5, S + 1.17, 0.35, 0.1),
    // display windows either side
    box('ink', x - 2.9, 1.4, S - 0.1, 2.1, 1.5, 0.1),
    box('sky', x - 2.9, 1.4, S - 0.05, 1.8, 1.2, 0.06),
    box('ink', x + 2.4, 1.4, S - 0.1, 1.7, 1.5, 0.1),
    box('sky', x + 2.4, 1.4, S - 0.05, 1.4, 1.2, 0.06),
    // crate sills
    box('brick', x - 2.9, 0.45, S - 0.25, 2.1, 0.5, 0.35),
    box('brick', x + 2.4, 0.45, S - 0.25, 1.7, 0.5, 0.35),
  ];
  return out;
}

function playhouse(): ExteriorPart[] {
  const { x, z, d } = LOTS.playhouse.rect;
  const S = z + d / 2;
  return [
    // marquee box (bulbs added by exteriorBulbs)
    box('mustard', x, 4.2, S - 0.2, 5.6, 1.1, 0.4),
    box('cinemaRed', x, 4.2, S + 0.01, 4.9, 0.7, 0.04),
    // red canopy over the door
    box('cinemaRed', x, 2.5, S + 0.5, 4.6, 0.16, 1.4),
    box('mustard', x, 2.38, S + 1.18, 4.6, 0.12, 0.06),
    // curtained windows
    box('cinemaRed', x - 3.1, 1.6, S - 0.1, 0.9, 1.6, 0.1),
    box('cinemaRed', x + 3.1, 1.6, S - 0.1, 0.9, 1.6, 0.1),
    box('mustard', x - 3.1, 2.5, S - 0.1, 1.1, 0.12, 0.12),
    box('mustard', x + 3.1, 2.5, S - 0.1, 1.1, 0.12, 0.12),
  ];
}

function fanShop(): ExteriorPart[] {
  const { x, z, d } = LOTS['fan-shop'].rect;
  const S = z + d / 2;
  const racks: ThemeColorKey[] = ['scarlet', 'offWhite', 'rack', 'scarlet'];
  return [
    box('rack', x, 2.7, S + 0.55, 5.6, 0.12, 1.3),
    ...stripes(x, 5.6, 8, 'scarlet', 'offWhite', 2.52, S + 1.17, 0.34, 0.1),
    box('ink', x - 2.6, 1.4, S - 0.1, 1.8, 1.5, 0.1),
    box('sky', x - 2.6, 1.4, S - 0.05, 1.5, 1.2, 0.06),
    box('ink', x + 2.6, 1.4, S - 0.1, 1.8, 1.5, 0.1),
    box('sky', x + 2.6, 1.4, S - 0.05, 1.5, 1.2, 0.06),
    // window racks: plain flat garment blocks
    ...[-3.1, -2.6, -2.1, 2.1, 2.6, 3.1].map((px, i) => box(racks[i % 4], x + px, 1.4, S - 0.02, 0.36, 0.7, 0.04)),
  ];
}

function golf(): ExteriorPart[] {
  const { x, z, d } = LOTS['golf-clubhouse'].rect;
  const S = z + d / 2;
  return [
    // porch deck, posts and overhanging roof
    box('hardwood', x, 0.1, S - 0.5, 7, 0.2, 1.0),
    box('hardwood', x - 3.3, 1.3, S - 0.15, 0.2, 2.6, 0.2),
    box('hardwood', x + 3.3, 1.3, S - 0.15, 0.2, 2.6, 0.2),
    box('hardwood', x, 2.75, S + 0.4, 7.4, 0.18, 1.6),
    box('fairway', x, 2.9, S + 1.15, 7.4, 0.12, 0.1),
    // windows
    box('ink', x - 2.1, 1.8, S - 0.1, 1.6, 1.2, 0.1),
    box('sky', x - 2.1, 1.8, S - 0.05, 1.3, 0.95, 0.06),
    box('ink', x + 2.1, 1.8, S - 0.1, 1.6, 1.2, 0.1),
    box('sky', x + 2.1, 1.8, S - 0.05, 1.3, 0.95, 0.06),
    // putting-green patch with one flag, east of the lot
    cyl('fairway', x + 7.4, 0.03, S - 2, 4.4, 0.04),
    cyl('grass', x + 7.4, 0.05, S - 2, 2.4, 0.04),
    cyl('ink', x + 7.4, 0.055, S - 2, 0.2, 0.03),
    cyl('slate', x + 7.4, 0.8, S - 2, 0.05, 1.5),
    box('offWhite', x + 7.4 + 0.2, 1.4, S - 2, 0.4, 0.26, 0.03),
  ];
}

const BUILDERS: Record<Styled, () => ExteriorPart[]> = {
  library, cinema, arcade, 'record-store': recordStore, playhouse, 'fan-shop': fanShop, 'golf-clubhouse': golf,
};
export const STYLED_IDS = Object.keys(BUILDERS) as Styled[];

export function exteriorParts(id: BuildingId): ExteriorPart[] {
  return id in BUILDERS ? BUILDERS[id as Styled]() : [];
}

/** Arcade door/facade bulbs and playhouse marquee bulbs, all lit together. */
export function exteriorBulbs(): InstanceItem[] {
  const a = LOTS.arcade.rect, p = LOTS.playhouse.rect;
  const aS = a.z + a.d / 2, pS = p.z + p.d / 2;
  const out: InstanceItem[] = [];
  const bulb = (x: number, y: number, z: number): InstanceItem => ({ x, y, z, sx: 0.16, sy: 0.16, sz: 0.16 });
  for (const bx of range(0.4, 4.4, 0.4)) out.push(bulb(a.x + bx, 3.52, aS - 0.02));
  for (const by of range(0.4, 2.4, 0.5)) out.push(bulb(a.x - 1.3, by, aS - 0.02), bulb(a.x + 1.3, by, aS - 0.02));
  for (const bx of range(-2.6, 2.6, 0.43)) out.push(bulb(p.x + bx, 4.72, pS + 0.05), bulb(p.x + bx, 3.68, pS + 0.05));
  for (const by of [4.2]) out.push(bulb(p.x - 2.7, by, pS + 0.05), bulb(p.x + 2.7, by, pS + 0.05));
  return out;
}
