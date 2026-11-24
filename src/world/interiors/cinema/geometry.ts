import { bespokeGeometry } from '../../logic/interior';
import type { BuildingId } from '../../../content/types';
import type { PlacedExhibit, SceneGeometry } from '../../types';
import { posterSlots, SPEC } from './look';

export { SPEC };

/** The twelve hallway poster stops (all open the `movies` panel), then the screen (`critics-choice`). */
export function stops(): PlacedExhibit[] {
  const base = bespokeGeometry('cinema', SPEC).exhibits; // movies (first poster stop), critics-choice
  const screen = base.find((e) => e.id === 'critics-choice')!;
  return [...posterSlots().map((p) => ({ id: 'movies', pos: p.stop })), screen];
}

export function sceneGeometry(_id?: BuildingId | null): SceneGeometry {
  return { ...bespokeGeometry('cinema', SPEC), exhibits: stops() };
}
