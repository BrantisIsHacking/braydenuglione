import type { BuildingId } from '../../../content/types';
import { isFloor } from '../../../content/floors';
import { bespokeGeometry, INTERIOR_ENTRANCE, propCollider, type InteriorSpec } from '../../logic/interior';
import { SOUTH, type Pad, type Rect, type SceneGeometry } from '../../types';

/** Elevator pad: walking onto it (or E on it) opens the floor picker. Arrival is the same on every floor. */
export const HQ_ELEVATOR: Pad = {
  id: 'elevator',
  rect: { x: -5.5, z: -9.6, w: 2, d: 2 },
  arrival: { x: -5.5, z: -7.6, heading: SOUTH },
};
export const ELEVATOR_CAR: Rect = { x: -5.5, z: -11.4, w: 2.4, d: 1.2 };

export const HQ_WIDTH = 16;
export const HQ_LENGTH = 12;
export const FLOOR_COUNT = 4;

/** Kept free of colliders on every floor so the elevator is always reachable from the entrance. */
export const ELEVATOR_LANES: Rect[] = [
  { x: -5.5, z: -6.3, w: 2, d: 8.6 },
  { x: -3, z: -2, w: 7, d: 2 },
];

/** Per-floor prop colliders. Exhibit props sit at `propAnchor(pos)` (ring pos, 1.6 m south of it is the prop). */
export const FLOOR_PROPS: Record<number, Rect[]> = {
  1: [propCollider([3, -7], 2.6, 1.0), { x: 7.2, z: -4, w: 0.8, d: 2.4 }],
  2: [propCollider([3, -7], 2.8, 0.8)],
  3: [propCollider([1, -7], 2.4, 1.0), propCollider([5.5, -7], 2.4, 1.0)],
  4: [propCollider([3, -7], 2.8, 1.4), { x: 6.8, z: -10.5, w: 1.2, d: 0.8 }],
};

const floorSpec = (n: number): InteriorSpec => ({
  width: HQ_WIDTH,
  length: HQ_LENGTH,
  colliders: [ELEVATOR_CAR, ...FLOOR_PROPS[n]],
  cameraDistance: 18,
  cameraSouthPad: 2.5,
  entrance: n === 1 ? INTERIOR_ENTRANCE : HQ_ELEVATOR.arrival,
  pads: [HQ_ELEVATOR],
});

export const FLOOR_SPECS: Record<1 | 2 | 3 | 4, InteriorSpec> = {
  1: floorSpec(1),
  2: floorSpec(2),
  3: floorSpec(3),
  4: floorSpec(4),
};

/** Invalid or missing floors resolve to 1; `geometry.floor` is always set. */
export function resolveFloor(floor?: number): 1 | 2 | 3 | 4 {
  return (floor !== undefined && isFloor('hq-tower', floor) ? floor : 1) as 1 | 2 | 3 | 4;
}

export function sceneGeometry(id: BuildingId | null, floor?: number): SceneGeometry {
  const n = resolveFloor(floor);
  return bespokeGeometry(id ?? 'hq-tower', FLOOR_SPECS[n], n);
}
