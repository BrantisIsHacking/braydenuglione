import { describe, expect, it } from 'vitest';
import { SIGN_ALLOW_LIST } from '../../../src/content/buildings';
import { collectionKeys } from '../../../src/content/collections';
import { getExhibit } from '../../../src/content/exhibits';
import { teams } from '../../../src/content/teams';
import { sceneGeometry, STOPS } from '../../../src/world/interiors/fan-shop/geometry';
import {
  buildBatches, buildGarments, jerseyTeams, scarfTeams, SIGN_SPECS, SIGNS, SPEC, TEAM_COLORS, TEXT_LINES,
} from '../../../src/world/interiors/fan-shop/look';
import { isFontSafe, toFontSafe } from '../../../src/world/logic/fontSafe';
import { interiorProblems, placedIn } from '../../../src/world/logic/interior';
import { TEXT_CAP, textCount } from '../../../src/world/logic/text';
import { uncovered } from '../../../src/world/logic/stops';

describe('fan shop interior', () => {
  it('geometry is valid', () => {
    expect(interiorProblems(sceneGeometry('fan-shop'))).toEqual([]);
  });
  it('places its content exhibits at their positions, then its stops', () => {
    expect(sceneGeometry('fan-shop').exhibits).toEqual([...placedIn('fan-shop'), ...STOPS]);
    expect(placedIn('fan-shop')).toEqual([{ id: 'teams', pos: [0, -6] }]);
  });
  it('camera', () => {
    const g = sceneGeometry('fan-shop');
    expect(g.cameraDistance).toBe(SPEC.cameraDistance);
    expect(g.cameraDistance).toBeGreaterThanOrEqual(12);
    expect(g.cameraDistance).toBeLessThanOrEqual(18);
    expect(g.cameraSouthPad).toBe(SPEC.cameraSouthPad);
    expect(g.cameraSouthPad!).toBeGreaterThanOrEqual(0.5);
    expect(g.cameraSouthPad!).toBeLessThanOrEqual(2);
  });
  it('signs', () => {
    for (const s of SIGNS) {
      expect(SIGN_ALLOW_LIST).toContain(s);
      expect(isFontSafe(s)).toBe(true);
    }
    for (const s of SIGN_SPECS) expect(SIGNS).toContain(s.text);
  });
  it('3D text is content-derived', () => {
    expect(TEXT_LINES).toEqual([...jerseyTeams(), ...scarfTeams()].map((t) => t.name));
    for (const l of TEXT_LINES) expect(isFontSafe(toFontSafe(l))).toBe(true);
  });
  it('text budget', () => {
    expect(textCount({ signs: SIGN_SPECS.length, lines: TEXT_LINES.length, labelled: placedIn('fan-shop').length })).toBeLessThanOrEqual(TEXT_CAP);
  });
  it('stops focus real items', () => {
    expect(STOPS).toEqual([{ id: 'teams', pos: [-5, -12], focus: 'Giants' }, { id: 'teams', pos: [5, -12], focus: 'Manchester City' }]);
    for (const s of STOPS) {
      expect(getExhibit(s.id)?.building).toBe('fan-shop');
      expect(collectionKeys('teams')).toContain(s.focus);
    }
  });
  it('racks hold every team', () => {
    expect(jerseyTeams().map((t) => t.name)).toEqual(['Giants', 'Knicks', 'Yankees', 'Rangers']);
    expect(scarfTeams()).toHaveLength(6);
    expect(scarfTeams()[0].name).toBe('Manchester City');
    expect(TEXT_LINES).toHaveLength(10);
    expect(jerseyTeams().length + scarfTeams().length).toBe(teams.length);
    // the first jersey and the first scarf are the two stop focuses
    expect([jerseyTeams()[0].name, scarfTeams()[0].name]).toEqual(STOPS.map((s) => s.focus));
    expect(uncovered('teams', STOPS.map((s) => s.focus), [...jerseyTeams(), ...scarfTeams()].map((t) => t.name))).toEqual([]);
  });
});

describe('fan shop garment colours', () => {
  const HEX = /^#[0-9a-f]{6}$/i;
  it('every team has real primary and secondary colours', () => {
    expect(Object.keys(TEAM_COLORS).sort()).toEqual(teams.map((t) => t.name).sort());
    for (const c of Object.values(TEAM_COLORS)) {
      expect(c.primary).toMatch(HEX);
      expect(c.secondary).toMatch(HEX);
      expect(c.primary.toLowerCase()).not.toBe(c.secondary.toLowerCase());
    }
    expect(TEAM_COLORS.Giants).toEqual({ primary: '#0b2265', secondary: '#a71930' });
    expect(TEAM_COLORS['Manchester City'].primary).toBe('#6cabdd');
    expect(TEAM_COLORS.Barcelona).toEqual({ primary: '#a50044', secondary: '#004d98' });
  });
  it('rack garments use exactly their own team colours', () => {
    const garments = buildGarments();
    expect(garments.length).toBeGreaterThan(40);
    const rackColours = new Set(Object.values(TEAM_COLORS).flatMap((c) => [c.primary, c.secondary]));
    for (const g of garments) expect(rackColours.has(g.color)).toBe(true);
    const used = new Set(garments.map((g) => g.color));
    for (const c of Object.values(TEAM_COLORS)) {
      expect(used.has(c.primary)).toBe(true);
      expect(used.has(c.secondary)).toBe(true);
    }
  });
  it('batches stay few', () => {
    expect(buildBatches().length).toBeLessThanOrEqual(24);
  });
});
