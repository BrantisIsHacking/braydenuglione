import type { BuildingId } from './types';

export type Floor = { n: number; name: string; sign: string };

export const FLOORS: Partial<Record<BuildingId, readonly Floor[]>> = {
  'hq-tower': [
    { n: 1, name: 'IT server room', sign: 'FLOOR 1: IT ROOM' },
    { n: 2, name: 'Coding dojo', sign: 'FLOOR 2: CODING DOJO' },
    { n: 3, name: 'Med-ML lab', sign: 'FLOOR 3: MED-ML LAB' },
    { n: 4, name: 'AI lab', sign: 'FLOOR 4: AI LAB' },
  ],
};

export function floorsOf(id: BuildingId): readonly Floor[] {
  return FLOORS[id] ?? [];
}

export function isFloor(id: BuildingId, n: number): boolean {
  return Number.isInteger(n) && n >= 1 && n <= floorsOf(id).length;
}
