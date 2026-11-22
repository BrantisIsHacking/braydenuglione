import { useEffect } from 'react';
import { liveInput, resetLiveInput } from './liveInput';
import { useArena } from './store';

const MOVE = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

function isTyping(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  if (!el || !el.tagName) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable === true;
}

export function useKeyboard(store: typeof useArena = useArena): void {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      const s = store.getState();
      if (s.activeId || e.ctrlKey || e.metaKey || e.altKey) return;
      if (MOVE.has(e.code)) {
        liveInput.pressed.add(e.code);
        e.preventDefault();
      } else if (e.code === 'KeyE' && !e.repeat && s.nearId) {
        s.activate(s.nearId);
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
      if (s.activeId && !prev.activeId) resetLiveInput();
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
