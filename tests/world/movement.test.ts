import { describe, it, expect } from 'vitest';
import { step, NO_INPUT, SPEED, TURN_SPEED } from '../../src/world/logic/movement';

const B = { minX: -50, maxX: 50, minZ: -50, maxZ: 50 };
const geo = { bounds: B, colliders: [] };
const run = (p: { x: number; z: number; heading: number }, i: { x: number; y: number }, frames: number, g: Parameters<typeof step>[3] = geo) => {
  for (let k = 0; k < frames; k++) p = step(p, i, 1 / 60, g);
  return p;
};
describe('step', () => {
  it('east for 1 s', () => {
    const p = run({ x: 0, z: 0, heading: 0 }, { x: 1, y: 0 }, 60);
    expect(p.x).toBeCloseTo(6, 5);
    expect(p.z).toBeCloseTo(0, 9);
    expect(p.heading).toBeCloseTo(0, 9);
  });
  it('north is -z and heading -pi/2', () => {
    const p = run({ x: 0, z: 0, heading: 0 }, { x: 0, y: 1 }, 60);
    expect(p.z).toBeCloseTo(-6, 5);
    expect(p.heading).toBeCloseTo(-Math.PI / 2, 9);
  });
  it('diagonal speed is SPEED', () => {
    const p = run({ x: 0, z: 0, heading: 0 }, { x: 1, y: 1 }, 60);
    expect(Math.hypot(p.x, p.z)).toBeCloseTo(SPEED, 5);
  });
  it('no input keeps heading', () => {
    expect(step({ x: 1, z: 2, heading: 1.2 }, NO_INPUT, 1 / 60, geo)).toEqual({ x: 1, z: 2, heading: 1.2 });
  });
  it('turn rate is limited', () => {
    let p = { x: 0, z: 0, heading: 0 };
    for (let k = 0; k < 30; k++) {
      const n = step(p, { x: -1, y: 0 }, 1 / 60, geo);
      let dh = Math.abs(n.heading - p.heading);
      if (dh > Math.PI) dh = 2 * Math.PI - dh;
      expect(dh).toBeLessThanOrEqual(TURN_SPEED / 60 + 1e-9);
      p = n;
    }
  });
  it('slides along a wall', () => {
    const g = { bounds: { minX: -50, maxX: 5, minZ: -50, maxZ: 50 }, colliders: [] };
    const p = run({ x: 0, z: 0, heading: 0 }, { x: 1, y: 1 }, 120, g);
    expect(p.x).toBeCloseTo(5 - 0.4, 9);
    expect(p.z).toBeLessThan(-8);
  });
  it('does not tunnel', () => {
    const g = { bounds: B, colliders: [{ x: 5, z: 0, w: 0.4, d: 0.4 }] };
    const p = run({ x: 0, z: 0, heading: 0 }, { x: 1, y: 0 }, 120, g);
    expect(p.x).toBeLessThanOrEqual(5 - 0.2 - 0.4 + 1e-9);
  });
  it('dt NaN leaves pose unchanged', () => {
    const p = { x: 1, z: 2, heading: 0.5 };
    expect(step(p, { x: 1, y: 0 }, NaN, geo)).toEqual(p);
  });
});
