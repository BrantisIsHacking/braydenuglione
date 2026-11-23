import { theme } from '../../look/theme';

const a = theme.accents;

/** Every gym look value; colours come only from theme.accents. No emissive anywhere. */
export const GYM_LOOK = {
  hardwood: a.hardwood,
  key: a.gymRed,
  apron: a.slate,
  wall: a.offWhite,
  wallMortar: a.stone,
  truss: a.gymRed,
  bleacherA: a.gymRed,
  bleacherB: a.ink,
  scoreboard: a.gymRed,
  scoreboardScreen: a.ink,
  bannerA: a.gymRed,
  bannerB: a.ink,
  text: a.offWhite,
  table: a.ink,
  bench: a.gymRed,
  rim: a.gymRed,
  block: { w: 0.4, h: 0.2 },
  trusses: { count: 6, y: 10, w: 0.5, h: 0.7 },
  wallHeight: 12,
} as const;

export const GYM_BANNERS: readonly string[] = ['VARSITY\n2023–24', 'VARSITY\n2024–25', 'RISING STAR\n2023', '112\nCAREER POINTS', '12\nCAREER HIGH'];
export const SCORER_TEXT: readonly [string, string] = ['WELCOME', 'HOME OF #29'];
/**
 * Scorer's sign: a board standing at the table's scene-south end, facing the camera and tilted back so the text
 * reads left-to-right from the play camera (flat on the table top it read sideways). Gym-local frame:
 * centre z, width along local z, gap south of the table end, tilt in radians.
 */
export const SCORER_BOARD = { z: -8.8, w: 2, h: 0.95, d: 0.08, y: 0.75, gap: 0.2, tilt: 0.6, fontSize: [0.32, 0.26] } as const;
