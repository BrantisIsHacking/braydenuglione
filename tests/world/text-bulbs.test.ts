import { describe, expect, it } from 'vitest';
import { bulbLevel } from '../../src/world/logic/bulbs';
import { TEXT_CAP, textCount } from '../../src/world/logic/text';
import { CAPTION_MIN, captionSize } from '../../src/world/kit/Caption';

describe('text budget', () => {
  it('counts signs, lines and at most six labels', () => {
    expect(textCount({ signs: 1, lines: 18, labelled: 3 })).toBe(22);
    expect(textCount({ signs: 1, lines: 18, labelled: 9 })).toBe(25);
    expect(TEXT_CAP).toBe(24);
  });
  it('captions never go below the legible minimum', () => {
    expect(CAPTION_MIN).toBe(0.28);
    expect(captionSize(0.2)).toBe(0.28);
    expect(captionSize(0.4)).toBe(0.4);
  });
});

describe('bulbLevel', () => {
  it('still is fully lit', () => {
    for (const i of [0, 1, 2, 3, 4, 5]) for (const t of [0, 0.3, 7]) expect(bulbLevel(i, t, true)).toBe(1);
  });
  it('chases with period 3 bulbs in [0.25, 1]', () => {
    for (let i = 0; i < 9; i++) {
      expect(bulbLevel(i, 1.3, false)).toBe(bulbLevel(i + 3, 1.3, false));
      for (const t of [0, 0.4, 0.8, 2.2]) {
        const v = bulbLevel(i, t, false);
        expect(v).toBeGreaterThanOrEqual(0.25);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
    expect(bulbLevel(0, 0, false)).not.toBe(bulbLevel(0, 0.4, false));
  });
});
