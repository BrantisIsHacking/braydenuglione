import { exhibitsIn } from '../../../content';
import { NORTH, type Bounds, type Pose, type Rect, type SceneGeometry, type Trigger } from '../../types';
import { BENCH, HOOP_X, SCORER_TABLE } from './logic/court';
import { standBlocks } from './logic/dressing';
import { SCORER_BOARD } from './gymLook';
import { gymToScene } from './transform';

export { gymToScene };

export const GYM_BOUNDS: Bounds = { minX: -9.5, maxX: 9.5, minZ: -15, maxZ: 17 };
export const GYM_EXIT: Trigger = { id: 'exit', rect: { x: 0, z: 16.55, w: 2.4, d: 0.9 } };
export const GYM_ENTRANCE: Pose = { x: 0, z: 15.6, heading: NORTH };

/** Gym-local rect to scene rect (rotation by PI/2 swaps width and depth). */
export function rectToScene(r: Rect): Rect {
  const [x, z] = gymToScene([r.x, r.z]);
  return { x, z, w: r.d, d: r.w };
}

const POLE = 0.4;

export function gymColliders(): Rect[] {
  const local: Rect[] = [
    ...standBlocks().map(({ x, z, w, d }) => ({ x, z, w, d })),
    { x: SCORER_TABLE.x, z: SCORER_TABLE.z, w: SCORER_TABLE.length, d: 0.9 },
    { x: SCORER_TABLE.x - SCORER_TABLE.length / 2 - SCORER_BOARD.gap, z: SCORER_BOARD.z, w: 0.5, d: SCORER_BOARD.w },
    { x: BENCH.x, z: BENCH.z, w: BENCH.length, d: 0.6 },
    ...[1, -1].map((s) => ({ x: s * (HOOP_X + 1.8), z: 0, w: POLE, d: POLE })),
  ];
  return local.map(rectToScene);
}

export function sceneGeometry(): SceneGeometry {
  return {
    bounds: GYM_BOUNDS,
    colliders: gymColliders(),
    doors: [],
    exits: [GYM_EXIT],
    exhibits: exhibitsIn('gym').flatMap((p) => (p.pos ? [{ id: p.exhibit.id, pos: p.pos }] : [])),
    entrance: GYM_ENTRANCE,
    cameraDistance: 25,
  };
}
