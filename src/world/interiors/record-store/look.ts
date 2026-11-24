import { artists } from '../../../content/artists';
import type { ThemeColorKey } from '../../../content/types';
import type { SignSpec } from '../../kit/InteriorShell';
import type { InstanceItem } from '../../kit/instancing';
import type { BatchShape } from '../../kit/ShapeBatch';
import type { InteriorSpec } from '../../logic/interior';
import { propAnchor } from '../../logic/interior';

export const WIDTH = 26;
export const LENGTH = 38;
export const WALL_HEIGHT = 3.6;

export const RECORD_LOOK = { floor: 'hardwood', wall: 'brick', neon: 'warmGlow' } as const satisfies Record<string, ThemeColorKey>;

/**
 * The stacks: one bin per artist in owner rank order, rows run north, columns alternate a 1.5 m shift
 * so each standing spot (1.5 m south of a ring) falls between the bins of the row in front of it.
 */
export const STACKS = { cols: 8, pitch: 3, rowPitch: 3, z0: -20, xEven: -11.25, xOdd: -9.75, bin: { w: 1.6, d: 0.8, h: 0.8 } } as const;
export const SLEEVE = { size: 1.1, y: 0.8 + 0.55 } as const;

/** Where the walk-in listening booth sits. The turntable and desk are props only: the Frission playlist exhibit rings in front of it and its panel holds the click-to-load Spotify player. */
export const BOOTH = { x: 9.5, z: -5, w: 2.4, d: 1.6, screen: [9.5, 1.9, -5.7] as [number, number, number] } as const;
/** The front counter (west) with its turntable. */
export const COUNTER = { x: -10, z: -6, w: 1.4, d: 5 } as const;
/** The karaoke platform, behind its ring at `[5.5, -10]`. */
export const STAGE_PLATFORM = { x: 7.75, z: -15.25, w: 7.5, d: 3.5, h: 0.5 } as const;

export const SIGNS: readonly string[] = ['RECORDS', 'TOP 12', 'STAGE', 'FRISSION'];

export const SIGN_SPECS: readonly SignSpec[] = [
  { text: 'RECORDS', position: [-12.85, 2.5, -10], rotationY: Math.PI / 2, board: 'warmGlow' },
  { text: 'TOP 12', position: [-12.85, 2.4, -22], rotationY: Math.PI / 2, board: 'mustard', size: 0.4 },
  { text: 'STAGE', position: [12.85, 2.5, -15], rotationY: -Math.PI / 2, board: 'ink' },
  { text: 'FRISSION', position: [BOOTH.screen[0], BOOTH.screen[1], BOOTH.screen[2] + 0.2], rotationY: 0, board: 'ink', size: 0.3 },
];

/** Content-derived 3D text: none per sleeve (artist names live in the HTML prompt and panel). */
export const TEXT_LINES: readonly string[] = [];
/** 3D text objects: the signs plus at most three exhibit labels (music, karaoke, frission). */
export const TEXT_OBJECTS = SIGNS.length + 3;

export type StackSlot = { index: number; artist: string; rank: number; row: number; col: number; pos: [number, number] };
/** Artist i (rank i + 1) at its ring position; ranks 1 to 8 on the row nearest the entrance. */
export function stackSlots(list: readonly string[] = artists): StackSlot[] {
  return list.map((artist, index) => {
    const row = Math.floor(index / STACKS.cols);
    const col = index % STACKS.cols;
    const x = (row % 2 === 0 ? STACKS.xEven : STACKS.xOdd) + col * STACKS.pitch;
    return { index, artist, rank: index + 1, row, col, pos: [x, STACKS.z0 - row * STACKS.rowPitch] as [number, number] };
  });
}

