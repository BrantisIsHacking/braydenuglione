import { films } from '../../../content/films';
import type { Film, ThemeColorKey } from '../../../content/types';
import type { SignSpec } from '../../kit/InteriorShell';
import type { InstanceItem } from '../../kit/instancing';
import type { BatchShape } from '../../kit/ShapeBatch';
import type { InteriorSpec } from '../../logic/interior';

export const WIDTH = 20;
export const LENGTH = 46;
export const WALL_HEIGHT = 5.6;
export const HALL = { x: 3, z0: -9, z1: -27, wallH: 2.8, rowPitch: 3, firstRow: -10.5 } as const;
export const SEATS = { rows: 6, perSide: 9, z0: -30, pitch: 1.6, x0: 2.05, xPitch: 0.7 } as const;
/** The screen is raked back 46 degrees so the top-down camera can see all of it; its foot sits at (y 0.3, z -43.6). */
export const SCREEN = { z: -44.7, y: 1.4, width: 5.6, tilt: -0.8 } as const;
/** Poster blades hang from the hall walls facing south (the camera looks north), centred this far from the hall centre line. */
export const POSTER = { w: 1.3, h: 1.9, y: 1.5, cx: 2.25 } as const;

export const CINEMA_LOOK = { floor: 'slate', wall: 'brick' } as const satisfies Record<string, ThemeColorKey>;

export const SIGNS: readonly string[] = ['NOW SHOWING', 'TICKETS', 'CONCESSIONS', 'THEATER 1'];

export const SIGN_SPECS: readonly SignSpec[] = [
  { text: 'NOW SHOWING', position: [-6.5, 1.7, -8.85], board: 'cinemaRed' },
  { text: 'TICKETS', position: [-9.85, 2.3, -5], rotationY: Math.PI / 2, board: 'ink' },
  { text: 'CONCESSIONS', position: [9.85, 2.3, -5], rotationY: -Math.PI / 2, board: 'ink' },
  { text: 'THEATER 1', position: [0, 2.7, -27.15], board: 'cinemaRed' },
];

/** Hallway poster stops: film i hangs on row floor(i/2), left wall first, rows run north. */
export type PosterSlot = { index: number; film: Film; side: -1 | 1; row: number; zc: number; stop: [number, number] };
export function posterSlots(list: readonly Film[] = films): PosterSlot[] {
  return list.map((film, index) => {
    const row = Math.floor(index / 2);
    const side: -1 | 1 = index % 2 === 0 ? -1 : 1;
    const zc = HALL.firstRow - row * HALL.rowPitch;
    return { index, film, side, row, zc, stop: [side * 1.5, zc] as [number, number] };
  });
}
/** The only non-sign 3D text besides the screen label: film title and year, from content. */
export function posterLines(list: readonly Film[] = films): string[] {
  return list.map((f) => `${f.title}\n${f.year}`);
}

