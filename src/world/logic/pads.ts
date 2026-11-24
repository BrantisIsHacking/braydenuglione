import type { Pad } from '../types';

export type PadAction = { kind: 'ride'; floor: number; padId: string } | { kind: 'elevator' } | null;

/** What stepping on a pad does: a walk-in pad (`to`) rides straight to that floor; the HQ elevator opens its dialog. */
export function padAction(pads: readonly Pad[], id: string): PadAction {
  const pad = pads.find((p) => p.id === id);
  if (pad?.to !== undefined) return { kind: 'ride', floor: pad.to, padId: pad.id };
  if (id === 'elevator') return { kind: 'elevator' };
  return null;
}
