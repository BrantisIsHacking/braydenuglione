import { artists } from './artists';
import { books } from './books';
import { films } from './films';
import { games } from './games';
import { teams } from './teams';
import type { Book, CollectionId, Film, Game, Team } from './types';

export const COLLECTION_LABEL: Record<CollectionId, string> = {
  books: 'Books on the shelf',
  films: 'Films on the wall',
  games: 'Arcade cabinets',
  artists: 'Top 12 artists',
  teams: 'Teams I root for',
};

export function getCollection(id: CollectionId): readonly (Book | Film | Game | string | Team)[] {
  switch (id) {
    case 'books': return books;
    case 'films': return films;
    case 'games': return games;
    case 'artists': return artists;
    case 'teams': return teams;
  }
}
