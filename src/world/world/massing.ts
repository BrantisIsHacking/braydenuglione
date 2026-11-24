import { buildings } from '../../content/buildings';
import type { BuildingId, ThemeColorKey } from '../../content/types';
import { LOTS } from '../logic/layout';
import { theme } from '../look/theme';

/** Axis-aligned box: x, y, z = centre; w (x), h (y), d (z) = size. */
export type MassBox = { x: number; y: number; z: number; w: number; h: number; d: number; color: ThemeColorKey };

const INSET = 0.15;
const HEIGHT: Partial<Record<BuildingId, number>> = {
  'scouting-office': 3.2, 'hall-of-fame': 4.2, 'campus-quad': 5, 'hq-tower': 14, 'civic-center': 5, workshop: 4.5,
  library: 3.5, playhouse: 5, cinema: 5.5, 'record-store': 3.6, arcade: 4.4, gym: 7, 'fan-shop': 4, 'golf-clubhouse': 3,
};

/** Body (inset so accents can sit on the full footprint) + flat roof slab + up to two accent pieces. */
export function massingFor(id: BuildingId): MassBox[] {
  const lot = LOTS[id];
  const b = buildings.find((x) => x.id === id);
  if (!lot.door || !b || b.kind === 'spot') return [];
  const { x, z, w, d } = lot.rect;
  const dist = theme.districts[b.district];
  const south = z + d / 2;
  const box = (bx: number, by: number, bz: number, bw: number, bh: number, bd: number, color: ThemeColorKey): MassBox => ({ x: bx, y: by, z: bz, w: bw, h: bh, d: bd, color });
  const h = HEIGHT[id] ?? 4;
  const out: MassBox[] = [box(x, h / 2, z, w - 2 * INSET, h, d - 2 * INSET, dist.wall), box(x, h + 0.15, z, w, 0.3, d, dist.trim === 'ink' ? 'slate' : dist.trim)];
  switch (id) {
    case 'hall-of-fame':
      // Pillars stand a hair above the roof slab top and a hair behind its front face, so no face shares a plane with it.
      out.push(box(x - w / 2 + 0.6, (h + 0.34) / 2, south - 0.45, 0.8, h + 0.34, 0.8, 'stone'), box(x + w / 2 - 0.6, (h + 0.34) / 2, south - 0.45, 0.8, h + 0.34, 0.8, 'stone'));
      break;
    case 'campus-quad':
      out.push(box(x + w / 2 - 1.5, h + 1.8, z, 1.8, 3.6, 1.8, 'scarlet'));
      break;
    case 'hq-tower':
      out.push(box(x, h * 0.5, z, w, 0.6, d, 'slate'), box(x, h * 0.8, z, w, 0.6, d, 'slate'));
      break;
    case 'civic-center':
      out.push(box(x, 0.25, south - 0.6, 5, 0.5, 1.2, 'stone'));
      break;
    case 'workshop':
      out.push(box(x - w / 2 + 1.2, h + 1.6, z, 1, 3.2, 1, 'slate'));
      break;
    case 'cinema':
      out.push(box(x, 5.4, south - 0.15, w, 0.2, 0.3, 'cinemaRed'));
      break;
    case 'record-store':
      out.push(box(x + w / 2 - 0.5, 2.6, south - 0.3, 0.4, 2.2, 0.6, 'warmGlow'));
      break;
    case 'gym':
      out.push(box(x, h + 1.1, z, w * 0.8, 1.6, d * 0.8, 'gymRed'), box(x, 5.8, south - 0.15, w, 0.7, 0.3, 'gymRed'));
      break;
    default:
      break;
  }
  return out;
}

/** Sign centre height above a door. */
export function signHeight(id: BuildingId): number {
  if (id === 'cinema') return 4.7;
  if (id === 'gym') return 4.2;
  return 3.2;
}
