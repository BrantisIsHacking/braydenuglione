import { describe, it, expect } from 'vitest';
import { theme, effectiveTheme, gradientData } from '../../src/world/look/theme';

const KEYS = ['scarlet', 'ink', 'offWhite', 'stone', 'grass', 'path', 'sky', 'water', 'slate', 'brick', 'mustard', 'cinemaRed', 'warmGlow', 'teal', 'gymRed', 'hardwood', 'fairway', 'rack'];
const ALLOWED = [
  '#cc0033', '#0a0a0a', '#f4f0ea', '#ffffff', '#b0002a', '#fff6e8',
  ...Object.values(theme.accents).map((h) => h.toLowerCase()),
];
const neutral = (h: string) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  return Math.max(...c) - Math.min(...c) <= 0x20;
};
function hexes(v: unknown, path = '', out: [string, string][] = []) {
  if (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)) out.push([path, v.toLowerCase()]);
  else if (Array.isArray(v)) v.forEach((x, i) => hexes(x, `${path}[${i}]`, out));
  else if (v && typeof v === 'object')
    for (const [k, x] of Object.entries(v)) hexes(x, path ? `${path}.${k}` : k, out);
  return out;
}

describe('gradientData', () => {
  it('encodes valid ramps', () => {
    expect(gradientData([70, 160, 255])).toEqual(new Uint8Array([70, 160, 255]));
  });
  it('rejects invalid ramps', () => {
    for (const bad of [[255, 70], [70], [70, 300], [1.5, 2], [1, 2, 3, 4, 5, 6]])
      expect(() => gradientData(bad)).toThrow();
  });
});

describe('theme', () => {
  it('uses only palette or neutral hexes (court excepted)', () => {
    for (const [p, h] of hexes(theme)) {
      if (p === 'colors.court') continue;
      expect(ALLOWED.includes(h) || neutral(h), `${p} ${h}`).toBe(true);
    }
  });
  it('accents are exactly the 18 theme color keys', () => {
    expect(Object.keys(theme.accents).sort()).toEqual([...KEYS].sort());
  });
  it('crowd weights are consistent', () => {
    const sum = theme.crowd.weights.reduce((a, b) => a + b, 0);
    expect(Math.abs(sum - 1)).toBeLessThan(1e-9);
    expect(theme.crowd.weights.length).toBe(theme.crowd.colors.length);
    expect(theme.crowd.colors.map((c) => c.toLowerCase())).toContain('#cc0033');
  });
});

describe('effectiveTheme', () => {
  it('reduced motion', () => {
    const t = effectiveTheme(theme, { reducedMotion: true, lowPower: false });
    expect(t.pulse.amp).toBe(0);
    expect(t.crowd.sway).toBe(0);
    expect(t.bloom.intensity).toBeCloseTo(0.3, 9);
  });
  it('low power', () => {
    const t = effectiveTheme(theme, { reducedMotion: false, lowPower: true });
    expect(t.bloom.intensity).toBe(0);
    expect(t.crowd.sway).toBe(0);
  });
  it('neither equals theme, never mutates', () => {
    const snap = JSON.parse(JSON.stringify(theme));
    expect(effectiveTheme(theme, { reducedMotion: false, lowPower: false })).toEqual(theme);
    effectiveTheme(theme, { reducedMotion: true, lowPower: true });
    expect(JSON.parse(JSON.stringify(theme))).toEqual(snap);
  });
});
