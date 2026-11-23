import { describe, it, expect } from 'vitest';
import { instanceMatrices } from '../../src/world/kit/instancing';

describe('instanceMatrices', () => {
  it('writes translation and unit scale', () => {
    const m = instanceMatrices([{ x: 1, y: 2, z: 3 }]);
    expect(m.length).toBe(16);
    expect([m[12], m[13], m[14]]).toEqual([1, 2, 3]);
    expect([m[0], m[5], m[10], m[15]]).toEqual([1, 1, 1, 1]);
  });
  it('applies scale', () => {
    const m = instanceMatrices([{ x: 0, y: 0, z: 0, sx: 2, sy: 3, sz: 4 }]);
    expect([m[0], m[5], m[10]]).toEqual([2, 3, 4]);
  });
  it('rotY pi/2 maps +x to -z', () => {
    const m = instanceMatrices([{ x: 0, y: 0, z: 0, rotY: Math.PI / 2 }]);
    expect(m[0]).toBeCloseTo(0);
    expect(m[1]).toBeCloseTo(0);
    expect(m[2]).toBeCloseTo(-1);
  });
  it('16 floats per item', () => {
    expect(instanceMatrices([{ x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }]).length).toBe(32);
    expect(instanceMatrices([]).length).toBe(0);
  });
});
