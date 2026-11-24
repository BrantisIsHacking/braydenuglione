import { teams } from '../../../content/teams';
import type { Team, ThemeColorKey } from '../../../content/types';
import type { SignSpec } from '../../kit/InteriorShell';
import type { InstanceItem } from '../../kit/instancing';
import type { BatchShape } from '../../kit/ShapeBatch';
import { propAnchor, propCollider, type InteriorSpec } from '../../logic/interior';

export const WIDTH = 18;
export const LENGTH = 16;
export const WALL_HEIGHT = 3.6;

export const FAN_LOOK = { floor: 'path', wall: 'offWhite' } as const satisfies Record<string, ThemeColorKey>;

/**
 * Each club's real kit colours (primary / secondary), the one place the Fan Shop leaves the two-accent rule.
 * Colour only: no crest, name, wordmark or number is ever drawn on a garment.
 */
export const TEAM_COLORS: Readonly<Record<string, { primary: string; secondary: string }>> = {
  Giants: { primary: '#0b2265', secondary: '#a71930' },
  Knicks: { primary: '#006bb6', secondary: '#f58426' },
  Yankees: { primary: '#0c2340', secondary: '#c4ced3' },
  Rangers: { primary: '#0038a8', secondary: '#ce1126' },
  'Manchester City': { primary: '#6cabdd', secondary: '#1c2c5b' },
  Barcelona: { primary: '#a50044', secondary: '#004d98' },
  'Bayern Munich': { primary: '#dc052d', secondary: '#0066b2' },
  Juventus: { primary: '#111111', secondary: '#ffffff' },
  'NY Red Bulls': { primary: '#ed1e36', secondary: '#23326a' },
  NYCFC: { primary: '#6cace4', secondary: '#041e42' },
};

export const SIGNS: readonly string[] = ['FAN SHOP', 'JERSEYS', 'SCARVES'];

export const SIGN_SPECS: readonly SignSpec[] = [
  { text: 'FAN SHOP', position: [0, 3.0, -15.85], board: 'rack' },
  { text: 'JERSEYS', position: [-8.85, 2.9, -12], rotationY: Math.PI / 2, board: 'rack' },
  { text: 'SCARVES', position: [8.85, 2.9, -12], rotationY: -Math.PI / 2, board: 'rack' },
];

/** Non-soccer teams hang on the jersey rack, soccer clubs on the scarf wall, both in content order. */
export function jerseyTeams(list: readonly Team[] = teams): Team[] {
  return list.filter((t) => t.sport !== 'soccer');
}
export function scarfTeams(list: readonly Team[] = teams): Team[] {
  return list.filter((t) => t.sport === 'soccer');
}

/** The only non-sign 3D text: team names, on tags beside the garments (never on them). */
export const TEXT_LINES: readonly string[] = [...jerseyTeams(), ...scarfTeams()].map((t) => t.name);

export const JERSEY_STOP: [number, number] = [-5, -12];
export const SCARF_STOP: [number, number] = [5, -12];
export const COUNTER_POS: [number, number] = [0, -6];

const JERSEY = { pitch: 0.75, railY: 2.1 } as const;
export const SCARF = { x0: 1.9, pitch: 1.25, z: -15.86, top: 3.0, h: 1.6 } as const;

/** Hanging tag position (above the rail, staggered so neighbours never overlap). */
export function jerseyTag(i: number): [number, number, number] {
  const [ax, az] = propAnchor(JERSEY_STOP);
  return [ax + (i - 1.5) * JERSEY.pitch, i % 2 === 0 ? 2.4 : 2.85, az + 0.1];
}
export function scarfTag(i: number): [number, number, number] {
  return [SCARF.x0 + i * SCARF.pitch, 1.05, SCARF.z + 0.06];
}

export type Garment = { shape: 'box'; color: string; item: InstanceItem };

