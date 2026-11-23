import { describe, expect, it } from 'vitest';
import { hallLayout } from '../../src/world/logic/hall';
import { triggerAt } from '../../src/world/logic/doors';
import { inFront } from '../../src/world/types';

function clear(p: { x: number; z: number }, l: ReturnType<typeof hallLayout>) {
  expect(triggerAt(p, [l.exit])).toBeNull();
  for (const c of l.colliders) {
    const dx = Math.max(Math.abs(p.x - c.x) - c.w / 2, 0), dz = Math.max(Math.abs(p.z - c.z) - c.d / 2, 0);
    expect(Math.hypot(dx, dz)).toBeGreaterThan(0.4);
  }
}
describe('hallLayout', () => {
  it('length', () => {
    for (const [n, len] of [[0, 8], [1, 8], [4, 8], [5, 13], [8, 13], [9, 18]]) expect(hallLayout(n).length).toBe(len);
  });
  it('slots of 6', () => {
    expect(hallLayout(6).slots).toEqual([[-6, -4], [-2, -4], [2, -4], [6, -4], [-6, -9], [-2, -9]]);
    expect(hallLayout(0).slots).toHaveLength(0);
  });
  it('bounds grow', () => {
    const a = hallLayout(4).bounds, b = hallLayout(9).bounds;
    expect(a).toEqual({ minX: -8, maxX: 8, minZ: -8, maxZ: 0 });
    expect(b.minZ).toBeLessThan(a.minZ);
  });
  it('entrance and in-front poses are clear', () => {
    const l = hallLayout(13);
    clear(l.entrance, l);
    expect(l.colliders).toHaveLength(13);
    for (const s of l.slots) clear(inFront(s), l);
  });
});
