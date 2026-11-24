import { exhibitsIn } from '../../content/exhibits';
import type { BuildingId } from '../../content/types';
import { DIST_WORLD } from '../logic/camera';
import { E2E_LANES, LOTS, MAP, doorTrigger, exitPose, spotPose, worldColliders, worldDoors } from '../logic/layout';
import { mulberry32 } from '../logic/rng';
import { exteriorParts } from './exteriors';
import { spotParts } from './spots';
import { SPAWN_POSE, type PlacedExhibit, type Rect, type SceneGeometry } from '../types';

export const SPOT_EXHIBITS: { building: BuildingId; id: string }[] = [
  { building: 'mailbox', id: 'contact' }, { building: 'chess-park', id: 'chess' }, { building: 'park', id: 'roundnet' },
];
export const PLAZA: Rect = { x: 0, z: 0, w: 24, d: 18 };
export const ROAD: Rect = { x: 0, z: -15, w: 4, d: 14 };
export const LOOP_INSET = 3, LOOP_WIDTH = 1.5;

export function sceneGeometry(): SceneGeometry {
  const exhibits: PlacedExhibit[] = SPOT_EXHIBITS.flatMap(({ building, id }) => {
    if (!exhibitsIn(building).some((p) => p.exhibit.id === id)) return [];
    const s = LOTS[building].spot!;
    return [{ id, pos: [s.x, s.z] as [number, number] }];
  });
  return { bounds: MAP, colliders: worldColliders(), doors: worldDoors(), exits: [], exhibits, entrance: SPAWN_POSE, cameraDistance: DIST_WORLD };
}

function circleHits(cx: number, cz: number, r: number, c: Rect): boolean {
  const dx = Math.max(Math.abs(cx - c.x) - c.w / 2, 0);
  const dz = Math.max(Math.abs(cz - c.z) - c.d / 2, 0);
  return dx * dx + dz * dz < r * r;
}

/** True when a prop circle blocks a collider, door trigger, e2e lane, exit/spot approach or the spawn. */
export function propBlocked(x: number, z: number, r = 0.6): boolean {
  if (circleHits(x, z, r, { x: SPAWN_POSE.x, z: SPAWN_POSE.z, w: 2, d: 2 })) return true;
  if (worldColliders().some((c) => circleHits(x, z, r, c))) return true;
  if (worldDoors().some((t) => circleHits(x, z, r, t.rect))) return true;
  if (E2E_LANES.some((c) => circleHits(x, z, r, c))) return true;
  for (const l of Object.values(LOTS)) {
    const p = l.door ? exitPose(l.id) : spotPose(l.id);
    if (Math.hypot(p.x - x, p.z - z) < r + 0.9) return true;
    if (circleHits(x, z, r, doorTrigger(l))) return true;
  }
  return false;
}

function onPath(x: number, z: number): boolean {
  const px = Math.abs(x), pz = Math.abs(z);
  if (px < PLAZA.w / 2 + 0.8 && pz < PLAZA.d / 2 + 0.8) return true;
  if (Math.abs(x - ROAD.x) < ROAD.w / 2 + 1 && z > ROAD.z - ROAD.d / 2 - 1 && z < ROAD.z + ROAD.d / 2 + 1) return true;
  return Math.min(MAP.maxX - px, MAP.maxZ - pz) < LOOP_INSET + LOOP_WIDTH / 2 + 1.2;
}

/** Ground decals (putting green, park grass): trees stay off them. */
function decalRects(): Rect[] {
  return [...exteriorParts('golf-clubhouse'), ...spotParts('park')]
    .filter((p) => p.sy <= 0.06 && p.sx > 1)
    .map((p) => ({ x: p.x, z: p.z, w: p.sx, d: p.sz }));
}

export function treePositions(count = 40): [number, number][] {
  const rnd = mulberry32(29);
  const out: [number, number][] = [];
  const decals = decalRects();
  for (let tries = 0; out.length < count && tries < 5000; tries++) {
    const x = MAP.minX + rnd() * (MAP.maxX - MAP.minX), z = MAP.minZ + rnd() * (MAP.maxZ - MAP.minZ);
    if (propBlocked(x, z, 1.2) || onPath(x, z) || decals.some((c) => circleHits(x, z, 1.2, c))) continue;
    if (out.some(([a, b]) => Math.hypot(a - x, b - z) < 4)) continue;
    out.push([+x.toFixed(2), +z.toFixed(2)]);
  }
  return out;
}

const LAMP_CANDIDATES: [number, number][] = [
  [-2.8, -10], [2.8, -10], [-2.8, -14], [2.8, -14], [-2.8, -18], [2.8, -18], [-2.8, -21.5], [2.8, -21.5],
  [-10, 5], [10, 5], [-6, 7], [6, 7], [-10.5, -7.5], [10.5, -7.5], [-14, 3], [14, 3],
  [16, 6], [-16, 6], [0, 8], [-4, -8],
];
export function lampPositions(count = 16): [number, number][] {
  return LAMP_CANDIDATES.filter(([x, z]) => !propBlocked(x, z)).slice(0, count);
}
