import type { Banner } from '../../../content/types';
import { toFontSafe } from '../../logic/fontSafe';
import type { SignSpec } from '../../kit/InteriorShell';

export const SIGNS = ['HALL OF FAME'] as const;

export const SIGN_SPECS: readonly SignSpec[] = [
  { text: 'HALL OF FAME', position: [0, 4.2, -15.85], board: 'scarlet' },
];

/** Cloth text: exactly the award title and year from content. */
export function bannerLines(bs: readonly Banner[]): string[] {
  return bs.map((b) => toFontSafe(`${b.title}\n${b.year}`));
}

export const FAME_LOOK = {
  floor: 'stone',
  wall: 'offWhite',
  wallHeight: 5,
  runnerColor: 'ink',
  pilaster: 'scarlet',
  trophy: 'mustard',
  clothY: 2.6,
  clothDz: 0.9,
  cloth: { w: 1.1, h: 1.8, d: 0.05 },
  screenWidth: 2.6,
  mirrorId: 'critics-choice',
} as const;
