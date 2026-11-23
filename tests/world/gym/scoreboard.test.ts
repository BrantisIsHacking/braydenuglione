import { describe, it, expect } from 'vitest';
import { jumbotronHeader, jumbotronLines, jumbotronIndex, wordmark, scoreboardLines } from '../../../src/world/interiors/gym/logic/scoreboard';
import { stations } from '../../../src/content/stations';
import { profile } from '../../../src/content/profile';

describe('scoreboard', () => {
  it('lines lead with the career line', () => {
    const l = scoreboardLines(stations);
    expect(l[0]).toBe('CAREER\n112 PTS / 26 GAMES');
    expect(l).toHaveLength(8);
  });
  it('header and wordmark', () => {
    expect(jumbotronHeader(profile)).toBe('BRAYDEN UGLIONE #29');
    expect(wordmark(profile)).toBe("UGLIONE '29");
  });
  it('lines', () => {
    const l = jumbotronLines(stations);
    expect(l).toHaveLength(4);
    expect(l[0]).toBe('TRANQUILITY BASE\n15 to 60 fps after baking Sun shadows on the GPU');
    expect(jumbotronLines(stations, ['nope', 'debate-mate'])).toEqual([]);
  });
  it('index', () => {
    expect(jumbotronIndex(0, 4)).toBe(0);
    expect(jumbotronIndex(6, 4)).toBe(1);
    expect(jumbotronIndex(25, 4)).toBe(0);
    expect(jumbotronIndex(5, 0)).toBe(-1);
    expect(jumbotronIndex(NaN, 4)).toBe(0);
    expect(jumbotronIndex(-3, 4)).toBe(0);
  });
});