const BG: readonly ThemeColorKey[] = ['brick', 'mustard', 'teal', 'slate', 'offWhite'];
/** Original colour-block sleeve: background, disc colour, disc offset (-1, 0, 1) and stripe orientation. Never album art. */
export function sleeveDesign(i: number): { bg: ThemeColorKey; disc: ThemeColorKey; dx: number; vertical: boolean } {
  const bgI = i % BG.length;
  const discI = (bgI + 1 + (Math.floor(i / BG.length) % 3)) % BG.length; // offset 1..3 never equals bgI
  return { bg: BG[bgI], disc: BG[discI], dx: (i % 3) - 1, vertical: i % 2 === 0 };
}

export type BatchSpec = { key: string; shape: BatchShape; color: ThemeColorKey; glow?: number; items: InstanceItem[] };

/** Every non-text solid, grouped one batch per shape/colour/glow (one draw call each). */
export function buildBatches(): BatchSpec[] {
  const map = new Map<string, BatchSpec>();
  const add = (shape: BatchShape, color: ThemeColorKey, item: InstanceItem, glow?: number) => {
    const key = `${shape}:${color}:${glow ?? 0}`;
    let b = map.get(key);
    if (!b) map.set(key, (b = { key, shape, color, ...(glow ? { glow } : {}), items: [] }));
    b.items.push(item);
  };
  const box = (c: ThemeColorKey, x: number, y: number, z: number, sx: number, sy: number, sz: number, glow?: number) =>
    add('box', c, { x, y, z, sx, sy, sz }, glow);
  const cyl = (c: ThemeColorKey, x: number, y: number, z: number, sx: number, sy: number, sz: number) =>
    add('cylinder', c, { x, y, z, sx, sy, sz });

  // stacks: a bin per artist with an upright colour-block sleeve facing south
  const { bin } = STACKS;
  for (const s of stackSlots()) {
    const [ax, az] = propAnchor(s.pos);
    const d = sleeveDesign(s.index);
    box('hardwood', ax, bin.h / 2, az, bin.w, bin.h, bin.d);
    box('ink', ax, bin.h + 0.02, az + 0.1, bin.w - 0.1, 0.04, bin.d - 0.3); // record edges
    const sz = az + 0.2;
    box(d.bg, ax, SLEEVE.y, sz, SLEEVE.size, SLEEVE.size, 0.06);
    add('sphere', d.disc, { x: ax + d.dx * 0.12, y: SLEEVE.y + 0.08, z: sz + 0.05, sx: 0.62, sy: 0.62, sz: 0.04 });
    if (d.vertical) box('ink', ax - 0.4, SLEEVE.y, sz + 0.04, 0.1, SLEEVE.size - 0.1, 0.02);
    else box('ink', ax, SLEEVE.y - 0.4, sz + 0.04, SLEEVE.size - 0.1, 0.1, 0.02);
  }

  // wall neon (static)
  box(RECORD_LOOK.neon, 0, 3.0, -LENGTH + 0.08, WIDTH - 1, 0.14, 0.1, 1);
  for (const s of [-1, 1]) box(RECORD_LOOK.neon, s * (WIDTH / 2 - 0.08), 3.0, -LENGTH / 2, 0.1, 0.14, LENGTH - 1, 1);

  // front counter (west) with turntable
  box('ink', COUNTER.x, 0.55, COUNTER.z, COUNTER.w - 0.2, 1.1, COUNTER.d);
  box('hardwood', COUNTER.x, 1.14, COUNTER.z, COUNTER.w, 0.08, COUNTER.d + 0.2);
  box('slate', COUNTER.x, 1.25, COUNTER.z + 0.6, 0.9, 0.14, 1.1);
  cyl('ink', COUNTER.x, 1.34, COUNTER.z + 0.6, 0.8, 0.04, 0.8);
  cyl('brick', COUNTER.x, 1.37, COUNTER.z + 0.6, 0.26, 0.04, 0.26);
  box('stone', COUNTER.x + 0.3, 1.38, COUNTER.z + 0.2, 0.05, 0.05, 0.6); // tonearm

  // crates before the sleeve wall: two rows of record edges (music, no focus)
  const [cx, cz] = propAnchor([-4, -11]);
  box('hardwood', cx, 0.35, cz - 0.3, 3, 0.7, 0.55);
  box('hardwood', cx, 0.35, cz + 0.3, 3, 0.7, 0.55);
  for (let k = 0; k < 11; k++) {
    const ex = cx - 1.3 + k * 0.26;
    box(k % 2 ? 'mustard' : 'offWhite', ex, 0.75, cz - 0.3, 0.05, 0.28, 0.4);
    box(k % 2 ? 'teal' : 'brick', ex, 0.75, cz + 0.3, 0.05, 0.28, 0.4);
  }

  // karaoke stage
  const st = STAGE_PLATFORM;
  box('ink', st.x, st.h / 2, st.z, st.w, st.h, st.d);
  box('brick', st.x, st.h + 0.01, st.z + st.d / 2 - 0.15, st.w, 0.02, 0.3);
  for (const s of [-1, 1]) box('slate', st.x + s * 3.2, st.h + 0.6, st.z - 0.8, 0.8, 1.2, 0.7);
  box('warmGlow', st.x, 1.8, st.z - st.d / 2 + 0.15, 4.4, 1.5, 0.1, 1); // lyric screen (glow, no text)
  const [mx, mz] = propAnchor([5.5, -10]);
  cyl('stone', mx, 0.7, mz, 0.06, 1.4, 0.06);
  cyl('ink', mx, 0.04, mz, 0.5, 0.08, 0.5);
  add('sphere', 'ink', { x: mx, y: 1.5, z: mz, sx: 0.24, sy: 0.24, sz: 0.24 });

  // listening booth (east): desk, turntable, headphones, and an dark screen frame (FRISSION sign above)
  box('ink', BOOTH.x, 0.5, BOOTH.z, BOOTH.w, 1.0, BOOTH.d);
  box('hardwood', BOOTH.x, 1.04, BOOTH.z, BOOTH.w + 0.2, 0.08, BOOTH.d + 0.2);
  cyl('ink', BOOTH.x - 0.5, 1.12, BOOTH.z + 0.1, 0.8, 0.06, 0.8);
  cyl('mustard', BOOTH.x - 0.5, 1.16, BOOTH.z + 0.1, 0.26, 0.04, 0.26);
  box('slate', BOOTH.x + 0.7, 1.15, BOOTH.z + 0.1, 0.5, 0.14, 0.6);
  box('slate', BOOTH.x + 0.7, 1.4, BOOTH.z + 0.1, 0.7, 0.08, 0.1); // headphone band
  box('slate', BOOTH.screen[0], BOOTH.screen[1], BOOTH.screen[2], 2.0, 1.1, 0.12);
  box('ink', BOOTH.screen[0], BOOTH.screen[1], BOOTH.screen[2] + 0.07, 1.8, 0.9, 0.03);
  box('warmGlow', BOOTH.screen[0], 2.65, BOOTH.screen[2], 1.2, 0.1, 0.1, 1);

  // floor runner from the door to the stacks
  box('brick', 0, 0.01, -19, 2.4, 0.02, 36);
  return [...map.values()];
}

export const SPEC: InteriorSpec = {
  width: WIDTH,
  length: LENGTH,
  colliders: [
    { x: COUNTER.x, z: COUNTER.z, w: COUNTER.w, d: COUNTER.d },
    { x: BOOTH.x, z: BOOTH.z, w: BOOTH.w, d: BOOTH.d },
    { x: -4, z: -12.6, w: 3, d: 1.2 },
    { x: STAGE_PLATFORM.x, z: STAGE_PLATFORM.z, w: STAGE_PLATFORM.w, d: STAGE_PLATFORM.d },
    ...stackSlots().map((s) => {
      const [x, z] = propAnchor(s.pos);
      return { x, z, w: STACKS.bin.w, d: STACKS.bin.d };
    }),
  ],
  cameraDistance: 14,
  cameraSouthPad: 1,
};
