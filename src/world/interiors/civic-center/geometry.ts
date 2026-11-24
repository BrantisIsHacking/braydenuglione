import type { BuildingId } from '../../../content/types';
import { bespokeGeometry, propCollider, type InteriorSpec } from '../../logic/interior';
import type { Rect, SceneGeometry } from '../../types';

/** Hand-placed set pieces (centre x, centre z, width, depth); each stays clear of every standing spot. */
export const DIVIDER_RECTS: Rect[] = [
  { x: -3.5, z: -13, w: 0.2, d: 6 },
  { x: 3.5, z: -13, w: 0.2, d: 6 },
];
export const LECTURE_PLATFORM: Rect = { x: -7, z: -13.2, w: 3.6, d: 2.4 };
export const JUDGES_BLOCK: Rect = { x: 0, z: -15.1, w: 3.2, d: 1.6 };
export const PROJECT_TABLES: Rect[] = [
  { x: -2.2, z: -12.6, w: 1.4, d: 0.7 },
  { x: 2.2, z: -12.6, w: 1.4, d: 0.7 },
];
export const CLASS_BLOCK: Rect = { x: 7, z: -14.1, w: 4.4, d: 3.4 };
export const TOUR_DESK: Rect = { x: -4, z: -7.6, w: 5, d: 1.2 };
export const BENCH_POS: [number, number] = [6, -6];

export const SPEC: InteriorSpec = {
  width: 22,
  length: 16,
  colliders: [
    ...DIVIDER_RECTS,
    LECTURE_PLATFORM,
    JUDGES_BLOCK,
    ...PROJECT_TABLES,
    CLASS_BLOCK,
    TOUR_DESK,
    propCollider(BENCH_POS, 3, 1.0),
  ],
  cameraDistance: 18,
  cameraSouthPad: 0.5,
};

export function sceneGeometry(_id?: BuildingId | null, _floor?: number): SceneGeometry {
  return bespokeGeometry('civic-center', SPEC);
}
