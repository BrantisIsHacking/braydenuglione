import type { BuildingId } from '../../../content/types';
import { games } from '../../../content/games';
import { bespokeGeometry } from '../../logic/interior';
import { withStops } from '../../logic/stops';
import type { PlacedExhibit, SceneGeometry } from '../../types';
import { cabinetSlot, SPEC } from './look';

export { SPEC };

/** Cabinets 2..17 (Rocket League and FIFA are content exhibits at cabinets 0 and 1). */
export const STOPS: PlacedExhibit[] = games.slice(2).map((g, k) => ({ id: 'games', pos: cabinetSlot(k + 2), focus: g.title }));

export function sceneGeometry(_id?: BuildingId | null): SceneGeometry {
  return withStops(bespokeGeometry('arcade', SPEC), STOPS);
}
