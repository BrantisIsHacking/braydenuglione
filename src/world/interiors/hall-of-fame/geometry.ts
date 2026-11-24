import { getExhibit } from '../../../content/exhibits';
import type { BuildingId } from '../../../content/types';
import { bespokeGeometry, placedIn, propCollider, type InteriorSpec } from '../../logic/interior';
import type { Rect, SceneGeometry } from '../../types';
import { FAME_LOOK } from './look';

const placed = placedIn('hall-of-fame');
/** Award exhibits (banner type) in content order; the mirror screen is the other placement. */
export const BANNER_POS: [number, number][] = placed.filter((p) => getExhibit(p.id)?.type === 'banner').map((p) => p.pos);
export const SCREEN_POS: [number, number] = placed.find((p) => p.id === FAME_LOOK.mirrorId)!.pos;

const colliders: Rect[] = [
  ...BANNER_POS.map((p) => propCollider(p, 1, 1)),
  propCollider(SCREEN_POS, FAME_LOOK.screenWidth, 0.4),
];

export const SPEC: InteriorSpec = { width: 20, length: 16, colliders, cameraDistance: 17, cameraSouthPad: 1 };

export function sceneGeometry(_id?: BuildingId | null): SceneGeometry {
  return bespokeGeometry('hall-of-fame', SPEC);
}