type Shape = { shape: BatchShape; color: ThemeColorKey; u: number; v: number; su: number; sv: number };
type Design = { bg: ThemeColorKey; shapes: Shape[] };
const S = (shape: BatchShape, color: ThemeColorKey, u: number, v: number, su: number, sv: number): Shape => ({ shape, color, u, v, su, sv });
/** Original colour-block posters, one per film in owner order. No studio art. */
export const POSTER_DESIGNS: readonly Design[] = [
  { bg: 'ink', shapes: [S('sphere', 'warmGlow', 0, 0.45, 1.0, 1.0), S('cone', 'slate', -0.35, -0.2, 0.7, 0.8), S('cone', 'slate', 0.4, -0.25, 0.6, 0.6)] },
  { bg: 'slate', shapes: [S('sphere', 'mustard', 0, 0.35, 0.9, 0.9), S('box', 'scarlet', -0.4, -0.3, 0.25, 0.9), S('box', 'scarlet', 0, -0.3, 0.25, 1.2), S('box', 'scarlet', 0.4, -0.3, 0.25, 0.7)] },
  { bg: 'cinemaRed', shapes: [S('box', 'ink', 0, -0.35, 1.5, 0.35), S('box', 'offWhite', 0, -0.35, 0.8, 0.05), S('sphere', 'offWhite', -0.35, 0.3, 0.55, 0.55), S('sphere', 'offWhite', 0.35, 0.3, 0.55, 0.55)] },
  { bg: 'ink', shapes: [S('sphere', 'warmGlow', 0.25, 0.5, 0.7, 0.7), S('cone', 'slate', -0.2, -0.1, 0.5, 0.7), S('cone', 'slate', 0.2, -0.1, 0.5, 0.7), S('box', 'slate', 0, -0.45, 0.8, 0.5)] },
  { bg: 'sky', shapes: [S('box', 'ink', -0.45, 0.15, 0.12, 1.5), S('box', 'ink', 0, 0.15, 0.12, 1.5), S('box', 'ink', 0.45, 0.15, 0.12, 1.5), S('sphere', 'offWhite', 0.3, 0.6, 0.35, 0.35)] },
  { bg: 'ink', shapes: [S('box', 'teal', -0.55, 0.2, 0.1, 1.2), S('box', 'teal', -0.25, 0.4, 0.1, 0.9), S('box', 'teal', 0.05, 0.1, 0.1, 1.4), S('box', 'teal', 0.35, 0.35, 0.1, 1.0), S('box', 'teal', 0.6, 0.0, 0.1, 1.3)] },
  { bg: 'fairway', shapes: [S('sphere', 'offWhite', 0.2, 0.3, 0.35, 0.35), S('box', 'path', -0.2, -0.35, 1.0, 0.25), S('cone', 'mustard', -0.4, 0.3, 0.3, 0.6)] },
  { bg: 'scarlet', shapes: [S('box', 'offWhite', -0.5, 0.15, 0.25, 1.6), S('box', 'offWhite', 0, 0.15, 0.25, 1.6), S('box', 'offWhite', 0.5, 0.15, 0.25, 1.6), S('sphere', 'ink', 0, 0.45, 0.55, 0.55)] },
  { bg: 'mustard', shapes: [S('sphere', 'brick', 0, 0.2, 1.1, 1.1), S('cone', 'ink', 0.45, -0.35, 0.4, 0.6)] },
  { bg: 'slate', shapes: [S('box', 'offWhite', -0.3, 0.55, 0.6, 0.2), S('box', 'stone', 0.1, 0.25, 0.9, 0.2), S('box', 'offWhite', -0.1, -0.05, 0.7, 0.2), S('box', 'stone', 0.3, -0.35, 0.5, 0.2)] },
  { bg: 'brick', shapes: [S('box', 'offWhite', 0, 0.35, 1.2, 0.18), S('sphere', 'ink', 0, 0.35, 0.8, 0.8), S('box', 'ink', 0, -0.2, 1.0, 0.15)] },
  { bg: 'ink', shapes: [S('cone', 'mustard', 0, 0.5, 0.8, 0.6), S('box', 'mustard', 0, 0.15, 1.0, 0.08), S('box', 'offWhite', 0, -0.25, 0.5, 0.5)] },
];

export type BatchSpec = { key: string; shape: BatchShape; color: ThemeColorKey; glow?: number; items: InstanceItem[] };