/** Every team-coloured solid: jerseys, scarves, folded stacks, caps. Hex colours, one instanced draw call. */
export function buildGarments(): Garment[] {
  const out: Garment[] = [];
  const add = (color: string, x: number, y: number, z: number, sx: number, sy: number, sz: number) =>
    out.push({ shape: 'box', color, item: { x, y, z, sx, sy, sz } });
  const [ax, az] = propAnchor(JERSEY_STOP);
  jerseyTeams().forEach((t, i) => {
    const c = TEAM_COLORS[t.name];
    const x = ax + (i - 1.5) * JERSEY.pitch;
    const z = az;
    add(c.primary, x, 1.5, z, 0.5, 0.8, 0.16); // torso
    add(c.primary, x - 0.34, 1.77, z, 0.18, 0.28, 0.16); // sleeves
    add(c.primary, x + 0.34, 1.77, z, 0.18, 0.28, 0.16);
    add(c.secondary, x, 1.13, z + 0.01, 0.51, 0.08, 0.17); // hem band
    add(c.secondary, x - 0.34, 1.65, z + 0.01, 0.19, 0.05, 0.17); // cuffs
    add(c.secondary, x + 0.34, 1.65, z + 0.01, 0.19, 0.05, 0.17);
    add(c.secondary, x, 1.9, z + 0.01, 0.2, 0.05, 0.17); // collar
  });
  scarfTeams().forEach((t, i) => {
    const c = TEAM_COLORS[t.name];
    const x = SCARF.x0 + i * SCARF.pitch;
    const y = SCARF.top - SCARF.h / 2;
    add(c.primary, x, y, SCARF.z, 0.5, SCARF.h, 0.05);
    add(c.secondary, x, SCARF.top - SCARF.h + 0.55, SCARF.z + 0.01, 0.51, 0.12, 0.05);
    add(c.secondary, x, SCARF.top - SCARF.h + 0.8, SCARF.z + 0.01, 0.51, 0.12, 0.05);
    add(c.secondary, x, SCARF.top - SCARF.h - 0.04, SCARF.z, 0.5, 0.1, 0.05); // fringe
  });
  // folded scarf stacks on the display bench
  const [bx, bz] = propAnchor(SCARF_STOP);
  scarfTeams().forEach((t, i) => {
    const c = TEAM_COLORS[t.name];
    const x = bx - 1.25 + i * 0.5;
    add(c.primary, x, 0.52, bz, 0.4, 0.08, 0.34);
    add(c.secondary, x, 0.6, bz, 0.4, 0.06, 0.34);
  });
  // folded shirts on the two side tables
  for (const side of [-1, 1] as const) {
    const names = side < 0 ? jerseyTeams() : scarfTeams().slice(0, 4);
    names.forEach((t, i) => {
      const c = TEAM_COLORS[t.name];
      const x = side * 6.5 + (i - (names.length - 1) / 2) * 0.42;
      add(c.primary, x, 0.97, -5.5, 0.36, 0.1, 0.32);
      add(c.secondary, x, 1.05, -5.5, 0.36, 0.06, 0.32);
    });
  }
  // caps along the west wall, below the JERSEYS sign
  teams.forEach((t, i) => {
    const c = TEAM_COLORS[t.name];
    const z = -3.4 - i * 0.55;
    add(c.primary, -8.7, 1.45, z, 0.3, 0.14, 0.36);
    add(c.secondary, -8.55, 1.4, z, 0.14, 0.04, 0.3);
  });
  return out;
}

export type BatchSpec = { key: string; shape: BatchShape; color: ThemeColorKey; glow?: number; outline?: boolean; items: InstanceItem[] };

