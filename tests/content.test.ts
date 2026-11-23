import { describe, it, expect } from 'vitest';
import { findPrivateTerm, loadPrivateTerms } from '../src/privacy/privateTerms.mjs';
import { stations, profile, interests, ALL_TEXT, PHONE_PATTERN } from '../src/content';

const terms = loadPrivateTerms();

const ROSTER = [
  'tranquility-base', 'dreams-come-true', 'debate-mate', 'zayi-ai-studio', 'airbnb-classifier',
  'zayi-fellow', 'usacs', 'hackru', 'calc-ii-la', 'honors-ambassador', 'orientation-leader',
  'rutgers-honors', 'critics-choice', 'code-ninjas', 'shah-sokoloff', 'ccm',
  'teaching-mentoring', 'oculogica', 'ai-camp', 'robotics', 'advisory-council', 'hackmcst',
  'nslc', 'java-juniors',
];

const TABLE = [
  ['tranquility-base', 'project', 'standard'],
  ['dreams-come-true', 'project', 'standard'],
  ['debate-mate', 'project', 'standard'],
  ['zayi-ai-studio', 'project', 'terminal'],
  ['airbnb-classifier', 'project', 'terminal'],
  ['zayi-fellow', 'experience', 'standard'],
  ['usacs', 'leadership', 'standard'],
  ['hackru', 'leadership', 'standard'],
  ['calc-ii-la', 'experience', 'standard'],
  ['honors-ambassador', 'leadership', 'standard'],
  ['orientation-leader', 'leadership', 'standard'],
  ['rutgers-honors', 'education', 'standard'],
  ['critics-choice', 'education', 'video'],
  ['code-ninjas', 'experience', 'standard'],
  ['shah-sokoloff', 'experience', 'standard'],
  ['ccm', 'education', 'standard'],
  ['teaching-mentoring', 'leadership', 'standard'],
  ['oculogica', 'experience', 'terminal'],
  ['ai-camp', 'experience', 'standard'],
  ['robotics', 'throwback', 'standard'],
  ['advisory-council', 'throwback', 'standard'],
  ['hackmcst', 'throwback', 'standard'],
  ['nslc', 'throwback', 'standard'],
  ['java-juniors', 'throwback', 'standard'],
];

describe('content schema', () => {
  it('ids are unique and kebab-case', () => {
    const ids = stations.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/));
  });
  it('roster matches plan', () => {
    expect(stations.map((s) => s.id)).toEqual(ROSTER);
  });
  it('category and kind match the roster table', () => {
    expect(stations.map((s) => [s.id, s.category, s.kind])).toEqual(TABLE);
  });
  it('oneLiner <= 90 chars, bullets <= 3, required text non-empty', () => {
    stations.forEach((s) => {
      expect(s.oneLiner.length, s.id).toBeLessThanOrEqual(90);
      expect(s.bullets.length, s.id).toBeLessThanOrEqual(3);
      expect(s.title, s.id).not.toBe('');
      expect(s.org, s.id).not.toBe('');
      expect(s.body, s.id).not.toBe('');
      expect(s.shotCaption, s.id).not.toBe('');
    });
  });
  it('all urls are https', () => {
    expect(profile.links.length).toBeGreaterThanOrEqual(3);
    expect(ALL_TEXT.length).toBeGreaterThan(0);
    const links = [
      ...stations.flatMap((s) => s.links),
      ...profile.links,
      ...interests.flatMap((l) => (l.link ? [l.link] : [])),
    ];
    links.forEach((l) => expect(l.url).toMatch(/^https:\/\//));
  });
  it('start is YYYY-MM; end is YYYY-MM or present', () => {
    stations.forEach((s) => {
      expect(s.start, s.id).toMatch(/^\d{4}-\d{2}$/);
      expect(s.end, s.id).toMatch(/^(\d{4}-\d{2}|present)$/);
    });
  });
  it('terminal and video kinds carry their data', () => {
    expect(stations.filter((s) => s.kind === 'terminal').map((s) => s.id)).toEqual([
      'zayi-ai-studio',
      'airbnb-classifier',
      'oculogica',
    ]);
    expect(stations.find((s) => s.kind === 'video')?.id).toBe('critics-choice');
    stations.filter((s) => s.kind === 'terminal').forEach((s) => {
      expect(s.terminal?.rows.length ?? 0, s.id).toBeGreaterThanOrEqual(2);
    });
    stations.filter((s) => s.kind === 'video').forEach((s) => {
      expect(s.video?.youtubeId, s.id).toBe('qGuouXZMmC4');
    });
  });
  it('no phone numbers', () => {
    expect(ALL_TEXT).not.toMatch(PHONE_PATTERN);
  });
  it.skipIf(terms.length === 0)('no private terms', () => {
    expect(findPrivateTerm(ALL_TEXT, terms)).toBeNull();
  });
  it('profile email', () => {
    expect(profile.email).toBe('uglionebrayden@gmail.com');
  });
});
