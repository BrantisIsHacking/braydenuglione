import type { BuildingId } from '../../../content/types';
import { bespokeGeometry } from '../../logic/interior';
import { withStops } from '../../logic/stops';
import type { PlacedExhibit, SceneGeometry } from '../../types';
import { SPEC, stackSlots } from './look';

export { SPEC };

/** One stop per artist, in rank order; each opens the music panel focused on that artist. */
export const STOPS: readonly PlacedExhibit[] = stackSlots().map((s) => ({ id: 'music', pos: s.pos, focus: s.artist }));

export function sceneGeometry(_id?: BuildingId | null): SceneGeometry {
  return withStops(bespokeGeometry('record-store', SPEC), STOPS);
}
