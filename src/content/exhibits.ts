import { banners } from './banners';
import { buildings } from './buildings';
import { interests } from './interests';
import { mirrors } from './mirrors';
import { stations } from './stations';
import type { Banner, Building, BuildingId, Interest, Station } from './types';

export const CONTACT_ID = 'contact';

export type Exhibit =
  | { type: 'station'; id: string; building: BuildingId; title: string; floor?: number; pos?: [number, number]; station: Station }
  | { type: 'banner'; id: string; building: BuildingId; title: string; pos?: [number, number]; banner: Banner }
  | { type: 'interest'; id: string; building: BuildingId; title: string; pos?: [number, number]; interest: Interest }
  | { type: 'contact'; id: 'contact'; building: 'mailbox'; title: 'Contact' };

export type Placement = { exhibit: Exhibit; mirror: boolean; pos?: [number, number]; floor?: number };

export const exhibits: Exhibit[] = [
  ...stations.map((station): Exhibit => ({
    type: 'station', id: station.id, building: station.building, title: station.title,
    ...(station.floor !== undefined ? { floor: station.floor } : {}),
    ...(station.pos ? { pos: station.pos } : {}),
    station,
  })),
  ...banners.map((banner): Exhibit => ({
    type: 'banner', id: banner.id, building: banner.building, title: banner.title,
    ...(banner.pos ? { pos: banner.pos } : {}),
    banner,
  })),
  ...interests.map((interest): Exhibit => ({
    type: 'interest', id: interest.id, building: interest.building, title: interest.title,
    ...(interest.pos ? { pos: interest.pos } : {}),
    interest,
  })),
  { type: 'contact', id: CONTACT_ID, building: 'mailbox', title: 'Contact' },
];

export const EXHIBIT_COUNT: number = exhibits.length;

const byId = new Map(exhibits.map((e) => [e.id, e]));
const buildingById = new Map<string, Building>(buildings.map((b) => [b.id, b]));

export function getExhibit(id: string): Exhibit | undefined {
  return byId.get(id);
}

export function homeBuilding(id: string): BuildingId | undefined {
  return byId.get(id)?.building;
}

export function getBuilding(id: string): Building | undefined {
  return buildingById.get(id);
}

export function exhibitsIn(b: BuildingId): Placement[] {
  const out: Placement[] = [];
  for (const e of exhibits) {
    if (e.building !== b) continue;
    const p: Placement = { exhibit: e, mirror: false };
    if ('pos' in e && e.pos) p.pos = e.pos;
    if ('floor' in e && e.floor !== undefined) p.floor = e.floor;
    out.push(p);
  }
  for (const m of mirrors) {
    if (m.building !== b) continue;
    const exhibit = byId.get(m.exhibitId);
    if (!exhibit) continue;
    const p: Placement = { exhibit, mirror: true };
    if (m.pos) p.pos = m.pos;
    if (m.floor !== undefined) p.floor = m.floor;
    out.push(p);
  }
  return out;
}
