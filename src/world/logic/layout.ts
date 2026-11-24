import { buildings } from '../../content/buildings';
import type { BuildingId } from '../../content/types';
import { NORTH, SOUTH, type Bounds, type Pose, type Rect, type Trigger } from '../types';

export const MAP: Bounds = { minX: -48, maxX: 48, minZ: -40, maxZ: 40 };
export type Lot = { id: BuildingId; rect: Rect; door: { x: number; z: number } | null; spot: { x: number; z: number } | null };

export const DOOR_W = 2.4, DOOR_D = 0.9, DOOR_EXIT_OFFSET = 1.5, SPOT_APPROACH = 1.5;
export const FOUNTAIN: Rect = { x: 0, z: 3.5, w: 3, d: 3 };

const R = (x: number, z: number, w: number, d: number): Rect => ({ x, z, w, d });
const door = (r: Rect) => ({ x: r.x, z: r.z + r.d / 2 });
const spot = (r: Rect) => ({ x: r.x, z: r.z });
const building = (id: BuildingId, rect: Rect): Lot => ({ id, rect, door: door(rect), spot: null });
const spotLot = (id: BuildingId, rect: Rect): Lot => ({ id, rect, door: null, spot: spot(rect) });

const table: Lot[] = [
  building('scouting-office', R(-8, -4, 6, 5)),
  building('hall-of-fame', R(8, -4, 7, 5)),
  spotLot('mailbox', R(3, 6, 0.8, 0.8)),
  building('campus-quad', R(-30, -28, 12, 8)),
  building('hq-tower', R(-12, -28, 8, 8)),
  building('civic-center', R(12, -28, 10, 8)),
  building('workshop', R(30, -28, 10, 8)),
  building('library', R(-36, -12, 10, 7)),
  building('playhouse', R(-20, -12, 8, 6)),
  building('cinema', R(-38, 4, 10, 7)),
  building('record-store', R(-34, 18, 8, 6)),
  building('arcade', R(-24, 30, 10, 6)),
  building('gym', R(20, -12, 14, 10)),
  building('fan-shop', R(38, -12, 8, 6)),
  spotLot('chess-park', R(22, 4, 1.2, 1.2)),
  spotLot('park', R(36, 4, 1, 1)),
  building('golf-clubhouse', R(28, 22, 10, 6)),
  spotLot('running-loop', R(6, 34, 0.4, 0.4)),
];
export const LOTS = Object.fromEntries(table.map((l) => [l.id, l])) as Record<BuildingId, Lot>;

export const E2E_LANES: Rect[] = [R(10, 0, 22, 3), R(20, -3.5, 3, 7), R(-4, 0, 10, 3)];

export function doorTrigger(lot: Lot): Rect {
  const d = lot.door ?? { x: lot.rect.x, z: lot.rect.z + lot.rect.d / 2 };
  return { x: d.x, z: d.z + DOOR_D / 2, w: DOOR_W, d: DOOR_D };
}

export function spotPose(id: BuildingId): Pose {
  const l = LOTS[id];
  const s = l.spot ?? { x: l.rect.x, z: l.rect.z };
  return { x: s.x, z: s.z + l.rect.d / 2 + SPOT_APPROACH, heading: NORTH };
}

export function exitPose(id: BuildingId): Pose {
  const l = LOTS[id];
  if (l.door) return { x: l.door.x, z: l.door.z + DOOR_EXIT_OFFSET, heading: SOUTH };
  return spotPose(id);
}

/** Park furniture that must block walking: chess-park benches and hedges, the roundnet bench. Mirrors world/spots.ts parts. */
export const DECOR_COLLIDERS: Rect[] = [
  R(20.7, 4, 0.5, 1.4), R(23.3, 4, 0.5, 1.4),
  R(22, 2.7, 4.4, 0.5), R(19.8, 4.025, 0.5, 2.15), R(24.2, 4.025, 0.5, 2.15),
  R(38.3, 4, 0.5, 1.4),
];

export function worldColliders(): Rect[] {
  return [...table.map((l) => l.rect), FOUNTAIN, ...DECOR_COLLIDERS];
}

export function worldDoors(): Trigger[] {
  const kindOf = new Map(buildings.map((b) => [b.id, b.kind]));
  return table
    .filter((l) => l.door && kindOf.get(l.id) !== 'spot')
    .map((l) => ({ id: l.id, rect: doorTrigger(l) }));
}

function circleHitsRect(cx: number, cz: number, r: number, c: Rect): boolean {
  const dx = Math.max(Math.abs(cx - c.x) - c.w / 2, 0);
  const dz = Math.max(Math.abs(cz - c.z) - c.d / 2, 0);
  return dx * dx + dz * dz < r * r;
}

export function reachable(
  from: { x: number; z: number },
  targets: { x: number; z: number }[],
  colliders: readonly Rect[],
  bounds: Bounds,
  cell = 0.5,
  radius = 0.4,
): boolean[] {
  const nx = Math.floor((bounds.maxX - bounds.minX) / cell) + 1;
  const nz = Math.floor((bounds.maxZ - bounds.minZ) / cell) + 1;
  const cx = (i: number) => bounds.minX + i * cell;
  const cz = (j: number) => bounds.minZ + j * cell;
  const free = new Uint8Array(nx * nz);
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const x = cx(i), z = cz(j);
      if (x - radius < bounds.minX || x + radius > bounds.maxX || z - radius < bounds.minZ || z + radius > bounds.maxZ) continue;
      if (colliders.some((c) => circleHitsRect(x, z, radius, c))) continue;
      free[j * nx + i] = 1;
    }
  }
  const nearest = (p: { x: number; z: number }) => {
    const i = Math.min(nx - 1, Math.max(0, Math.round((p.x - bounds.minX) / cell)));
    const j = Math.min(nz - 1, Math.max(0, Math.round((p.z - bounds.minZ) / cell)));
    return { i, j };
  };
  // free cell nearest to a point: search expanding rings
  const nearestFree = (p: { x: number; z: number }): number => {
    const { i, j } = nearest(p);
    let best = -1, bestD = Infinity;
    const maxR = Math.max(nx, nz);
    for (let r = 0; r <= maxR; r++) {
      for (let dj = -r; dj <= r; dj++) {
        for (let di = -r; di <= r; di++) {
          if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
          const ii = i + di, jj = j + dj;
          if (ii < 0 || jj < 0 || ii >= nx || jj >= nz || !free[jj * nx + ii]) continue;
          const d = (cx(ii) - p.x) ** 2 + (cz(jj) - p.z) ** 2;
          if (d < bestD) { bestD = d; best = jj * nx + ii; }
        }
      }
      if (best >= 0 && r * cell > Math.sqrt(bestD)) break;
    }
    return best;
  };
  const visited = new Uint8Array(nx * nz);
  const start = nearestFree(from);
  if (start >= 0) {
    const queue = [start];
    visited[start] = 1;
    for (let h = 0; h < queue.length; h++) {
      const k = queue[h], i = k % nx, j = (k - i) / nx;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ii = i + di, jj = j + dj;
        if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) continue;
        const n = jj * nx + ii;
        if (free[n] && !visited[n]) { visited[n] = 1; queue.push(n); }
      }
    }
  }
  return targets.map((t) => { const k = nearestFree(t); return k >= 0 && visited[k] === 1; });
}

