import { describe, it, expect } from 'vitest';
import { VISITED_KEY, loadVisited, saveVisited } from '../../src/arena/logic/visited';

const fake = (init: Record<string, string> = {}) => {
  const m = new Map(Object.entries(init));
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) } as unknown as Storage;
};
const valid = new Set(['robotics', 'ccm']);
const thrower = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } } as unknown as Storage;

describe('visited', () => {
  it('round-trips', () => {
    const s = fake();
    saveVisited(s, ['robotics']);
    expect(loadVisited(s, valid)).toEqual(['robotics']);
  });
  it('missing key', () => expect(loadVisited(fake(), valid)).toEqual([]));
  it('malformed JSON', () => expect(loadVisited(fake({ [VISITED_KEY]: '{' }), valid)).toEqual([]));
  it('non-array JSON', () => expect(loadVisited(fake({ [VISITED_KEY]: '{"a":1}' }), valid)).toEqual([]));
  it('drops unknown and duplicates', () => {
    const s = fake({ [VISITED_KEY]: JSON.stringify(['robotics', 'nope', 'robotics', 5, 'ccm']) });
    expect(loadVisited(s, valid)).toEqual(['robotics', 'ccm']);
  });
  it('caps at 24', () => {
    const ids = Array.from({ length: 40 }, (_, i) => `s${i}`);
    expect(loadVisited(fake({ [VISITED_KEY]: JSON.stringify(ids) }), new Set(ids)).length).toBe(24);
  });
  it('null storage', () => {
    expect(loadVisited(null, valid)).toEqual([]);
    expect(() => saveVisited(null, ['ccm'])).not.toThrow();
  });
  it('throwing storage', () => {
    expect(loadVisited(thrower, valid)).toEqual([]);
    expect(() => saveVisited(thrower, ['ccm'])).not.toThrow();
  });
});
