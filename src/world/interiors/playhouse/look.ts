import { getExhibit } from '../../../content/exhibits';
import type { ThemeColorKey } from '../../../content/types';
import type { SignSpec } from '../../kit/InteriorShell';
import type { InstanceItem } from '../../kit/instancing';
import type { BatchShape } from '../../kit/ShapeBatch';
import { propCollider, type InteriorSpec } from '../../logic/interior';
import type { Rect } from '../../types';

export const WIDTH = 18;
export const LENGTH = 20;
export const WALL_HEIGHT = 5;
/** Stage platform: front edge z -13.5, back wall z -20, 0.6 m high. */
export const STAGE = { z0: -13.5, z1: -20, h: 0.6 } as const;
export const PROSCENIUM = { z: -13.7, y: 4.5, columnX: 7.6 } as const;
export const SEATS = { rows: [-5, -7, -9] as const, x0: 1.6, pitch: 1.08, perRow: 6 } as const;
export const PLAYHOUSE_LOOK = { floor: 'cinemaRed', wall: 'ink', pilaster: 'mustard', stage: 'hardwood' } as const satisfies Record<string, ThemeColorKey>;

/** The content title shown on the marquee (the easel's exhibit marker label names it again, so the easel carries no caption). */
export function showTitle(): string {
  const e = getExhibit('stranger-things');
  if (!e) throw new Error('missing exhibit: stranger-things');
  return e.title;
}

export const SIGNS: readonly string[] = ['PLAYHOUSE', 'BOX OFFICE'];
export const TEXT_LINES: readonly string[] = [showTitle()];

export const SIGN_SPECS: readonly SignSpec[] = [
  { text: 'PLAYHOUSE', position: [-5, 0.95, -0.2], board: 'cinemaRed', size: 0.4 },
  { text: 'BOX OFFICE', position: [-8.85, 2.3, -3.6], rotationY: Math.PI / 2, board: 'mustard', size: 0.4 },
];

/** Playbill easel footprint (prop anchor of the content placement). */
export const EASEL: Rect = propCollider([0, -11], 1.9, 0.8);

const seatX = (side: -1 | 1, k: number) => side * (SEATS.x0 + k * SEATS.pitch);

export const COLLIDERS: Rect[] = [
  { x: 0, z: (STAGE.z0 + STAGE.z1) / 2, w: WIDTH, d: STAGE.z0 - STAGE.z1 },
  ...([-1, 1] as const).map((s) => ({ x: s * 4.3, z: -7, w: 5.9, d: 5 })),
  { x: -8.3, z: -3.4, w: 1.4, d: 2.4 },
  EASEL,
];

export const SPEC: InteriorSpec = {
  width: WIDTH,
  length: LENGTH,
  colliders: COLLIDERS,
  cameraDistance: 14,
  cameraSouthPad: 0.75,
};

export type BatchSpec = { key: string; shape: BatchShape; color: ThemeColorKey; glow?: number; outline?: boolean; items: InstanceItem[] };

function collect() {
  const map = new Map<string, BatchSpec>();
  const add = (shape: BatchShape, color: ThemeColorKey, item: InstanceItem, opts: { glow?: number; outline?: boolean } = {}) => {
    const key = `${shape}:${color}:${opts.glow ?? 0}:${opts.outline ? 1 : 0}`;
    let b = map.get(key);
    if (!b) map.set(key, (b = { key, shape, color, ...(opts.glow ? { glow: opts.glow } : {}), ...(opts.outline ? { outline: true } : {}), items: [] }));
    b.items.push(item);
  };
  const box = (c: ThemeColorKey, x: number, y: number, z: number, sx: number, sy: number, sz: number, opts?: { glow?: number; outline?: boolean }) =>
    add('box', c, { x, y, z, sx, sy, sz }, opts);
  return { map, add, box };
}

