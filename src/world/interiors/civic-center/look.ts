import type { SignSpec } from '../../kit/InteriorShell';
import type { InstanceItem } from '../../kit/instancing';

export const CIVIC_LOOK = {
  floor: 'stone',
  wall: 'offWhite',
  dado: 'scarlet',
  divider: 'ink',
  wallHeight: 3.6,
} as const;

/** Instance helper: a box by centre and size. */
export const bx = (x: number, y: number, z: number, w: number, h: number, d: number, rotY?: number): InstanceItem => ({
  x, y, z, sx: w, sy: h, sz: d, ...(rotY ? { rotY } : {}),
});

export const SIGN_SPECS: readonly SignSpec[] = [
  { text: 'LECTURE HALL', position: [-7, 2.05, -15.9], board: 'scarlet', size: 0.35 },
  { text: 'JUDGING HALL', position: [0, 2.05, -15.9], board: 'scarlet', size: 0.35 },
  { text: 'CLASSROOM', position: [7, 2.05, -15.9], board: 'scarlet', size: 0.35 },
  { text: 'CIVIC CENTER', position: [-6, 0.3, 0.36], board: 'scarlet', size: 0.2 },
  { text: 'TOUR DESK', position: [-4.6, 2.5, -7.14], board: 'ink', size: 0.25 },
  { text: 'MENTORSHIP BOARD', position: [-10.9, 2.75, -13], rotationY: Math.PI / 2, board: 'ink', size: 0.3 },
];

export const SIGNS: readonly string[] = ['CIVIC CENTER', 'LECTURE HALL', 'JUDGING HALL', 'CLASSROOM', 'TOUR DESK', 'MENTORSHIP BOARD'];
