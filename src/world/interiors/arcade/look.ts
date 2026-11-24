import { games } from '../../../content/games';
import type { ThemeColorKey } from '../../../content/types';
import type { SignSpec } from '../../kit/InteriorShell';
import { propAnchor, propCollider, type InteriorSpec } from '../../logic/interior';
import type { Rect } from '../../types';

export const WIDTH = 24;
export const LENGTH = 24;
export const WALL_HEIGHT = 4;

/** Cabinet grid: six per row, rows run north; ring and cabinet share the slot. `h` is the overall height with the topper. */
export const CAB = { cols: 6, x0: -7.5, pitch: 3, rows: [-8, -14, -20], w: 1.2, d: 0.9, h: 2.0 } as const;
export const CABINET_COLORS: readonly ThemeColorKey[] = ['teal', 'brick', 'offWhite', 'ink'];
/** Lit header on each cabinet (wider than the cabinet so long titles wrap to three lines at most); the title wraps inside `maxWidth`. */
export const MARQUEE = { size: 0.3, maxWidth: 1.8, y: 1.62, h: 1.3, w: 1.9, d: 0.8, color: 'ink' } as const;
/** Token counter prop sits at the `games` content position. */
export const COUNTER = { w: 2.4, d: 1.0, h: 1.0 } as const;
export const ARCADE_LOOK = { floor: 'offWhite', wall: 'brick', checker: 'teal', upper: 'offWhite' } as const satisfies Record<string, ThemeColorKey>;
export const TILE = 1.5;

export function cabinetSlot(i: number): [number, number] {
  return [CAB.x0 + (i % CAB.cols) * CAB.pitch, CAB.rows[Math.floor(i / CAB.cols)]];
}

export const SIGNS: readonly string[] = ['ARCADE'];
export const SIGN_SPECS: readonly SignSpec[] = [{ text: 'ARCADE', position: [0, 3.4, -23.85], board: 'ink' }];

/** The 3D text besides the sign: each game title on its marquee, from content. */
export const TEXT_LINES: string[] = games.map((g) => g.title);

/** The token counter, centred one prop-setback south of the `games` ring. */
export const COUNTER_POS: [number, number] = propAnchor([8.5, -3.5]);

export function cabinetColliders(): Rect[] {
  return games.map((_, i) => {
    const [x, z] = cabinetSlot(i);
    return { x, z, w: CAB.w, d: CAB.d };
  });
}

export const SPEC: InteriorSpec = {
  width: WIDTH,
  length: LENGTH,
  colliders: [...cabinetColliders(), propCollider([8.5, -3.5], COUNTER.w, COUNTER.d)],
  cameraDistance: 17,
  cameraSouthPad: 0.25,
};
