import type { BuildingId } from '../../../content/types';
import { bespokeGeometry } from '../../logic/interior';
import { withStops } from '../../logic/stops';
import type { SceneGeometry } from '../../types';
import { SPEC, STOPS } from './look';

export { SPEC, STOPS };

/** The favorites table (content), then the three shelf-unit stops. */
export function sceneGeometry(_id?: BuildingId | null): SceneGeometry {
  return withStops(bespokeGeometry('library', SPEC), STOPS);
}
