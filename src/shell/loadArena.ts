import type { ComponentType } from 'react';
import type { Env } from '../routing/capability';

export type ArenaAppProps = { stationId: string | null; env: Env };

export const loadArena = (): Promise<{ default: ComponentType<ArenaAppProps> }> => import('../arena/ArenaApp');
