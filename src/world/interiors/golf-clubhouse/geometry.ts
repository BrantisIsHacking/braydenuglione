import type { BuildingId } from '../../../content/types';
import { isFloor } from '../../../content/floors';
import { bespokeGeometry, INTERIOR_ENTRANCE, placedIn, propCollider, type InteriorSpec } from '../../logic/interior';
import { NORTH, type Pad, type PlacedExhibit, type Rect, type SceneGeometry } from '../../types';

/** Walk-in pad on floor 1: stepping on it rides straight up to the course (floor 2). */
export const GOLF_COURSE_PAD: Pad = {
  id: 'course',
  rect: { x: 0, z: -11.4, w: 2.4, d: 1.2 },
  arrival: { x: 0, z: -2, heading: NORTH },
  to: 2,
};

/** Floor 1 content scorecard board position (ring), also the contract position. */
export const SCORECARD_POS: [number, number] = [-4, -7];
/** Floor 2 scorecard stand, beside hole 9. */
export const COURSE_STOP_POS: [number, number] = [16.4, -25.8];

export const CLUBHOUSE_WIDTH = 16;
export const CLUBHOUSE_LENGTH = 12;
export const COURSE_WIDTH = 36;
export const COURSE_LENGTH = 30;

/** Entrance -> course door lane, kept free of colliders on floor 1. */
export const COURSE_LANE: Rect = { x: 0, z: -7, w: 2.4, d: 8 };

export const COUNTER: Rect = { x: 5.6, z: -10.9, w: 4, d: 1 };
export const CLUB_RACK: Rect = { x: 7.5, z: -5, w: 0.8, d: 3.2 };
export const TROPHY_SHELF: Rect = { x: -7.5, z: -9.5, w: 0.8, d: 3 };
export const BENCH: Rect = { x: -6, z: -3, w: 2.4, d: 0.7 };

/** Tree trunks and a bench on the west lawn. */
export const TREES: readonly [number, number][] = [[-14, -9], [-15, -15], [-12, -21], [-15, -25], [-7, -27]];
export const LAWN_BENCH: Rect = { x: -9, z: -5, w: 2.2, d: 0.7 };

const F1_COLLIDERS: Rect[] = [propCollider(SCORECARD_POS, 2.8, 0.8), COUNTER, CLUB_RACK, TROPHY_SHELF, BENCH];
const F2_COLLIDERS: Rect[] = [
  propCollider(COURSE_STOP_POS, 2.8, 0.6),
  LAWN_BENCH,
  ...TREES.map(([x, z]) => ({ x, z, w: 0.6, d: 0.6 })),
];

export const FLOOR_SPECS: Record<1 | 2, InteriorSpec> = {
  1: {
    width: CLUBHOUSE_WIDTH,
    length: CLUBHOUSE_LENGTH,
    colliders: F1_COLLIDERS,
    cameraDistance: 15,
    cameraSouthPad: 1.5,
    entrance: INTERIOR_ENTRANCE,
    pads: [GOLF_COURSE_PAD],
  },
  2: {
    width: COURSE_WIDTH,
    length: COURSE_LENGTH,
    colliders: F2_COLLIDERS,
    cameraDistance: 18,
    cameraSouthPad: 1,
    entrance: GOLF_COURSE_PAD.arrival,
  },
};

/** Course layout: a 3 x 3 grid of 7 x 7 m cells, serpentine, hole 1 in front of the gate. */
export const CELL = { w: 7, d: 7, x0: 0, z0: -9.5 } as const;
const ORDER: readonly (readonly [number, number])[] = [
  [0, 0], [1, 0], [2, 0],
  [2, 1], [1, 1], [0, 1],
  [0, 2], [1, 2], [2, 2],
];
/** Tee and cup sit this far either side of the cell centre along the row. */
export const HOLE_HALF = 2.4;

export type Hole = { n: number; tee: [number, number]; cup: [number, number]; cell: Rect };

export const HOLES: Hole[] = ORDER.map(([c, r], i) => {
  const cx = CELL.x0 + c * CELL.w;
  const cz = CELL.z0 - r * CELL.d;
  const dir = r % 2 === 0 ? 1 : -1;
  return {
    n: i + 1,
    tee: [cx - dir * HOLE_HALF, cz] as [number, number],
    cup: [cx + dir * HOLE_HALF, cz] as [number, number],
    cell: { x: cx, z: cz, w: CELL.w, d: CELL.d },
  };
});

/** The scorecard stand beside hole 9 (opens the golf panel; no focus). */
export const COURSE_STOPS: PlacedExhibit[] = [{ id: 'golf', pos: COURSE_STOP_POS }];

/** Invalid or missing floors resolve to 1; `geometry.floor` is always set. */
export function resolveFloor(floor?: number): 1 | 2 {
  return (floor !== undefined && isFloor('golf-clubhouse', floor) ? floor : 1) as 1 | 2;
}

export function sceneGeometry(id?: BuildingId | null, floor?: number): SceneGeometry {
  const n = resolveFloor(floor);
  const base = bespokeGeometry(id ?? 'golf-clubhouse', FLOOR_SPECS[n], n);
  return n === 2 ? { ...base, exhibits: COURSE_STOPS } : { ...base, exhibits: placedIn('golf-clubhouse', 1) };
}
