import {
  BackSide,
  Color,
  DataTexture,
  MeshBasicMaterial,
  MeshToonMaterial,
  NearestFilter,
  RedFormat,
  type Material,
} from 'three';
import { gradientData, theme, type Theme } from '../look/theme';

export type MaterialKey =
  | 'floor' | 'court' | 'line' | 'prop' | 'dark' | 'accent' | 'accentHot' | 'neon' | 'net'
  | 'jersey' | 'shorts' | 'stand' | 'hull' | 'crowd' | 'banner' | 'bannerAlt' | 'screen';

function makeGradientMap(t: Theme): DataTexture {
  const data = gradientData(t.gradient);
  const tex = new DataTexture(data, data.length, 1, RedFormat);
  tex.minFilter = NearestFilter;
  tex.magFilter = NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

export const gradientMap: DataTexture = makeGradientMap(theme);

export const NEON_BASE = {
  neon: theme.neon.line,
  accent: theme.neon.ring * theme.neon.ringIdle,
  accentHot: theme.neon.ring * theme.neon.ringHot,
};

export function createMaterials(t: Theme): Record<MaterialKey, Material> {
  const toon = (color: string) => new MeshToonMaterial({ color, gradientMap });
  const glow = (intensity: number) =>
    new MeshToonMaterial({
      color: t.palette.scarlet,
      emissive: new Color(t.palette.neon),
      emissiveIntensity: intensity,
      gradientMap,
      toneMapped: false,
    });
  return {
    floor: toon(t.colors.floor),
    court: toon(t.colors.court),
    line: toon(t.palette.line),
    prop: toon(t.colors.prop),
    dark: toon(t.colors.dark),
    stand: toon(t.colors.stand),
    jersey: toon(t.palette.scarlet),
    shorts: toon('#0a0a0a'),
    banner: toon(t.palette.scarlet),
    bannerAlt: toon(t.palette.line),
    crowd: toon('#ffffff'),
    neon: glow(t.neon.line),
    accent: glow(t.neon.ring * t.neon.ringIdle),
    accentHot: glow(t.neon.ring * t.neon.ringHot),
    net: new MeshBasicMaterial({ color: t.palette.line, wireframe: true }),
    hull: new MeshBasicMaterial({ color: t.outline.color, side: BackSide }),
    screen: new MeshToonMaterial({
      color: '#0a0a0a',
      emissive: new Color(t.colors.background),
      emissiveIntensity: 0.6,
      gradientMap,
    }),
  };
}

export const materials: Record<MaterialKey, Material> = createMaterials(theme);