/** Every non-text solid in the cinema, grouped one batch per shape/colour/glow (one draw call each). */
export function buildBatches(): BatchSpec[] {
  const map = new Map<string, BatchSpec>();
  const add = (shape: BatchShape, color: ThemeColorKey, item: InstanceItem, glow?: number) => {
    const key = `${shape}:${color}:${glow ?? 0}`;
    let b = map.get(key);
    if (!b) map.set(key, (b = { key, shape, color, ...(glow ? { glow } : {}), items: [] }));
    b.items.push(item);
  };
  const box = (c: ThemeColorKey, x: number, y: number, z: number, sx: number, sy: number, sz: number, glow?: number) =>
    add('box', c, { x, y, z, sx, sy, sz }, glow);

  // hall walls, runner carpet from the entrance through the aisle
  for (const s of [-1, 1]) box('ink', s * 6.5, HALL.wallH / 2, (HALL.z0 + HALL.z1) / 2, 7, HALL.wallH, HALL.z0 - HALL.z1);
  box('cinemaRed', 0, 0.01, -22.5, 2.4, 0.02, 43);
  // poster blades face south (thin in z), one per stop, bracketed to the hall wall
  for (const p of posterSlots()) {
    const d = POSTER_DESIGNS[p.index];
    const cx = p.side * POSTER.cx;
    box('stone', cx, POSTER.y, p.zc - 0.03, POSTER.w + 0.16, POSTER.h + 0.16, 0.06);
    box(d.bg, cx, POSTER.y, p.zc + 0.01, POSTER.w, POSTER.h, 0.04);
    box('ink', cx, POSTER.y - 0.52, p.zc + 0.05, POSTER.w, 0.86, 0.04);
    box('stone', p.side * (HALL.x + POSTER.cx) / 2, 2.62, p.zc - 0.03, HALL.x - POSTER.cx + 0.2, 0.06, 0.06);
    for (const s of d.shapes) add(s.shape, s.color, { x: cx + s.u * (POSTER.w / 1.5), y: POSTER.y + s.v * (POSTER.h / 2.2), z: p.zc + 0.05, sx: s.su * (POSTER.w / 1.5), sy: s.sv * (POSTER.h / 2.2), sz: 0.04 });
  }
  // wall sconces between poster rows
  for (const s of [-1, 1]) for (let k = 0; k < 5; k++) box('warmGlow', s * (HALL.x - 0.08), 1.7, -12 - k * 3, 0.1, 0.45, 0.16, 1);
  // lobby floor tiles
  for (let i = 0; i < 12; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2 === 0) box('ink', -8.25 + i * 1.5, 0.008, -1.75 - j * 1.5, 1.5, 0.016, 1.5);
  // lobby: ticket counter (west), concession stand (east), rope posts
  for (const s of [-1, 1]) {
    box('ink', s * 9.0, 0.55, -5, 1.2, 1.1, 5);
    box('hardwood', s * 9.0, 1.14, -5, 1.4, 0.08, 5.2);
    add('cylinder', 'mustard', { x: s * 2.2, y: 0.45, z: -7.5, sx: 0.14, sy: 0.9, sz: 0.14 });
  }
  box('mustard', 9.0, 1.9, -3.8, 0.8, 1.4, 0.9);
  add('sphere', 'offWhite', { x: 9.0, y: 2.0, z: -3.8, sx: 0.7, sy: 0.7, sz: 0.7 });
  for (let k = 0; k < 4; k++) add('cylinder', k % 2 ? 'offWhite' : 'cinemaRed', { x: 9.0, y: 1.3, z: -5.4 - k * 0.6, sx: 0.3, sy: 0.3, sz: 0.3 });
  // auditorium: risers, seats, curtains, aisle lights, apron
  for (const s of [-1, 1]) {
    for (let r = 0; r < SEATS.rows; r++) {
      const rz = SEATS.z0 - r * SEATS.pitch;
      const h = 0.12 * (SEATS.rows - r);
      box('slate', s * 4.85, h / 2, rz, 6.3, h, SEATS.pitch);
      for (let k = 0; k < SEATS.perSide; k++) {
        const x = s * (SEATS.x0 + k * SEATS.xPitch);
        box('cinemaRed', x, h + 0.25, rz, 0.55, 0.4, 0.55);
        box('cinemaRed', x, h + 0.7, rz + 0.28, 0.55, 0.7, 0.12);
      }
    }
    box('cinemaRed', s * 5.1, 2.6, -45.6, 1.6, 5.0, 0.4);
    for (let r = 0; r < SEATS.rows + 1; r++) box('warmGlow', s * 1.25, 0.06, SEATS.z0 + 0.5 - r * SEATS.pitch, 0.1, 0.08, 0.2, 1);
  }
  return [...map.values()];
}

export const SPEC: InteriorSpec = {
  width: WIDTH,
  length: LENGTH,
  colliders: [
    { x: -6.5, z: -18, w: 7, d: 18 },
    { x: 6.5, z: -18, w: 7, d: 18 },
    { x: -9.0, z: -5, w: 1.4, d: 5.2 },
    { x: 9.0, z: -5, w: 1.4, d: 5.2 },
    { x: -4.85, z: -34, w: 6.3, d: 9.6 },
    { x: 4.85, z: -34, w: 6.3, d: 9.6 },
  ],
  cameraDistance: 15,
  cameraSouthPad: 0.75,
};
