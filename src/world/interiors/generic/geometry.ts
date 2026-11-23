import type { BuildingId } from '../../../content/types';
import { exhibitsIn } from '../../../content/exhibits';
import { hallLayout } from '../../logic/hall';
/** Pulled back from the default interior distance so top-row labels clear the HUD band at spawn. */
const HALL_CAMERA_DISTANCE = 15;
/** Less south overscan than the default, so the back-row labels land below the HUD band at spawn (1280x800). */
const HALL_SOUTH_PAD = 0.75;
import type { SceneGeometry } from '../../types';

export function sceneGeometry(id: BuildingId | null): SceneGeometry {
  const placements = id ? exhibitsIn(id) : [];
  const layout = hallLayout(placements.length);
  return {
    bounds: layout.bounds,
    colliders: layout.colliders,
    doors: [],
    exits: [layout.exit],
    exhibits: placements.map((p, i) => ({ id: p.exhibit.id, pos: layout.slots[i] })),
    entrance: layout.entrance,
    cameraDistance: HALL_CAMERA_DISTANCE,
    cameraSouthPad: HALL_SOUTH_PAD,
  };
}
