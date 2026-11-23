import { NORTH, type Bounds, type Pose, type Rect, type Trigger } from '../types';

export const HALL = { cols: 4, colGap: 4, rowGap: 5, front: 4, back: 4, halfW: 8, pedestal: 1 } as const;

export type HallLayout = { slots: [number, number][]; bounds: Bounds; colliders: Rect[]; exit: Trigger; entrance: Pose; length: number };

export function hallLayout(n: number): HallLayout {
  const count = Math.max(0, n);
  const rows = Math.max(1, Math.ceil(count / HALL.cols));
  const slots: [number, number][] = [];
  for (let i = 0; i < count; i++) {
    slots.push([-6 + HALL.colGap * (i % HALL.cols), -(HALL.front + HALL.rowGap * Math.floor(i / HALL.cols))]);
  }
  const length = HALL.front + HALL.rowGap * (rows - 1) + HALL.back;
  return {
    slots,
    bounds: { minX: -HALL.halfW, maxX: HALL.halfW, minZ: -length, maxZ: 0 },
    colliders: slots.map(([x, z]) => ({ x, z, w: HALL.pedestal, d: HALL.pedestal })),
    exit: { id: 'exit', rect: { x: 0, z: -0.45, w: 2.4, d: 0.9 } },
    entrance: { x: 0, z: -2, heading: NORTH },
    length,
  };
}
