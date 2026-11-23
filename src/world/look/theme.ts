import type { District, ThemeColorKey } from '../../content/types';

export type Theme = {
  palette: { scarlet: string; ink: string; line: string; neon: string };
  colors: { court: string; floor: string; stand: string; background: string; prop: string; dark: string };
  fog: { color: string; near: number; far: number } | null;
  gradient: number[];
  outline: { color: string; thickness: number; hullScale: number };
  bloom: { intensity: number; threshold: number; smoothing: number; radius: number; multisampling: number };
  neon: { line: number; ring: number; ringIdle: number; ringHot: number };
  pulse: { amp: number; hz: number };
  lights: {
    ambient: number;
    hemi: { sky: string; ground: string; intensity: number };
    dir: { pos: [number, number, number]; intensity: number };
    spot: {
      pos: [number, number, number];
      intensity: number;
      angle: number;
      penumbra: number;
      distance: number;
      decay: number;
      color: string;
    };
  };
  crowd: { colors: string[]; weights: number[]; sway: number; swayHz: number };
  reducedBloomScale: number;
  accents: Record<ThemeColorKey, string>;
  districts: Record<District, { wall: ThemeColorKey; trim: ThemeColorKey; ground: ThemeColorKey }>;
  daylight: {
    background: string;
    ambient: number;
    hemi: { sky: string; ground: string; intensity: number };
    dir: { pos: [number, number, number]; intensity: number };
    bloomThreshold: number;
  };
  /** Board accents light enough to take ink sign text (others take off-white). */
  lightBoards: ThemeColorKey[];
};

export const theme: Theme = {
  palette: { scarlet: '#cc0033', ink: '#0a0a0a', line: '#f4f0ea', neon: '#b0002a' },
  colors: {
    court: '#8a5a34',
    floor: '#2a2a2e',
    stand: '#444449',
    background: '#1b1c22',
    prop: '#8a8a8a',
    dark: '#0a0a0a',
  },
  fog: null,
  gradient: [70, 160, 255],
  outline: { color: '#0a0a0a', thickness: 0.015, hullScale: 0.08 },
  bloom: { intensity: 0.5, threshold: 0.5, smoothing: 0.1, radius: 0.4, multisampling: 4 },
  neon: { line: 3.5, ring: 3.5, ringIdle: 0.35, ringHot: 1.4 },
  pulse: { amp: 0.06, hz: 0.4 },
  lights: {
    ambient: 0.9,
    hemi: { sky: '#ffffff', ground: '#555566', intensity: 0.5 },
    dir: { pos: [0, 14, 3], intensity: 0.5 },
    spot: { pos: [0, 16, 0], intensity: 300, angle: 0.75, penumbra: 0.5, distance: 40, decay: 2, color: '#fff6e8' },
  },
  crowd: {
    colors: ['#2a2a2a', '#8a8a8a', '#cc0033', '#f4f0ea'],
    weights: [0.4, 0.25, 0.25, 0.1],
    sway: 0.04,
    swayHz: 0.6,
  },
  reducedBloomScale: 0.6,
  accents: {
    scarlet: '#cc0033', ink: '#0a0a0a', offWhite: '#f4f0ea', stone: '#a29e97', grass: '#7d8f6a', path: '#c9bfae',
    sky: '#bcd3e0', water: '#7fa7b8', slate: '#3c3f46', brick: '#8e3b2e', mustard: '#d4a537', cinemaRed: '#d7262e',
    warmGlow: '#ffcf7a', teal: '#2fb5a8', gymRed: '#b3121f', hardwood: '#d2a06a', fairway: '#5f8f4e', rack: '#6e6a64',
  },
  districts: {
    square: { wall: 'offWhite', trim: 'scarlet', ground: 'stone' },
    career: { wall: 'offWhite', trim: 'ink', ground: 'path' },
    culture: { wall: 'brick', trim: 'offWhite', ground: 'path' },
    sports: { wall: 'offWhite', trim: 'gymRed', ground: 'grass' },
  },
  daylight: {
    background: '#bcd3e0',
    ambient: 0.55,
    hemi: { sky: '#ffffff', ground: '#7d8f6a', intensity: 0.6 },
    dir: { pos: [-12, 24, 14], intensity: 1.1 },
    bloomThreshold: 0.9,
  },
  lightBoards: ['mustard', 'warmGlow', 'offWhite', 'teal', 'hardwood', 'stone', 'path'],
};

export function effectiveTheme(t: Theme, o: { reducedMotion: boolean; lowPower: boolean }): Theme {
  const c: Theme = structuredClone(t);
  if (o.reducedMotion) {
    c.pulse.amp = 0;
    c.crowd.sway = 0;
    c.bloom.intensity = t.bloom.intensity * t.reducedBloomScale;
  }
  if (o.lowPower) {
    c.bloom.intensity = 0;
    c.crowd.sway = 0;
  }
  return c;
}

export function gradientData(texels: readonly number[]): Uint8Array {
  if (texels.length < 2 || texels.length > 5) throw new Error('gradient needs 2-5 steps');
  for (let i = 0; i < texels.length; i++) {
    const v = texels[i];
    if (!Number.isInteger(v) || v < 0 || v > 255) throw new Error('gradient texels must be ints in [0,255]');
    if (i > 0 && v <= texels[i - 1]) throw new Error('gradient must be ascending');
  }
  return Uint8Array.from(texels);
}
