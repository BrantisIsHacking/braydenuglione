import { describe, it, expect } from 'vitest';
import { step, NO_INPUT, SPEED, MAX_DT } from '../../src/arena/logic/movement';

const fwd = { forward: 1, turn: 0 };
describe('step', () => {
  it('moves forward along +x', () => {
    let p = { x: 0, z: 0, heading: 0 };
    for (let i = 0; i < 20; i++) p = step(p, fwd, 0.05);
    expect(p.x).toBeCloseTo(6, 5);
    expect(p.z).toBeCloseTo(0, 5);
  });
  it('heading pi/2 moves +z', () => {
    const p = step({ x: 0, z: 0, heading: Math.PI / 2 }, fwd, 0.05);
    expect(p.z).toBeGreaterThan(0.29);
    expect(Math.abs(p.x)).toBeLessThan(1e-9);
  });
  it('turn +1 raises heading', () => {
    expect(step({ x: 0, z: 0, heading: 0 }, { forward: 0, turn: 1 }, 0.05).heading).toBeCloseTo(0.13, 5);
  });
  it('clamps to bounds', () => {
    let p = { x: 14.9, z: 9.4, heading: Math.PI / 4 };
    for (let i = 0; i < 100; i++) p = step(p, fwd, 0.05);
    expect(p.x).toBe(15);
    expect(p.z).toBe(9.5);
  });
  it('clamps long dt', () => {
    const p = step({ x: 0, z: 0, heading: 0 }, fwd, 5);
    expect(p.x).toBeLessThanOrEqual(SPEED * MAX_DT + 1e-9);
  });
  it('NaN and negative dt leave pose unchanged', () => {
    const s = { x: 1, z: 2, heading: 0.5 };
    expect(step(s, { forward: 1, turn: 1 }, NaN)).toEqual(s);
    expect(step(s, { forward: 1, turn: 1 }, -1)).toEqual(s);
  });
  it('heading stays in (-pi, pi]', () => {
    let p = { x: 0, z: 0, heading: 0 };
    for (let i = 0; i < 200; i++) {
      p = step(p, { forward: 0, turn: 1 }, 0.05);
      expect(p.heading).toBeGreaterThan(-Math.PI);
      expect(p.heading).toBeLessThanOrEqual(Math.PI);
    }
    expect(step(p, NO_INPUT, 0.05)).toEqual(p);
  });
});
