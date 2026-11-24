import { exhibitsIn } from '../../content';
import type { BuildingId, Media } from '../../content/types';
import { PLAYER_R } from './collide';
import { triggerAt } from './doors';
import { reachable } from './layout';
import {
  inFront, NORTH, type Bounds, type Pad, type PlacedExhibit, type Pose, type Rect, type SceneGeometry, type Trigger,
} from '../types';

/** The ring sits at the content `pos`; the exhibit prop is this far south of it... */
export const PROP_SETBACK = 1.6;
/** ...and fits in this footprint. */
export const PROP_MAX_W = 3;
export const PROP_MAX_D = 1.6;
export const EXHIBIT_MIN_GAP = 3;

export const INTERIOR_EXIT: Trigger = { id: 'exit', rect: { x: 0, z: -0.45, w: 2.4, d: 0.9 } };
export const INTERIOR_ENTRANCE: Pose = { x: 0, z: -2, heading: NORTH };

export type InteriorSpec = {
  width: number;
  length: number;
  colliders: Rect[];
  cameraDistance: number;
  cameraSouthPad?: number;
  entrance?: Pose;
  pads?: Pad[];
};

/** Placed exhibits of a building in `exhibitsIn` order; `floor` keeps only that floor (`p.floor ?? 1`). */
export function placedIn(id: BuildingId, floor?: number): PlacedExhibit[] {
  const out: PlacedExhibit[] = [];
  for (const p of exhibitsIn(id)) {
    if (floor !== undefined && (p.floor ?? 1) !== floor) continue;
    if (!p.pos) throw new Error(`missing pos: ${p.exhibit.id}`);
    out.push({ id: p.exhibit.id, pos: p.pos });
  }
  return out;
}

export function propAnchor(pos: [number, number]): [number, number] {
  return [pos[0], pos[1] - PROP_SETBACK];
}

export function propCollider(pos: [number, number], w: number, d: number): Rect {
  if (w > PROP_MAX_W || d > PROP_MAX_D) throw new Error(`prop footprint ${w} x ${d} exceeds ${PROP_MAX_W} x ${PROP_MAX_D}`);
  const [x, z] = propAnchor(pos);
  return { x, z, w, d };
}

export function bespokeGeometry(id: BuildingId, spec: InteriorSpec, floor?: number): SceneGeometry {
  return {
    bounds: { minX: -spec.width / 2, maxX: spec.width / 2, minZ: -spec.length, maxZ: 0 },
    colliders: spec.colliders,
    doors: [],
    exits: [INTERIOR_EXIT],
    exhibits: placedIn(id, floor),
    entrance: spec.entrance ?? INTERIOR_ENTRANCE,
    cameraDistance: spec.cameraDistance,
    ...(spec.cameraSouthPad !== undefined ? { cameraSouthPad: spec.cameraSouthPad } : {}),
    ...(spec.pads ? { pads: spec.pads } : {}),
    ...(floor !== undefined ? { floor } : {}),
  };
}

const EPS = 1e-6;
const inBounds = (p: { x: number; z: number }, b: Bounds) => p.x >= b.minX && p.x <= b.maxX && p.z >= b.minZ && p.z <= b.maxZ;
const rectInBounds = (r: Rect, b: Bounds) =>
  r.x - r.w / 2 >= b.minX - EPS && r.x + r.w / 2 <= b.maxX + EPS && r.z - r.d / 2 >= b.minZ - EPS && r.z + r.d / 2 <= b.maxZ + EPS;
function distToRect(p: { x: number; z: number }, r: Rect): number {
  const dx = Math.max(Math.abs(p.x - r.x) - r.w / 2, 0);
  const dz = Math.max(Math.abs(p.z - r.z) - r.d / 2, 0);
  return Math.hypot(dx, dz);
}
const clearOf = (p: { x: number; z: number }, colliders: readonly Rect[]) => colliders.every((c) => distToRect(p, c) >= PLAYER_R);

/** Human-readable reasons a bespoke geometry is unusable; [] = valid. */
export function interiorProblems(g: SceneGeometry): string[] {
  const out: string[] = [];
  const { bounds: b, colliders, exits, exhibits, entrance } = g;
  const pads = g.pads ?? [];
  const triggers = [...exits, ...pads];

  if (exits.length !== 1) out.push(`expected exactly one exit, found ${exits.length}`);
  else {
    const r = exits[0].rect;
    if (Math.abs(r.x) > EPS) out.push('exit is not centred at x 0');
    if (Math.abs(r.z + r.d / 2 - b.maxZ) > EPS) out.push('exit south edge is not on the south wall');
  }

  if (!inBounds(entrance, b)) out.push('entrance is outside the room');
  if (triggerAt(entrance, triggers) !== null) out.push('entrance is inside the exit or a pad');
  if (!clearOf(entrance, colliders)) out.push('entrance is too close to a collider');

  colliders.forEach((c, i) => {
    if (!rectInBounds(c, b)) out.push(`collider ${i} is outside the room`);
  });

  for (const e of exhibits) {
    const f = inFront(e.pos);
    if (!inBounds(f, b)) out.push(`${e.id}: standing spot is outside the room`);
    if (!clearOf(f, colliders)) out.push(`${e.id}: standing spot is too close to a collider`);
    if (triggerAt(f, triggers) !== null) out.push(`${e.id}: standing spot is inside the exit or a pad`);
  }
  for (let i = 0; i < exhibits.length; i++)
    for (let j = i + 1; j < exhibits.length; j++) {
      const [a, c] = [exhibits[i].pos, exhibits[j].pos];
      if (Math.hypot(a[0] - c[0], a[1] - c[1]) < EXHIBIT_MIN_GAP) out.push(`${exhibits[i].id} and ${exhibits[j].id}: rings are closer than ${EXHIBIT_MIN_GAP} m`);
    }

  for (const p of pads) {
    if (triggerAt(p.arrival, pads) !== null) out.push(`pad ${p.id}: arrival is inside a pad`);
    if (!clearOf(p.arrival, colliders)) out.push(`pad ${p.id}: arrival is too close to a collider`);
  }

  const targets = [
    ...exhibits.map((e) => inFront(e.pos)),
    ...exits.map((x) => ({ x: x.rect.x, z: x.rect.z })),
    ...pads.map((p) => ({ x: p.rect.x, z: p.rect.z })),
  ];
  const ok = reachable(entrance, targets, colliders, b);
  ok.forEach((v, i) => {
    if (!v) out.push(`unreachable from the entrance: target ${i}`);
  });
  return out;
}

export function boardSize(m: Media, width: number): [number, number] {
  const ratio = m.width && m.height ? m.height / m.width : 9 / 16;
  return [width, width * ratio];
}
