import { buildings } from '../../content/buildings';
import type { BuildingId } from '../../content/types';
import { LOTS } from '../logic/layout';
import { signHeight } from './massing';

/** One sign per building: above the door, or above the spot. */
export function worldSigns(): { id: BuildingId; text: string; pos: [number, number, number] }[] {
  return buildings.map((b) => {
    const l = LOTS[b.id];
    if (l.door) return { id: b.id, text: b.sign, pos: [l.door.x, signHeight(b.id), l.door.z + 0.12] as [number, number, number] };
    const s = l.spot ?? { x: l.rect.x, z: l.rect.z };
    // chess park and park: board on a pole just north of the table; loop: board on the marker post
    if (b.id === 'chess-park' || b.id === 'park') return { id: b.id, text: b.sign, pos: [s.x, 3.1, s.z - 0.82] as [number, number, number] };
    if (b.id === 'running-loop') return { id: b.id, text: b.sign, pos: [s.x, 2.5, s.z + 0.18] as [number, number, number] };
    return { id: b.id, text: b.sign, pos: [s.x, 3.1, s.z] as [number, number, number] };
  });
}
