import { describe, expect, it } from 'vitest';
import { profile } from '../../../src/content';
import { isFontSafe } from '../../../src/world/logic/fontSafe';
import { wordmark } from '../../../src/world/interiors/gym/logic/scoreboard';

describe('court look strings', () => {
  it('centre-court wordmark is font-safe', () => {
    expect(wordmark(profile)).toBe("UGLIONE '29");
    expect(isFontSafe(wordmark(profile))).toBe(true);
  });
});
