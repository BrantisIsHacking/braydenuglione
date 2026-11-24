import { describe, it, expect } from 'vitest';
import { nearest, inReach } from '../../src/world/logic/proximity';
const placed = [{ id: 'tranquility-base', pos: [5.7, 0] as [number, number] }];

describe('proximity', () => {
  it('finds closest', () => {
    const r = nearest({ x: 0, z: 0 }, [{ id: 'a', pos: [3, 4] }, { id: 'b', pos: [1, 1] }]);
    expect(r?.id).toBe('b');
    expect(r!.dist).toBeCloseTo(Math.SQRT2);
  });
  it('empty list is null', () => expect(nearest({ x: 0, z: 0 }, [])).toBeNull());
  it('inReach boundary', () => {
    expect(inReach(2)).toBe(true);
    expect(inReach(2.01)).toBe(false);
  });
  it('walk path to tranquility-base', () => {
    const far = nearest({ x: 3.6, z: 0 }, placed)!;
    expect(inReach(far.dist)).toBe(false);
    const near = nearest({ x: 3.8, z: 0 }, placed)!;
    expect(near.id).toBe('tranquility-base');
    expect(inReach(near.dist)).toBe(true);
  });
});

describe('proximity focus', () => {
  it('carries the focus of the nearest placement', () => {
    const r = nearest({ x: 0, z: 0 }, [{ id: 'games', pos: [0, -1], focus: 'Halo' }, { id: 'games', pos: [0, -5], focus: 'Halo 2' }]);
    expect(r).toEqual({ id: 'games', dist: 1, focus: 'Halo' });
  });
});
