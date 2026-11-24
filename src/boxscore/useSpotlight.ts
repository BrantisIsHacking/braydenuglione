import { useEffect, useRef } from 'react';

const FINE = '(hover: hover) and (pointer: fine)';
const REDUCED = '(prefers-reduced-motion: reduce)';

const matches = (q: string): boolean => {
  try {
    return typeof window.matchMedia === 'function' && window.matchMedia(q).matches;
  } catch {
    return false;
  }
};

/**
 * Feeds the pointer position to CSS (`--mx`, `--my`) for the subtle scarlet spotlight. Does nothing on touch or when the
 * visitor prefers reduced motion; `data-spot="on"` is only set when the effect is live, so CSS can key off it.
 */
export function useSpotlight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !matches(FINE) || matches(REDUCED)) return;
    el.dataset.spot = 'on';
    let raf = 0;
    let x = 0;
    let y = 0;
    const paint = () => {
      raf = 0;
      el.style.setProperty('--mx', `${x}px`);
      el.style.setProperty('--my', `${y}px`);
    };
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(paint);
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      if (raf) cancelAnimationFrame(raf);
      delete el.dataset.spot;
    };
  }, []);
  return ref;
}
