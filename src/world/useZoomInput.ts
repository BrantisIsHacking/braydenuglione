import { useEffect, type RefObject } from 'react';
import { zoomStep } from './logic/camera';
import { liveInput } from './liveInput';
import { useWorld, type WorldStore } from './store';

export const WHEEL_STEP_MS = 150;
const PINCH_RATIO = 0.15;

/** delta -1 = closer, +1 = farther. */
export function zoomBy(store: WorldStore, delta: -1 | 1): void {
  const s = store.getState();
  s.setZoom(zoomStep(s.zoomIndex, delta));
}

/**
 * Wheel (one step per 150 ms; deltaY > 0 = farther) and two-finger pinch. +/- keys live in useKeyboard.
 * Attach to the canvas container only (never a wrapper holding Panel/Map); inert while a panel or the map
 * is open or a scene transition is running, so the page and dialogs keep their own scrolling.
 */
export function useZoomInput(ref: RefObject<HTMLElement>, store: WorldStore = useWorld): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const busy = () => {
      const s = store.getState();
      return s.activeId !== null || s.mapOpen || s.elevatorOpen || s.phase !== 'idle';
    };
    const wheel = (e: WheelEvent) => {
      if (e.ctrlKey || !e.deltaY || busy()) return;
      e.preventDefault();
      const now = performance.now();
      if (now - liveInput.zoomRequest.at < WHEEL_STEP_MS) return;
      liveInput.zoomRequest.at = now;
      zoomBy(store, e.deltaY > 0 ? 1 : -1);
    };
    const pts = new Map<number, { x: number; y: number }>();
    let base = 0;
    const span = () => {
      const [a, b] = [...pts.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };
    const down = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) base = span();
    };
    const move = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size !== 2 || base <= 0 || busy()) return;
      const ratio = span() / base;
      if (ratio > 1 + PINCH_RATIO) {
        zoomBy(store, -1);
        base = span();
      } else if (ratio < 1 - PINCH_RATIO) {
        zoomBy(store, 1);
        base = span();
      }
    };
    const up = (e: PointerEvent) => {
      pts.delete(e.pointerId);
      base = 0;
    };
    el.addEventListener('wheel', wheel, { passive: false });
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', up);
    return () => {
      el.removeEventListener('wheel', wheel);
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('pointerleave', up);
    };
  }, [ref, store]);
}
