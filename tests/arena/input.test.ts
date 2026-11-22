import { describe, it, expect } from 'vitest';
import { keysToInput, joystickVector, joystickToInput, combineInput } from '../../src/arena/logic/input';
import { NO_INPUT } from '../../src/arena/logic/movement';

describe('keysToInput', () => {
  it('maps keys', () => {
    expect(keysToInput(new Set(['KeyW'])).forward).toBe(1);
    expect(keysToInput(new Set(['ArrowDown'])).forward).toBe(-1);
    expect(keysToInput(new Set(['KeyA'])).turn).toBe(-1);
    expect(keysToInput(new Set(['ArrowRight'])).turn).toBe(1);
    expect(keysToInput(new Set(['KeyW', 'KeyS'])).forward).toBe(0);
    expect(keysToInput(new Set())).toEqual(NO_INPUT);
  });
});
describe('joystick', () => {
  it('vector', () => {
    expect(joystickVector(0, -100, 50)).toEqual({ x: 0, y: 1 });
    expect(joystickVector(5, 0, 50)).toEqual({ x: 0, y: 0 });
    const v = joystickVector(30, -40, 50);
    expect(Math.hypot(v.x, v.y)).toBeCloseTo(1, 9);
  });
  it('to input', () => {
    expect(joystickToInput({ x: 0.5, y: 1 })).toEqual({ forward: 1, turn: 0.5 });
  });
  it('combine clamps', () => {
    expect(combineInput({ forward: 1, turn: 0 }, { forward: 1, turn: 1 })).toEqual({ forward: 1, turn: 1 });
  });
});