/** Palette solids grouped one batch per shape/colour/outline (one draw call each). */
export function buildBatches(): BatchSpec[] {
  const map = new Map<string, BatchSpec>();
  const add = (shape: BatchShape, color: ThemeColorKey, item: InstanceItem, outline = false, glow?: number) => {
    const key = `${shape}:${color}:${outline ? 1 : 0}:${glow ?? 0}`;
    let b = map.get(key);
    if (!b) map.set(key, (b = { key, shape, color, ...(glow ? { glow } : {}), ...(outline ? { outline } : {}), items: [] }));
    b.items.push(item);
  };
  const box = (c: ThemeColorKey, x: number, y: number, z: number, sx: number, sy: number, sz: number, outline = false, glow?: number) =>
    add('box', c, { x, y, z, sx, sy, sz }, outline, glow);

  // floor: stone checks and a path rug from the door to the counter
  for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++) if ((i + j) % 2 === 0) box('offWhite', -7.5 + i * 3, 0.006, -1.5 - j * 3, 3, 0.012, 3);
  box('slate', 0, 0.02, -6, 3.2, 0.03, 4.4);
  // checkout counter
  const [cx, cz] = propAnchor(COUNTER_POS);
  box('rack', cx, 0.5, cz, 2.6, 1.0, 0.9, true);
  box('hardwood', cx, 1.04, cz, 2.8, 0.08, 1.0);
  box('ink', cx - 0.6, 1.2, cz, 0.45, 0.25, 0.3); // register
  box('scarlet', cx + 0.7, 1.12, cz, 0.5, 0.07, 0.4);
  // jersey rack: two posts, a rail, feet and a hanger per jersey
  const [jx, jz] = propAnchor(JERSEY_STOP);
  for (const s of [-1, 1]) {
    add('cylinder', 'rack', { x: jx + s * 1.6, y: 1.1, z: jz, sx: 0.07, sy: 2.2, sz: 0.07 }, true);
    box('rack', jx + s * 1.6, 0.04, jz, 0.5, 0.08, 0.5, true);
  }
  box('rack', jx, JERSEY.railY, jz, 3.3, 0.06, 0.06, true);
  jerseyTeams().forEach((_, i) => box('ink', jx + (i - 1.5) * JERSEY.pitch, 2.02, jz, 0.04, 0.12, 0.04));
  // tag boards (the names sit on these, beside the garments)
  jerseyTeams().forEach((_, i) => {
    const [tx, ty, tz] = jerseyTag(i);
    box('offWhite', tx, ty, tz - 0.03, 0.68, 0.3, 0.04);
  });
  scarfTeams().forEach((_, i) => {
    const [tx, ty, tz] = scarfTag(i);
    box('stone', tx, ty, tz - 0.03, 1.2, 0.34, 0.03);
  });
  // scarf wall: hanging rail and the display bench with its stacks
  box('rack', 5, SCARF.top + 0.06, SCARF.z + 0.02, 7.6, 0.06, 0.06);
  const [bx, bz] = propAnchor(SCARF_STOP);
  box('hardwood', bx, 0.2, bz, 3.0, 0.4, 0.6, true);
  // side tables with folded shirts
  for (const s of [-1, 1]) {
    box('hardwood', s * 6.5, 0.9, -5.5, 1.8, 0.07, 0.9);
    for (const lx of [-0.8, 0.8]) for (const lz of [-0.35, 0.35]) add('cylinder', 'rack', { x: s * 6.5 + lx, y: 0.45, z: -5.5 + lz, sx: 0.07, sy: 0.9, sz: 0.07 });
  }
  // cap board on the west wall
  box('rack', -8.88, 1.45, -5.9, 0.08, 0.8, 5.8);
  teams.forEach((_, i) => add('cylinder', 'ink', { x: -8.78, y: 1.35, z: -3.4 - i * 0.55, sx: 0.04, sy: 0.04, sz: 0.04 }));
  return [...map.values()];
}

export const SPEC: InteriorSpec = {
  width: WIDTH,
  length: LENGTH,
  colliders: [
    propCollider(COUNTER_POS, 2.8, 1.1),
    propCollider(JERSEY_STOP, 3.0, 0.6),
    propCollider(SCARF_STOP, 3.0, 0.6),
    { x: -6.5, z: -5.5, w: 1.8, d: 0.9 },
    { x: 6.5, z: -5.5, w: 1.8, d: 0.9 },
  ],
  cameraDistance: 18,
  cameraSouthPad: 0.5,
};
