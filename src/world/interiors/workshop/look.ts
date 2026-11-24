import type { SignSpec } from '../../kit/InteriorShell';

/** Colours are theme.accents keys only. */
export const WORKSHOP_LOOK = {
  floor: 'slate',
  wall: 'offWhite',
  wallHeight: 3.6,
} as const;

/** Relative bar heights: the airbnb result of about 21,000 vs 7,000. Bars carry no numbers or text. */
export const CHART_BARS: readonly [number, number] = [3, 1];

export const SIGNS: readonly string[] = ['WORKSHOP'];
export const WORKSHOP_SIGNS: readonly SignSpec[] = [{ text: 'WORKSHOP', position: [0, 2.6, -15.85], board: 'ink' }];
