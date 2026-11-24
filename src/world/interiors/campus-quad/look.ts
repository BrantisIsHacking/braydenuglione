import { getStation } from '../../../content';
import type { Media } from '../../../content/types';
import type { SignSpec } from '../../kit/InteriorShell';

export const SIGNS: readonly string[] = ['CAMPUS QUAD', 'HONORS HALL', 'SCREENING ROOM', 'HIGH SCHOOL WING', 'ROBOTICS LAB'];

/** Lawn, paths, hedge and trim; colours come from theme.accents keys only. */
export const QUAD_LOOK = {
  floor: 'grass',
  wall: 'offWhite',
  trim: 'scarlet',
  path: 'path',
  hedge: 'fairway',
  trunk: 'brick',
  wallHeight: 3.2,
} as const;

const robotics = getStation('robotics')!;
/** The team photo (never the logo). */
export const ROBOTICS_PHOTO: Media = robotics.media.find((m) => m.src.endsWith('/team-photo.webp'))!;
/** The documentary screen shows the poster only. */
export const SCREEN_MEDIA: Media = getStation('critics-choice')!.video!.poster;

export const SIGN_SPECS: readonly SignSpec[] = [
  { text: 'CAMPUS QUAD', position: [-5, 0.95, -0.9], board: 'scarlet', size: 0.4 },
  { text: 'HONORS HALL', position: [-8, 3.0, -19.8], board: 'scarlet', size: 0.4 },
  { text: 'SCREENING ROOM', position: [0, 3.1, -19.8], board: 'ink', size: 0.4 },
  { text: 'HIGH SCHOOL WING', position: [-5.5, 1.3, -12.35], board: 'scarlet', size: 0.35 },
  { text: 'ROBOTICS LAB', position: [-10, 3.1, -11.5], board: 'ink', size: 0.35 },
];
