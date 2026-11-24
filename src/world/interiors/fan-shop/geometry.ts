import type { BuildingId } from '../../../content/types';
import { bespokeGeometry } from '../../logic/interior';
import { withStops } from '../../logic/stops';
import type { PlacedExhibit, SceneGeometry } from '../../types';
import { JERSEY_STOP, SCARF_STOP, SPEC } from './look';

export { SPEC };

/** Jersey rack and scarf wall: both open the `teams` panel focused on their first team. */
export const STOPS: readonly PlacedExhibit[] = [
  { id: 'teams', pos: JERSEY_STOP, focus: 'Giants' },
  { id: 'teams', pos: SCARF_STOP, focus: 'Manchester City' },
];

export function sceneGeometry(_id?: BuildingId | null): SceneGeometry {
  return withStops(bespokeGeometry('fan-shop', SPEC), STOPS);
}
