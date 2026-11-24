import type { BuildingId } from './types';

export type Floor = { n: number; name: string; sign: string; /** HUD/Map text instead of "Floor n" */ label?: string };

export const FLOORS: Partial<Record<BuildingId, readonly Floor[]>> = {
  'hq-tower': [
    { n: 1, name: 'IT server room', sign: 'FLOOR 1: IT ROOM' },
    { n: 2, name: 'Coding dojo', sign: 'FLOOR 2: CODING DOJO' },
    { n: 3, name: 'Med-ML lab', sign: 'FLOOR 3: MED-ML LAB' },
    { n: 4, name: 'AI lab', sign: 'FLOOR 4: AI LAB' },
  ],
  'golf-clubhouse': [
    { n: 1, name: 'Clubhouse', sign: 'CLUBHOUSE', label: 'Clubhouse' },
    { n: 2, name: 'Nine-hole course', sign: '9 HOLES', label: 'Course' },
  ],
};

export function floorsOf(id: BuildingId): readonly Floor[] {
  return FLOORS[id] ?? [];
}

export function isFloor(id: BuildingId, n: number): boolean {
  return Number.isInteger(n) && n >= 1 && n <= floorsOf(id).length;
}

export function floorLabel(id: BuildingId, n: number): string {
  return floorsOf(id).find((f) => f.n === n)?.label ?? `Floor ${n}`;
}
