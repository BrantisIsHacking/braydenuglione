import { interests } from '../../../content';
import type { ThemeColorKey } from '../../../content/types';
import type { SignSpec } from '../../kit/InteriorShell';
import type { InstanceItem } from '../../kit/instancing';
import { HOLES } from './geometry';

export const GOLF_LOOK: Record<1 | 2, { floor: ThemeColorKey; wall: ThemeColorKey; wallHeight: number }> = {
  1: { floor: 'hardwood', wall: 'offWhite', wallHeight: 3.4 },
  2: { floor: 'grass', wall: 'fairway', wallHeight: 0.9 },
};

export const SIGNS: readonly string[] = ['CLUBHOUSE', 'PRO SHOP', 'TO THE COURSE', '9 HOLES'];

const FLOOR_SIGNS: Record<1 | 2, SignSpec[]> = {
  1: [
    { text: 'CLUBHOUSE', position: [-5, 0.9, -0.2], board: 'fairway', size: 0.35 },
    { text: 'PRO SHOP', position: [5.6, 2.6, -11.85], board: 'mustard', size: 0.35 },
    { text: 'TO THE COURSE', position: [0, 2.85, -11.8], board: 'fairway', size: 0.4 },
  ],
  2: [{ text: '9 HOLES', position: [-5, 0.9, -0.2], board: 'fairway', size: 0.35 }],
};

export function floorSigns(floor: 1 | 2): SignSpec[] {
  return FLOOR_SIGNS[floor];
}

export const SIGN_SPECS: readonly SignSpec[] = [...FLOOR_SIGNS[1], ...FLOOR_SIGNS[2]];

/** The only content-derived 3D text on the course: the hole numbers. */
export const TEXT_LINES: readonly string[] = HOLES.map((h) => String(h.n));

/** The two summary lines (best nine, tournament round): explicit content fields, not parsed from the detail. */
export function scorecardLines(): string[] {
  return [...(interests.find((i) => i.id === 'golf')?.scorecard ?? [])];
}

/** The scorecard board is a blank 9-column grid: no scores are drawn. */
export const SCORECARD_COLUMNS = 9;

/** Box instance from centre x/z, centre height y and full size. */
export const bx = (x: number, y: number, z: number, w: number, h: number, d: number, rotY?: number): InstanceItem => ({
  x, y, z, sx: w, sy: h, sz: d, ...(rotY !== undefined ? { rotY } : {}),
});

/** Upright cylinder instance: diameter, height. */
export const cy = (x: number, y: number, z: number, dia: number, h: number): InstanceItem => ({ x, y, z, sx: dia, sy: h, sz: dia });
