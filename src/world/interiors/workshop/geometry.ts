import type { BuildingId } from '../../../content/types';
import { bespokeGeometry, propAnchor, propCollider, type InteriorSpec } from '../../logic/interior';
import type { Rect, SceneGeometry } from '../../types';

/** Workbenches against the west and east walls (collider footprint). */
export const BENCH_Z: readonly number[] = [-13, -9.5, -6];
export const BENCH_X = 9.35;
export const BENCH_W = 1;
export const BENCH_D = 2.4;

/** Prop footprints: [exhibit pos, w, d]. */
const PROPS: readonly [[number, number], number, number][] = [
  [[-6, -12], 1.6, 1.6], // moon globe
  [[0, -12], 1.6, 1.6], // storybook
  [[6, -12], 2.2, 0.8], // podiums
  [[-6, -6], 2.6, 0.9], // server rack + results board
  [[6, -6], 2.7, 1.3], // city blocks + bar chart
  [[0, -6], 2.6, 1.4], // eye + trace screen
];

export const PROP_COLLIDERS: Rect[] = PROPS.map(([pos, w, d]) => propCollider(pos, w, d));
export const BENCH_COLLIDERS: Rect[] = [-1, 1].flatMap((s) => BENCH_Z.map((z) => ({ x: s * BENCH_X, z, w: BENCH_W, d: BENCH_D })));

export const SPEC: InteriorSpec = {
  width: 20,
  length: 16,
  colliders: [...PROP_COLLIDERS, ...BENCH_COLLIDERS],
  cameraDistance: 18,
  cameraSouthPad: 0.5,
};

export { propAnchor };

export function sceneGeometry(id?: BuildingId | null): SceneGeometry {
  void id;
  return bespokeGeometry('workshop', SPEC);
}
