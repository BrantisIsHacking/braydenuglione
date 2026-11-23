import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { FONT_RANGES, isFontSafe, toFontSafe } from '../../src/world/logic/fontSafe';
import { stations } from '../../src/content/stations';
import { banners } from '../../src/content/banners';
import { profile } from '../../src/content/profile';
import { jumbotronHeader, jumbotronLines, wordmark } from '../../src/world/interiors/gym/logic/scoreboard';

function parseLatin(): Array<[number, number]> {
  const css = readFileSync('node_modules/@fontsource/barlow-condensed/800.css', 'utf8');
  const block = css.split('/* barlow-condensed-latin-800-normal */')[1];
  const m = /unicode-range:\s*([^;]+);/.exec(block)!;
  return m[1].split(',').map((t) => {
    const [a, b] = t.trim().replace(/U\+/g, '').split('-');
    return [parseInt(a, 16), parseInt(b ?? a, 16)] as [number, number];
  });
}

describe('fontSafe', () => {
  it('FONT_RANGES matches the fontsource latin block', () => {
    expect(FONT_RANGES.map(([a, b]) => [a, b])).toEqual(parseLatin());
  });
  it('detects and fixes the arrow', () => {
    expect(isFontSafe('15 → 60 fps')).toBe(false);
    expect(toFontSafe('15 → 60 fps')).toBe('15 to 60 fps');
    expect(toFontSafe('2026–27')).toBe('2026–27');
    expect(isFontSafe('a\nb')).toBe(true);
  });
  it('drops other unsafe chars and collapses spaces', () => {
    expect(toFontSafe('a ✓  b')).toBe('a b');
  });
  it('RF2: all 3D strings are font safe', () => {
    const strs = [
      ...stations.map((s) => s.title),
      ...banners.map((b) => `${b.year}
${b.title.toUpperCase()}
${b.issuer}`),
      jumbotronHeader(profile),
      ...jumbotronLines(stations),
      wordmark(profile),
      'LOCKER ROOM',
      String(profile.jersey),
    ];
    for (const s of strs) {
      expect(isFontSafe(s), s).toBe(true);
      expect(toFontSafe(s) === s || s.includes('→'), s).toBe(true);
    }
  });
});