/** Every non-text solid in the Playhouse, one batch per shape/colour/glow/outline. */
export function buildBatches(): BatchSpec[] {
  const { map, box } = collect();
  const half = WIDTH / 2;
  // centre aisle runner from the door to the stage
  box('ink', 0, 0.012, -7, 2.4, 0.024, 13.4);
  // wall pilasters
  for (const s of [-1, 1]) for (let k = 0; k < 6; k++) box('mustard', s * (half - 0.25), WALL_HEIGHT / 2, -3 - k * 3.2, 0.5, WALL_HEIGHT, 0.6);
  // stage platform and apron lip
  box('hardwood', 0, STAGE.h / 2, (STAGE.z0 + STAGE.z1) / 2, WIDTH, STAGE.h, STAGE.z0 - STAGE.z1);
  box('mustard', 0, STAGE.h - 0.04, STAGE.z0 + 0.04, WIDTH, 0.08, 0.1);
  // proscenium arch: two columns and a lintel
  for (const s of [-1, 1]) box('mustard', s * PROSCENIUM.columnX, WALL_HEIGHT / 2, PROSCENIUM.z, 1.6, WALL_HEIGHT, 0.6);
  box('mustard', 0, PROSCENIUM.y + 0.1, PROSCENIUM.z, WIDTH, 1.0, 0.6);
  // backdrop
  box('ink', 0, 2.6, STAGE.z1 + 0.15, WIDTH - 0.4, 4.4, 0.2);
  // curtain: vertical red folds on both sides, drawn half way, hung from the lintel
  for (const s of [-1, 1]) {
    for (let k = 0; k < 7; k++) {
      const x = s * (PROSCENIUM.columnX - 0.9 - k * 0.55);
      box('cinemaRed', x, 2.4, PROSCENIUM.z - 0.7 - (k % 2) * 0.2, 0.5, 3.6, 0.3);
    }
  }
  // seats: three rows each side, instanced
  for (const s of [-1, 1] as const)
    for (const rz of SEATS.rows)
      for (let k = 0; k < SEATS.perRow; k++) {
        const x = seatX(s, k);
        box('brick', x, 0.3, rz, 0.8, 0.5, 0.8);
        box('brick', x, 0.75, rz - 0.36, 0.8, 0.7, 0.14);
      }
  // box office booth
  box('ink', -8.3, 0.55, -3.4, 1.4, 1.1, 2.4);
  box('mustard', -8.3, 1.14, -3.4, 1.5, 0.08, 2.5);
  // playbill easel: legs, board, header band (outlined: the interactive prop)
  const [ex, ez] = [EASEL.x, EASEL.z];
  box('ink', ex - 0.8, 0.6, ez - 0.15, 0.08, 1.2, 0.08, { outline: true });
  box('ink', ex + 0.8, 0.6, ez - 0.15, 0.08, 1.2, 0.08, { outline: true });
  box('offWhite', ex, 1.2, ez, 1.8, 1.4, 0.08, { outline: true });
  box('mustard', ex, 1.7, ez + 0.05, 1.8, 0.4, 0.04);
  // marquee board above the proscenium
  box('ink', 0, PROSCENIUM.y + 0.1, PROSCENIUM.z + 0.38, 7.4, 1.1, 0.2);
  box('offWhite', 0, PROSCENIUM.y + 0.1, PROSCENIUM.z + 0.5, 7.0, 0.8, 0.06);
  return [...map.values()];
}

/** Marquee bulb positions: a frame of bulbs around the board. */
export function marqueeBulbs(): InstanceItem[] {
  const out: InstanceItem[] = [];
  const z = PROSCENIUM.z + 0.5;
  const yc = PROSCENIUM.y + 0.1;
  const [hw, hh] = [3.7, 0.5];
  const d = 0.2;
  for (let i = 0; i <= 18; i++) {
    const x = -hw + (2 * hw * i) / 18;
    out.push({ x, y: yc + hh, z, sx: d, sy: d, sz: d }, { x, y: yc - hh, z, sx: d, sy: d, sz: d });
  }
  for (let j = 1; j < 3; j++) {
    const y = yc - hh + (2 * hh * j) / 3;
    out.push({ x: -hw, y, z, sx: d, sy: d, sz: d }, { x: hw, y, z, sx: d, sy: d, sz: d });
  }
  return out;
}

/** Marquee caption position. */
export const MARQUEE_CAPTION: [number, number, number] = [0, PROSCENIUM.y + 0.1, PROSCENIUM.z + 0.56];
