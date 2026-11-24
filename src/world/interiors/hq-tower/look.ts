import type { ThemeColorKey } from '../../../content/types';
import { floorsOf } from '../../../content/floors';
import type { SignSpec } from '../../kit/InteriorShell';
import type { InstanceItem } from '../../kit/instancing';

export const HQ_WALL_HEIGHT = 3.4;

export const HQ_LOOK: Record<number, { floor: ThemeColorKey; wall: ThemeColorKey }> = {
  1: { floor: 'slate', wall: 'stone' },
  2: { floor: 'hardwood', wall: 'offWhite' },
  3: { floor: 'offWhite', wall: 'sky' },
  4: { floor: 'stone', wall: 'offWhite' },
};

export const SIGNS: readonly string[] = ['HQ TOWER', 'ELEVATOR', ...floorsOf('hq-tower').map((f) => f.sign)];

/** Signs drawn on a floor: the floor name, the elevator, and on floor 1 the building sign by the door. */
export function floorSigns(floor: number): SignSpec[] {
  const f = floorsOf('hq-tower').find((x) => x.n === floor);
  const out: SignSpec[] = [
    { text: 'ELEVATOR', position: [-5.5, 3.0, -10.74], board: 'ink', size: 0.3 },
  ];
  if (f) out.push({ text: f.sign, position: [2, 2.6, -11.85], board: 'scarlet' });
  if (floor === 1) out.push({ text: 'HQ TOWER', position: [-5, 0.9, -0.2], board: 'ink', size: 0.35 });
  return out;
}

/** Box instance from centre x/z, centre height y and full size. */
export const bx = (x: number, y: number, z: number, w: number, h: number, d: number, rotY?: number): InstanceItem => ({
  x, y, z, sx: w, sy: h, sz: d, ...(rotY !== undefined ? { rotY } : {}),
});
