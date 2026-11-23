import { mulberry32 } from '../../../logic/rng';

export { mulberry32 };

export type Box = { x: number; y: number; z: number; w: number; h: number; d: number };
export type Seat = { x: number; y: number; z: number; rotY: number; tint: number; phase: number };
export type Slot = { x: number; y: number; z: number; rotY: number };

export const STAND = { rows: 6, rowDepth: 0.9, rise: 0.55, seatGap: 0.6, sideZ0: 12.5, sideHalfX: 15, endX0: 17.5, endHalfZ: 9, gap: [-7.6, -4.4] } as const;
export const CROWD_SEED = 29, CROWD_OCCUPANCY = 0.1, CROWD_MAX = 120;
export const BANNER = { w: 2.2, h: 2.2, spacing: 2.6, x: 22.9, topY: 9.4 } as const;
export const JUMBOTRON = { x: 23.2, y: 5.4, z: 0, w: 7, h: 3, d: 0.6 } as const;
export const END_WALL_X = 23.8, SIDE_WALL_Z = 18.6, SOUTH_WALL_X = -17.5;

const DEFAULT_WEIGHTS = [0.4, 0.25, 0.25, 0.1] as const;

type Block = Box & { rotY: number; axis: 'x' | 'z'; row: number };
export type StandBlock = Box & { row: number };

function blocks(): Block[] {
  const { rows, rowDepth, rise, sideZ0, sideHalfX, endX0, endHalfZ, gap } = STAND;
  const out: Block[] = [];
  const segs: Array<[number, number]> = [[-sideHalfX, gap[0]], [gap[1], sideHalfX]];
  for (let r = 0; r < rows; r++) {
    const h = (r + 1) * rise;
    const off = sideZ0 + r * rowDepth + rowDepth / 2;
    for (const [a, b] of segs) out.push({ x: (a + b) / 2, y: h / 2, z: off, w: b - a, h, d: rowDepth, rotY: Math.PI / 2, axis: 'x', row: r });
    out.push({ x: 0, y: h / 2, z: -off, w: sideHalfX * 2, h, d: rowDepth, rotY: -Math.PI / 2, axis: 'x', row: r });
    const ex = endX0 + r * rowDepth + rowDepth / 2;
    out.push({ x: ex, y: h / 2, z: 0, w: rowDepth, h, d: endHalfZ * 2, rotY: -Math.PI, axis: 'z', row: r });
    // no stands on the local -x end (scene south): the dollhouse cut-away
  }
  return out;
}

export function standBlocks(): StandBlock[] {
  return blocks().map(({ x, y, z, w, h, d, row }) => ({ x, y, z, w, h, d, row }));
}

export function crowdLayout(seed: number = CROWD_SEED, occupancy: number = CROWD_OCCUPANCY, weights: readonly number[] = DEFAULT_WEIGHTS): Seat[] {
  const rnd = mulberry32(seed);
  const total = weights.reduce((s, w) => s + w, 0);
  const out: Seat[] = [];
  for (const b of blocks()) {
    const len = b.axis === 'x' ? b.w : b.d;
    const n = Math.floor(len / STAND.seatGap + 1e-9);
    const start = -len / 2 + (len - n * STAND.seatGap) / 2 + STAND.seatGap / 2;
    for (let i = 0; i < n; i++) {
      const keep = rnd() < occupancy;
      let pick = rnd() * total;
      let tint = weights.length - 1;
      for (let k = 0; k < weights.length; k++) {
        if (pick < weights[k]) {
          tint = k;
          break;
        }
        pick -= weights[k];
      }
      const phase = rnd() * Math.PI * 2;
      if (!keep) continue;
      const o = start + i * STAND.seatGap;
      out.push({
        x: b.axis === 'x' ? b.x + o : b.x,
        y: b.h,
        z: b.axis === 'x' ? b.z : b.z + o,
        rotY: b.rotY,
        tint,
        phase,
      });
    }
  }
  return out.slice(0, CROWD_MAX);
}

export function bannerSlots(n: number): Slot[] {
  return Array.from({ length: n }, (_, i) => ({
    x: BANNER.x,
    y: BANNER.topY - BANNER.h / 2,
    z: (i - (n - 1) / 2) * BANNER.spacing,
    rotY: -Math.PI / 2,
  }));
}
