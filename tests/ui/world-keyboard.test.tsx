import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createWorldStore } from '../../src/world/store';
import { useKeyboard } from '../../src/world/useKeyboard';
import { liveInput, resetLiveInput } from '../../src/world/liveInput';

function key(type: 'keydown' | 'keyup', code: string, init: KeyboardEventInit = {}) {
  const e = new KeyboardEvent(type, { code, bubbles: true, cancelable: true, ...init });
  window.dispatchEvent(e);
  return e;
}

describe('useKeyboard', () => {
  beforeEach(() => resetLiveInput());
  it('tracks keys and clears on blur', () => {
    const store = createWorldStore(null);
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
    renderHook(() => useKeyboard(createWorldStore(null)));
    expect(key('keydown', 'ArrowLeft', { altKey: true }).defaultPrevented).toBe(false);
    expect(key('keydown', 'KeyS', { ctrlKey: true }).defaultPrevented).toBe(false);
    expect(key('keydown', 'KeyS', { metaKey: true }).defaultPrevented).toBe(false);
    expect(liveInput.pressed.size).toBe(0);
  });
  it('clears on visibilitychange hidden', () => {
    renderHook(() => useKeyboard(createWorldStore(null)));
    key('keydown', 'KeyW');
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    expect(liveInput.pressed.size).toBe(0);
  });
  it('prevents default on movement keys', () => {
    renderHook(() => useKeyboard(createWorldStore(null)));
    expect(key('keydown', 'ArrowUp').defaultPrevented).toBe(true);
  });
  it('ignores everything while a panel is open', () => {
    const store = createWorldStore(null);
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
  describe('focus rules', () => {
    const near = (store: ReturnType<typeof createWorldStore>) =>
      act(() => store.getState().setProximity('robotics', 'robotics'));
    const mk = (tag: 'button' | 'input') => {
      const el = document.createElement(tag);
      document.body.appendChild(el);
      el.focus();
      return el;
    };
    afterEach(() => {
      document.body.innerHTML = '';
    });
    it('wrapper focus: W, E, M and Space work', () => {
      const store = createWorldStore(null);
      renderHook(() => useKeyboard(store));
      const wrap = document.createElement('div');
      wrap.tabIndex = -1;
      wrap.setAttribute('data-world-focus', '');
      document.body.appendChild(wrap);
      wrap.focus();
      key('keydown', 'KeyW');
      expect(liveInput.pressed.has('KeyW')).toBe(true);
      near(store);
      key('keydown', 'KeyE');
      expect(store.getState().activeId).toBe('robotics');
      act(() => store.getState().closePanel());
      key('keydown', 'KeyM');
      expect(store.getState().mapOpen).toBe(true);
      act(() => store.getState().closeMap());
      key('keydown', 'Space');
      expect(store.getState().activeId).toBe('robotics');
    });
    it('button focus: W and Space do nothing, arrows still move', () => {
      const store = createWorldStore(null);
      renderHook(() => useKeyboard(store));
      mk('button');
      near(store);
      key('keydown', 'KeyW');
      expect(liveInput.pressed.size).toBe(0);
      expect(key('keydown', 'Space').defaultPrevented).toBe(false);
      key('keydown', 'Enter');
      expect(store.getState().activeId).toBeNull();
      key('keydown', 'ArrowUp');
      expect(liveInput.pressed.has('ArrowUp')).toBe(true);
    });
    it('text input focus: nothing fires', () => {
      const store = createWorldStore(null);
      renderHook(() => useKeyboard(store));
      mk('input');
      near(store);
      for (const c of ['KeyM', 'KeyE', 'KeyW', 'ArrowUp', 'Space', 'Enter']) key('keydown', c);
      expect(store.getState().mapOpen).toBe(false);
      expect(store.getState().activeId).toBeNull();
      expect(liveInput.pressed.size).toBe(0);
    });
    it('contenteditable focus: nothing fires', () => {
      const store = createWorldStore(null);
      renderHook(() => useKeyboard(store));
      const d = document.createElement('div');
      d.setAttribute('contenteditable', 'true');
      d.tabIndex = 0;
      Object.defineProperty(d, 'isContentEditable', { value: true });
      document.body.appendChild(d);
      d.focus();
      key('keydown', 'KeyM');
      key('keydown', 'KeyW');
      expect(store.getState().mapOpen).toBe(false);
      expect(liveInput.pressed.size).toBe(0);
    });
    it('does nothing while a scene change is in flight', () => {
      const store = createWorldStore(null);
      renderHook(() => useKeyboard(store));
      act(() => store.getState().go({ scene: { kind: 'world' }, pose: null, panelId: null }, { instant: true }));
      expect(store.getState().phase).toBe('loading');
      key('keydown', 'KeyW');
      key('keydown', 'KeyM');
      expect(liveInput.pressed.size).toBe(0);
      expect(store.getState().mapOpen).toBe(false);
    });
    it('Ctrl+W does nothing', () => {
      renderHook(() => useKeyboard(createWorldStore(null)));
      key('keydown', 'KeyW', { ctrlKey: true });
      expect(liveInput.pressed.size).toBe(0);
    });
  });
  it('E opens near station, not on repeat', () => {
    const store = createWorldStore(null);
    renderHook(() => useKeyboard(store));
    act(() => store.getState().setProximity('robotics', 'robotics'));
    key('keydown', 'KeyE', { repeat: true });
    expect(store.getState().activeId).toBeNull();
    key('keydown', 'KeyE');
    expect(store.getState().activeId).toBe('robotics');
  });
});
