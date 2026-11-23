import { describe, it, expect } from 'vitest';
import { collide, PLAYER_R } from '../../src/world/logic/collide';

const B = { minX: -10, maxX: 10, minZ: -10, maxZ: 10 };
const box = { x: 0, z: 0, w: 4, d: 4 };
describe('collide', () => {
  it('free point unchanged', () => expect(collide({ x: 5, z: 5 }, PLAYER_R, [box], B)).toEqual({ x: 5, z: 5 }));
  it('clamps to bounds inset by r', () => {
    const p = collide({ x: -50, z: 50 }, PLAYER_R, [], B);
    expect(p.x).toBeCloseTo(-9.6, 9);
    expect(p.z).toBeCloseTo(9.6, 9);
  });
  it('pushes out of a face', () => {
    const p = collide({ x: -2.2, z: 0 }, PLAYER_R, [box], B);
    expect(p.x).toBeCloseTo(-2.4, 9);
    expect(p.z).toBeCloseTo(0, 9);
  });
  it('centre inside exits nearest face', () => {
    const p = collide({ x: 1.5, z: 0.2 }, PLAYER_R, [box], B);
    expect(p.x).toBeCloseTo(2.4, 9);
    expect(p.z).toBeCloseTo(0.2, 9);
  });
  it('corner push is radial', () => {
    const p = collide({ x: 2.1, z: 2.1 }, PLAYER_R, [box], B);
    expect(Math.hypot(p.x - 2, p.z - 2)).toBeCloseTo(PLAYER_R, 9);
    expect(p.x - 2).toBeCloseTo(p.z - 2, 9);
  });
  it('NaN unchanged', () => {
    const p = { x: NaN, z: 1 };
    expect(collide(p, PLAYER_R, [box], B)).toBe(p);
  });
});
