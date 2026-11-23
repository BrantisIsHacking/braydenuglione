import { describe, it, expect } from 'vitest';
import { findPrivateTerm, loadPrivateTerms } from '../src/privacy/privateTerms.mjs';
import {
  ALL_TEXT, PHONE_PATTERN, SIGN_ALLOW_LIST, EXHIBIT_COUNT, banners, buildings, exhibits, exhibitsIn, getBuilding,
  getCollection, COLLECTION_LABEL, getExhibit, homeBuilding, interests, stations,
} from '../src/content';
import { mirrors } from '../src/content/mirrors';
import { ROUTE_WORDS } from '../src/routing/routeWords';
import { theme } from '../src/world/look/theme';

const terms = loadPrivateTerms();
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const HOMES: Record<string, string> = {};
for (const [b, ids] of Object.entries({
  workshop: 'tranquility-base dreams-come-true debate-mate zayi-ai-studio airbnb-classifier',
  'hq-tower': 'zayi-fellow oculogica ai-camp code-ninjas shah-sokoloff',
  'civic-center': 'usacs hackru calc-ii-la honors-ambassador orientation-leader teaching-mentoring',
  'campus-quad': 'rutgers-honors critics-choice ccm robotics advisory-council hackmcst nslc java-juniors',
  'hall-of-fame': 'critics-choice-prize best-code-tech best-gemini bloodiest-game academy-scholar rising-star honor-societies',
  gym: 'basketball',
  'golf-clubhouse': 'golf',
  library: 'books',
  cinema: 'movies',
  'record-store': 'music karaoke',
  playhouse: 'stranger-things',
  arcade: 'rocket-league fifa games',
  'fan-shop': 'teams',
  'chess-park': 'chess',
  park: 'roundnet',
  mailbox: 'contact',
})) for (const id of ids.split(' ')) HOMES[id] = b;

describe('content model', () => {
  it('ids are unique and kebab-case across exhibits, buildings and route words', () => {
    const ids = [...exhibits.map((e) => e.id), ...buildings.map((b) => b.id), ...ROUTE_WORDS];
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id).toMatch(KEBAB));
  });
  it('has 45 exhibits: stations, banners, interests, contact in order', () => {
    expect(EXHIBIT_COUNT).toBe(45);
    expect(exhibits.map((e) => e.type)).toEqual([
      ...stations.map(() => 'station'), ...banners.map(() => 'banner'), ...interests.map(() => 'interest'), 'contact',
    ]);
  });
  it('every one of the 45 exhibits has its contract home building', () => {
    expect(Object.keys(HOMES)).toHaveLength(45);
    for (const e of exhibits) expect(homeBuilding(e.id), e.id).toBe(HOMES[e.id]);
  });
  it('stations sit in their contract building, which is an interior', () => {
    expect(stations).toHaveLength(24);
    for (const s of stations) {
      expect(s.building, s.id).toBe(HOMES[s.id]);
      expect(getBuilding(s.building)?.kind, s.id).toBe('interior');
    }
  });
  it('every home building exists; key homes', () => {
    for (const e of exhibits) expect(getBuilding(homeBuilding(e.id) as string), e.id).toBeDefined();
    expect(homeBuilding('critics-choice')).toBe('campus-quad');
    expect(homeBuilding('rising-star')).toBe('hall-of-fame');
    expect(homeBuilding('chess')).toBe('chess-park');
    expect(homeBuilding('contact')).toBe('mailbox');
    expect(homeBuilding('nope')).toBeUndefined();
    expect(getExhibit('fifa')).toBeDefined();
    expect(getExhibit('fifa-23')).toBeUndefined();
  });
  it('overlay buildings have no placements; interiors have at least one', () => {
    for (const b of buildings) {
      const n = exhibitsIn(b.id).length;
      if (b.kind === 'overlay') expect(n, b.id).toBe(0);
      if (b.kind === 'interior') expect(n, b.id).toBeGreaterThanOrEqual(1);
    }
  });
  it('exhibitsIn orders homes then mirrors', () => {
    const w = exhibitsIn('workshop');
    expect(w.map((p) => p.exhibit.id)).toEqual([
      'tranquility-base', 'dreams-come-true', 'debate-mate', 'zayi-ai-studio', 'airbnb-classifier', 'oculogica',
    ]);
    expect(w.map((p) => p.mirror)).toEqual([false, false, false, false, false, true]);
    const h = exhibitsIn('hall-of-fame');
    expect(h.at(-1)).toMatchObject({ mirror: true, exhibit: { id: 'critics-choice' } });
  });
  it('mirrors reference existing exhibits in a different building', () => {
    for (const m of mirrors) {
      expect(getExhibit(m.exhibitId), m.exhibitId).toBeDefined();
      expect(m.building, m.exhibitId).not.toBe(homeBuilding(m.exhibitId));
    }
  });
  it('floor is set exactly on the five hq-tower stations', () => {
    const withFloor = stations.filter((s) => s.floor !== undefined).map((s) => [s.id, s.floor]);
    expect(Object.fromEntries(withFloor)).toEqual({ 'zayi-fellow': 4, oculogica: 3, 'ai-camp': 3, 'code-ninjas': 2, 'shah-sokoloff': 1 });
    expect(stations.filter((s) => s.building === 'hq-tower')).toHaveLength(5);
  });
  it('pos is present on a placement iff its building is bespoke', () => {
    for (const b of buildings)
      for (const p of exhibitsIn(b.id)) expect(p.pos !== undefined, `${b.id}/${p.exhibit.id}`).toBe(b.bespoke);
    const gym = exhibitsIn('gym');
    expect(gym.find((p) => p.exhibit.id === 'basketball')?.pos).toEqual([3, 5]);
    expect(gym.find((p) => p.exhibit.id === 'rising-star')).toMatchObject({ mirror: true, pos: [-3, -7] });
  });
  it('signs use the allow-list or the Brayden prefix', () => {
    expect(SIGN_ALLOW_LIST).toHaveLength(18);
    for (const b of buildings) expect(SIGN_ALLOW_LIST.includes(b.sign) || /^Brayden's /.test(b.sign), b.id).toBe(true);
  });
  it('accents are theme colors', () => {
    for (const b of buildings) expect(Object.keys(theme.accents), b.id).toContain(b.accent);
  });
  it('building order is square, career, culture, sports', () => {
    const rank = { square: 0, career: 1, culture: 2, sports: 3 } as const;
    const r = buildings.map((b) => rank[b.district]);
    expect(r).toEqual([...r].sort((a, b) => a - b));
    expect(buildings).toHaveLength(18);
  });
  it('collections resolve and are labelled', () => {
    for (const k of Object.keys(COLLECTION_LABEL) as (keyof typeof COLLECTION_LABEL)[]) expect(Array.isArray(getCollection(k))).toBe(true);
    expect(COLLECTION_LABEL.books).toBe('Books on the shelf');
  });
  it('no phone numbers in ALL_TEXT', () => {
    expect(ALL_TEXT).not.toMatch(PHONE_PATTERN);
  });
  it.skipIf(terms.length === 0)('no private terms in ALL_TEXT', () => {
    expect(findPrivateTerm(ALL_TEXT, terms)).toBeNull();
  });
});
