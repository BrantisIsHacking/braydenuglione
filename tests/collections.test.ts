import { describe, it, expect } from 'vitest';
import { findPrivateTerm, loadPrivateTerms } from '../src/privacy/privateTerms.mjs';
import { ALL_TEXT, PHONE_PATTERN } from '../src/content';
import { books } from '../src/content/books';
import { films } from '../src/content/films';
import { games } from '../src/content/games';
import { artists } from '../src/content/artists';
import { teams } from '../src/content/teams';

describe('collections', () => {
  it('films', () => {
    expect(films).toHaveLength(12);
    expect(films[0].title).toContain('Return of the Jedi');
    expect(films[11].title).toBe('The Prestige');
    for (const f of films) {
      expect(Number.isInteger(f.year)).toBe(true);
      expect(f.year).toBeGreaterThanOrEqual(1900);
      expect(f.year).toBeLessThanOrEqual(2030);
      expect(f.onDisplay).toBe(true);
    }
  });
  it('books', () => {
    expect(books).toHaveLength(75);
    const titles = books.map((b) => b.title);
    expect(new Set(titles).size).toBe(75);
    expect(books.filter((b) => b.favorite).map((b) => b.title).sort()).toEqual(
      ['1984', 'Feed', 'Pride and Prejudice', 'The Invisible Life of Addie LaRue'].sort(),
    );
    for (const bad of ['Modest Proposal', 'Tintern', 'Gettysburg', "Book o' Fun", 'Complete Works'])
      expect(titles.some((t) => t.includes(bad))).toBe(false);
  });
  it('games, artists, teams', () => {
    expect(games).toHaveLength(18);
    expect(games[0].title).toBe('Rocket League');
    expect(games.some((g) => g.title.includes('FIFA 23'))).toBe(false);
    expect(artists).toHaveLength(46);
    expect(artists[43]).toBe('Rihanna');
    expect(artists[45]).toBe('deadmau5');
    expect(artists[0]).toBe('Drake');
    expect(artists[11]).toBe('Tame Impala');
    expect(teams).toHaveLength(10);
    expect(teams.filter((t) => t.sport === 'soccer')).toHaveLength(6);
  });
  it('is private-safe', () => {
    const all = JSON.stringify([books, films, games, artists, teams]);
    expect(all).not.toMatch(PHONE_PATTERN);
    expect(findPrivateTerm(all, loadPrivateTerms())).toBeNull();
    expect(ALL_TEXT).toContain('Project Hail Mary');
  });
});
