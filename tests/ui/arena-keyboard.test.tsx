import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createArenaStore } from '../../src/arena/store';
import { useKeyboard } from '../../src/arena/useKeyboard';
import { liveInput, resetLiveInput } from '../../src/arena/liveInput';

function key(type: 'keydown' | 'keyup', code: string, init: KeyboardEventInit = {}) {
  const e = new KeyboardEvent(type, { code, bubbles: true, cancelable: true, ...init });
  window.dispatchEvent(e);
  return e;
}

describe('useKeyboard', () => {
  beforeEach(() => resetLiveInput());
  it('tracks keys and clears on blur', () => {
    const store = createArenaStore(null);
    renderHook(() => useKeyboard(store));
    key('keydown', 'KeyW');
    expect(liveInput.pressed.has('KeyW')).toBe(true);
    key('keyup', 'KeyW');
    expect(liveInput.pressed.size).toBe(0);
    key('keydown', 'KeyW');
    act(() => {
      window.dispatchEvent(new Event('blur'));
    });
    expect(liveInput.pressed.size).toBe(0);
  });
  it('ignores movement keys with modifiers', () => {
    renderHook(() => useKeyboard(createArenaStore(null)));
    expect(key('keydown', 'ArrowLeft', { altKey: true }).defaultPrevented).toBe(false);
    expect(key('keydown', 'KeyS', { ctrlKey: true }).defaultPrevented).toBe(false);
    expect(key('keydown', 'KeyS', { metaKey: true }).defaultPrevented).toBe(false);
    expect(liveInput.pressed.size).toBe(0);
  });
  it('clears on visibilitychange hidden', () => {
    renderHook(() => useKeyboard(createArenaStore(null)));
    key('keydown', 'KeyW');
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    expect(liveInput.pressed.size).toBe(0);
  });
  it('prevents default on movement keys', () => {
    renderHook(() => useKeyboard(createArenaStore(null)));
    expect(key('keydown', 'ArrowUp').defaultPrevented).toBe(true);
  });
  it('ignores everything while a panel is open', () => {
    const store = createArenaStore(null);
    renderHook(() => useKeyboard(store));
    key('keydown', 'KeyW');
    act(() => store.getState().openPanel('robotics'));
    expect(liveInput.pressed.size).toBe(0);
    act(() => store.getState().setProximity('tranquility-base', 'tranquility-base'));
    expect(key('keydown', 'KeyW').defaultPrevented).toBe(false);
    expect(liveInput.pressed.has('KeyW')).toBe(false);
    expect(key('keydown', 'ArrowDown').defaultPrevented).toBe(false);
    key('keydown', 'KeyE');
    expect(store.getState().activeId).toBe('robotics');
  });
  it('E opens near station, not on repeat', () => {
    const store = createArenaStore(null);
    renderHook(() => useKeyboard(store));
    act(() => store.getState().setProximity('robotics', 'robotics'));
    key('keydown', 'KeyE', { repeat: true });
    expect(store.getState().activeId).toBeNull();
    key('keydown', 'KeyE');
    expect(store.getState().activeId).toBe('robotics');
  });
});
