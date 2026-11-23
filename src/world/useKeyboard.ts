import { useEffect } from 'react';
import { liveInput, resetLiveInput } from './liveInput';
import { useWorld, type WorldStore } from './store';
import { zoomBy } from './useZoomInput';

const ARROWS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
const LETTERS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD']);
const CLOSER = new Set(['Equal', 'NumpadAdd']);
const FARTHER = new Set(['Minus', 'NumpadSubtract']);
const WORLD_FOCUS = '[data-world-focus]';

function isTyping(el: Element | EventTarget | null): boolean {
  const e = el as HTMLElement | null;
  if (!e || !e.tagName) return false;
  return e.tagName === 'INPUT' || e.tagName === 'TEXTAREA' || e.tagName === 'SELECT' || e.isContentEditable === true;
}

/** Focus is on the world wrapper or the page body (WCAG 2.1.4: letter keys only act there). */
function hasWorldFocus(): boolean {
  const a = document.activeElement;
  return !a || a === document.body || a.matches(WORLD_FOCUS);
}

export function useKeyboard(store: WorldStore = useWorld): void {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (isTyping(e.target) || isTyping(document.activeElement)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const s = store.getState();
      if (s.activeId || s.mapOpen || s.phase !== 'idle') return;
      const focus = hasWorldFocus();
      const c = e.code;
      if (ARROWS.has(c) || (LETTERS.has(c) && focus)) {
        liveInput.pressed.add(c);
        e.preventDefault();
      } else if (!focus) {
        return;
      } else if (c === 'KeyE' || c === 'Enter' || c === 'Space') {
        if (e.repeat) return;
        if (s.nearId) {
          s.activate(s.nearId);
          e.preventDefault();
        }
      } else if (c === 'KeyM') {
        s.openMap();
      } else if (CLOSER.has(c)) {
        zoomBy(store, -1);
      } else if (FARTHER.has(c)) {
        zoomBy(store, 1);
      }
    };
    const up = (e: KeyboardEvent) => {
      liveInput.pressed.delete(e.code);
    };
    const clear = () => resetLiveInput();
    const vis = () => {
      if (document.visibilityState === 'hidden') resetLiveInput();
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', clear);
    document.addEventListener('visibilitychange', vis);
    const unsub = store.subscribe((s, prev) => {
      if ((s.activeId && !prev.activeId) || (s.mapOpen && !prev.mapOpen) || (s.phase !== 'idle' && prev.phase === 'idle')) resetLiveInput();
    });
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', clear);
      document.removeEventListener('visibilitychange', vis);
      unsub();
    };
  }, [store]);
}
