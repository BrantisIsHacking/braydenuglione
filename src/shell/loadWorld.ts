import type { ComponentType } from 'react';
import type { Env } from '../routing/capability';

/** WorldApp reads the URL through createHistorySync, not props. */
export type WorldAppProps = { env: Env };

export const loadWorld = (): Promise<{ default: ComponentType<WorldAppProps> }> => import('../world/WorldApp');
