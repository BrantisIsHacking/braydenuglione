import type { BuildingId } from '../../../content/types';
import { bespokeGeometry } from '../../logic/interior';
import type { SceneGeometry } from '../../types';
import { SPEC } from './look';

export { SPEC };

export function sceneGeometry(_id?: BuildingId | null): SceneGeometry {
  return bespokeGeometry('playhouse', SPEC);
}
