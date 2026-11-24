import type { BuildingId } from '../content/types';

export const ROUTE_WORDS = ['world', 'b', 'box-score', 'arena'] as const;

export type Route =
  | { view: 'auto' } | { view: 'boxscore' } | { view: 'world' }
  | { view: 'building'; id: BuildingId; legacy: boolean; floor?: number }
  | { view: 'exhibit'; id: string };
