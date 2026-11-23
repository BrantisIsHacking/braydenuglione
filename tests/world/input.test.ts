import { describe, it, expect } from 'vitest';
import { keysToInput, joystickVector, joystickToInput, combineInput } from '../../src/world/logic/input';
import { NO_INPUT } from '../../src/world/logic/movement';

describe('keysToInput', () => {
  it('maps keys', () => {
    expect(keysToInput(new Set(['KeyW']))).toEqual({ x: 0, y: 1 });
    expect(keysToInput(new Set(['ArrowDown']))).toEqual({ x: 0, y: -1 });
    expect(keysToInput(new Set(['KeyA']))).toEqual({ x: -1, y: 0 });
    expect(keysToInput(new Set(['ArrowRight']))).toEqual({ x: 1, y: 0 });
    expect(keysToInput(new Set(['ArrowUp']))).toEqual({ x: 0, y: 1 });
    expect(keysToInput(new Set(['KeyW', 'KeyS']))).toEqual(NO_INPUT);
    expect(keysToInput(new Set())).toEqual(NO_INPUT);
  });
  it('normalises diagonals', () => {
    const v = keysToInput(new Set(['KeyW', 'KeyD']));
    expect(v.x).toBeCloseTo(Math.SQRT1_2, 9);
    expect(v.y).toBeCloseTo(Math.SQRT1_2, 9);
  });
});
describe('joystick', () => {
  it('vector', () => {
    expect(joystickVector(0, -100, 50)).toEqual({ x: 0, y: 1 });
    expect(joystickVector(5, 0, 50)).toEqual({ x: 0, y: 0 });
    const v = joystickVector(30, -40, 50);
    expect(Math.hypot(v.x, v.y)).toBeCloseTo(1, 9);
  });
  it('to input is identity', () => {
    expect(joystickToInput({ x: 0.5, y: 1 })).toEqual({ x: 0.5, y: 1 });
  });
  it('combine scales to length 1', () => {
    const v = combineInput({ x: 1, y: 0 }, { x: 0, y: 1 });
    expect(Math.hypot(v.x, v.y)).toBeCloseTo(1, 9);
  });
});
