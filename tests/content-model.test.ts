import { describe, it, expect } from 'vitest';
import { findPrivateTerm, loadPrivateTerms } from '../src/privacy/privateTerms.mjs';
import {
  ALL_TEXT, PHONE_PATTERN, SIGN_ALLOW_LIST, EXHIBIT_COUNT, banners, buildings, exhibits, exhibitsIn, getBuilding,
  getCollection, COLLECTION_LABEL, getExhibit, homeBuilding, interests, stations, floorsOf, isFloor, floorLabel, collectionKeys,
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
  it('bespoke buildings', () => {
    expect(buildings.filter((b) => b.bespoke).map((b) => b.id).sort()).toEqual(['arcade', 'campus-quad', 'cinema', 'civic-center', 'fan-shop', 'golf-clubhouse', 'gym', 'hall-of-fame', 'hq-tower', 'library', 'playhouse', 'record-store', 'workshop']);
  });
  it('stage-3 positions match the contract table', () => {
    const POS: Record<string, [number, number]> = {
      'library/books': [0, -8], 'arcade/rocket-league': [-7.5, -8], 'arcade/fifa': [-4.5, -8], 'arcade/games': [8.5, -3.5],
      'record-store/music': [-4, -11], 'record-store/karaoke': [5.5, -10], 'playhouse/stranger-things': [0, -11],
      'fan-shop/teams': [0, -6], 'golf-clubhouse/golf': [-4, -7],
    };
    const got: Record<string, [number, number]> = {};
    for (const b of ['library', 'arcade', 'record-store', 'playhouse', 'fan-shop', 'golf-clubhouse'] as const)
      for (const p of exhibitsIn(b)) if (p.pos) got[`${b}/${p.exhibit.id}`] = p.pos;
    expect(got).toEqual(POS);
  });
  it('music links to Spotify', () => {
    expect(interests.find((i) => i.id === 'music')?.link).toEqual({ label: 'Spotify', url: 'https://open.spotify.com/user/f1z0utspes4vydzqaubrp6o68' });
  });
  it('collection keys are unique and complete', () => {
    const n = { books: 75, films: 12, games: 18, artists: 46, teams: 10 } as const;
    for (const id of Object.keys(n) as (keyof typeof n)[]) {
      const k = collectionKeys(id);
      expect(k).toHaveLength(n[id]);
      expect(new Set(k).size).toBe(k.length);
    }
    expect(collectionKeys('games')[0]).toBe('Rocket League');
    expect(collectionKeys('teams')[4]).toBe('Manchester City');
    expect(collectionKeys('artists')[8]).toBe('Tyler, The Creator');
  });
  it('golf is a two-floor building', () => {
    expect(floorsOf('golf-clubhouse')).toEqual([
      { n: 1, name: 'Clubhouse', sign: 'CLUBHOUSE', label: 'Clubhouse' },
      { n: 2, name: 'Nine-hole course', sign: '9 HOLES', label: 'Course' },
    ]);
    expect(floorLabel('golf-clubhouse', 2)).toBe('Course');
    expect(floorLabel('hq-tower', 3)).toBe('Floor 3');
    expect(isFloor('golf-clubhouse', 2)).toBe(true);
    expect(isFloor('golf-clubhouse', 3)).toBe(false);
  });
  it('authored positions match the contract table', () => {
    const POS: Record<string, [number, number]> = {
      'workshop/tranquility-base': [-6, -12], 'workshop/dreams-come-true': [0, -12], 'workshop/debate-mate': [6, -12],
      'workshop/zayi-ai-studio': [-6, -6], 'workshop/airbnb-classifier': [6, -6], 'workshop/oculogica': [0, -6],
      'hq-tower/shah-sokoloff': [3, -7], 'hq-tower/code-ninjas': [3, -7], 'hq-tower/oculogica': [1, -7], 'hq-tower/ai-camp': [5.5, -7], 'hq-tower/zayi-fellow': [3, -7],
      'civic-center/usacs': [-7, -12], 'civic-center/hackru': [0, -12], 'civic-center/calc-ii-la': [7, -12],
      'civic-center/honors-ambassador': [-6, -6], 'civic-center/orientation-leader': [-2, -6], 'civic-center/teaching-mentoring': [6, -6],
      'campus-quad/rutgers-honors': [-8, -16], 'campus-quad/critics-choice': [0, -16], 'campus-quad/ccm': [8, -16],
      'campus-quad/robotics': [-10, -9], 'campus-quad/advisory-council': [-5, -9], 'campus-quad/hackmcst': [0, -9], 'campus-quad/nslc': [5, -9], 'campus-quad/java-juniors': [10, -9],
      'hall-of-fame/critics-choice-prize': [-7.5, -12], 'hall-of-fame/best-code-tech': [-2.5, -12], 'hall-of-fame/best-gemini': [2.5, -12], 'hall-of-fame/bloodiest-game': [7.5, -12],
      'hall-of-fame/academy-scholar': [-7.5, -6], 'hall-of-fame/rising-star': [-2.5, -6], 'hall-of-fame/honor-societies': [2.5, -6], 'hall-of-fame/critics-choice': [7.5, -6],
    };
    const got: Record<string, [number, number]> = {};
    for (const b of ['workshop', 'hq-tower', 'civic-center', 'campus-quad', 'hall-of-fame'] as const)
      for (const p of exhibitsIn(b)) if (p.pos) got[`${b}/${p.exhibit.id}`] = p.pos;
    expect(got).toEqual(POS);
  });
  it('cinema placements are authored (amendment A2)', () => {
    const c = exhibitsIn('cinema');
    expect(c.map((p) => p.exhibit.id)).toEqual(['movies', 'critics-choice']);
    for (const p of c) expect(p.pos).toBeDefined();
  });
  it('rings on the same floor are at least 3 m apart', () => {
    for (const b of buildings.filter((x) => x.bespoke)) {
      const ps = exhibitsIn(b.id).filter((p) => p.pos);
      for (let i = 0; i < ps.length; i++)
        for (let j = i + 1; j < ps.length; j++) {
          if ((ps[i].floor ?? 1) !== (ps[j].floor ?? 1)) continue;
          const [a, c] = [ps[i].pos!, ps[j].pos!];
          expect(Math.hypot(a[0] - c[0], a[1] - c[1]), `${b.id}/${ps[i].exhibit.id}-${ps[j].exhibit.id}`).toBeGreaterThanOrEqual(3);
        }
    }
  });
  it('floors', () => {
    expect(floorsOf('hq-tower').map((f) => f.n)).toEqual([1, 2, 3, 4]);
    expect(floorsOf('hq-tower').map((f) => f.name)).toEqual(['IT server room', 'Coding dojo', 'Med-ML lab', 'AI lab']);
    expect(floorsOf('gym')).toEqual([]);
    expect(isFloor('hq-tower', 3)).toBe(true);
    for (const n of [0, 5, 2.5]) expect(isFloor('hq-tower', n)).toBe(false);
    expect(isFloor('gym', 1)).toBe(false);
    for (const f of floorsOf('hq-tower'))
      expect(exhibitsIn('hq-tower').some((p) => !p.mirror && p.floor === f.n), `floor ${f.n}`).toBe(true);
  });
  it('signs use the allow-list or the Brayden prefix', () => {
    expect(SIGN_ALLOW_LIST).toHaveLength(45);
    for (const t of ['FAVORITES', 'STAGE', 'TOP 12', 'BOX OFFICE', 'JERSEYS', 'SCARVES', 'PRO SHOP', 'TO THE COURSE', '9 HOLES', '5K loop']) expect(SIGN_ALLOW_LIST).toContain(t);
    expect(SIGN_ALLOW_LIST).not.toContain('5K LOOP');
    expect(getBuilding('running-loop')?.sign).toBe('5K loop');
    for (const f of floorsOf('golf-clubhouse')) expect(SIGN_ALLOW_LIST).toContain(f.sign);
    for (const s of ['ELEVATOR', 'FLOOR 1: IT ROOM', 'FLOOR 2: CODING DOJO', 'FLOOR 3: MED-ML LAB', 'FLOOR 4: AI LAB', 'LECTURE HALL', 'JUDGING HALL', 'CLASSROOM', 'TOUR DESK', 'MENTORSHIP BOARD', 'HONORS HALL', 'SCREENING ROOM', 'HIGH SCHOOL WING', 'ROBOTICS LAB', 'NOW SHOWING', 'TICKETS', 'CONCESSIONS', 'THEATER 1'])
      expect(SIGN_ALLOW_LIST).toContain(s);
    for (const f of floorsOf('hq-tower')) expect(SIGN_ALLOW_LIST).toContain(f.sign);
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
