import { describe, it, expect } from 'vitest';
import { seasonLabel } from '../../src/arena/logic/season';

describe('seasonLabel', () => {
  it.each([['2026-11', '2026–27'], ['2026-05', '2025–26'], ['2025-08', '2025–26'], ['1999-09', '1999–00']])('%s', (i, o) => {
    expect(seasonLabel(i)).toBe(o);
  });
});
