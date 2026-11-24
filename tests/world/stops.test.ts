import { describe, expect, it } from 'vitest';
import { hotStop, uncovered, withStops } from '../../src/world/logic/stops';
import { sceneGeometry } from '../../src/world/interiors/generic/geometry';
import { games } from '../../src/content/games';

describe('stops', () => {
  it('withStops appends stops and keeps everything else', () => {
    const g = sceneGeometry('library');
    const stop = { id: 'games', pos: [1, -9] as [number, number], focus: 'Halo' };
    const w = withStops(g, [stop]);
    expect(w.exhibits).toEqual([...g.exhibits, stop]);
    expect({ ...w, exhibits: [] }).toEqual({ ...g, exhibits: [] });
  });
  it('hotStop finds the stop in reach, else -1', () => {
    const s = [{ id: 'a', pos: [1, -9] as [number, number] }];
    expect(hotStop(s, { x: 1, z: -7.5 })).toBe(0);
    expect(hotStop(s, { x: 1, z: -5 })).toBe(-1);
  });
  it('uncovered lists keys no stop or extra covers', () => {
    const titles = games.map((g) => g.title);
    const focuses = titles.filter((t) => t !== 'Halo' && t !== 'Rocket League' && t !== 'FIFA');
    expect(uncovered('games', focuses, ['Rocket League', 'FIFA'])).toEqual(['Halo']);
    expect(uncovered('teams', ['Giants'])).toHaveLength(9);
  });
});
