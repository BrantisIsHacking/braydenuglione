import { describe, expect, it } from 'vitest';
import { padAction } from '../../src/world/logic/pads';
import { NORTH, type Pad } from '../../src/world/types';

const GOLF: Pad = { id: 'course', rect: { x: 0, z: -11.4, w: 2.4, d: 1.2 }, arrival: { x: 0, z: -2, heading: NORTH }, to: 2 };
const HQ: Pad = { id: 'elevator', rect: { x: 0, z: -9, w: 2, d: 2 }, arrival: { x: 0, z: -7, heading: NORTH } };

describe('padAction', () => {
  it('walk-in pads ride, the elevator opens its dialog, unknown ids do nothing', () => {
    expect(padAction([GOLF], 'course')).toEqual({ kind: 'ride', floor: 2, padId: 'course' });
    expect(padAction([HQ], 'elevator')).toEqual({ kind: 'elevator' });
    expect(padAction([GOLF], 'nope')).toBeNull();
  });
});
