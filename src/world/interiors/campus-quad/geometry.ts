import type { BuildingId } from '../../../content/types';
import { bespokeGeometry, propCollider, type InteriorSpec } from '../../logic/interior';
import type { Rect, SceneGeometry } from '../../types';

export const HEDGE_Z = -12.5;
export const HEDGE: readonly Rect[] = [
  { x: -7.5, z: HEDGE_Z, w: 11, d: 0.6 },
  { x: 7.5, z: HEDGE_Z, w: 11, d: 0.6 },
];
export const TREES: readonly [number, number][] = [[-11.5, -18.5], [11.5, -18.5], [-11.5, -2.8], [11.5, -2.8]];

/** College-row set pieces sit against the north wall: the collider fills the gap behind them. */
const backed = (x: number): Rect => ({ x, z: -18.4, w: 3, d: 3.2 });

export const SPEC: InteriorSpec = {
  width: 26,
  length: 20,
  cameraDistance: 18,
  cameraSouthPad: 1.2,
  colliders: [
    ...HEDGE,
    backed(-8), backed(0), backed(8),
    propCollider([-10, -9], 3, 1.6),
    propCollider([-5, -9], 2.8, 1.5),
    { x: 0, z: -10.35, w: 3, d: 0.8 }, // tables only; the banner hangs on the hedge so the gap stays open
    propCollider([5, -9], 3, 1.6),
    propCollider([10, -9], 3, 1.6),
    ...TREES.map(([x, z]) => ({ x, z, w: 0.5, d: 0.5 })),
  ],
};

export function sceneGeometry(id?: BuildingId | null): SceneGeometry {
  void id;
  return bespokeGeometry('campus-quad', SPEC);
}
