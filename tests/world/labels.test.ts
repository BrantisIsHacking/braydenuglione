import { describe, it, expect } from 'vitest';
import { nearestIds } from '../../src/world/logic/labels';

const ex = (id: string, x: number, z: number) => ({ id, pos: [x, z] as [number, number] });
describe('nearestIds', () => {
  it('empty -> []', () => expect(nearestIds({ x: 0, z: 0 }, [])).toEqual([]));
  it('sorted by distance', () => expect(nearestIds({ x: 0, z: 0 }, [ex('c', 5, 0), ex('a', 1, 0), ex('b', 3, 0)])).toEqual(['a', 'b', 'c']));
  it('ties broken by id', () => expect(nearestIds({ x: 0, z: 0 }, [ex('b', 0, 2), ex('a', 2, 0)])).toEqual(['a', 'b']));
  it('caps at 6 by default and honours n', () => {
    const many = Array.from({ length: 10 }, (_, i) => ex(`e${i}`, i + 1, 0));
    expect(nearestIds({ x: 0, z: 0 }, many)).toHaveLength(6);
    expect(nearestIds({ x: 0, z: 0 }, many, 2)).toEqual(['e0', 'e1']);
  });
});
