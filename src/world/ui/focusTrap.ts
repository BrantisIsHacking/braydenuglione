import { useEffect, useRef, type RefObject } from 'react';

export const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]';

/** Open traps, topmost last; only the topmost reacts to keys. */
const stack: symbol[] = [];

function wrapper(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-world-focus]');
}

/** Tab wraps inside `ref`, Esc calls onClose, focus moves to `initial` (or the first focusable) on open and returns to the world wrapper on close. */
export function useFocusTrap(
  ref: RefObject<HTMLElement>,
  active: boolean,
  onClose: () => void,
  initial?: RefObject<HTMLElement>,
): void {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!active) return;
    const id = Symbol('trap');
    stack.push(id);
    const first = initial?.current ?? ref.current?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== id) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const d = ref.current;
      if (!d) return;
      const f = Array.from(d.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (f.length === 0) {
        e.preventDefault();
        return;
      }
      const a = document.activeElement as HTMLElement | null;
      if (!a || !d.contains(a)) {
        e.preventDefault();
        (e.shiftKey ? f[f.length - 1] : f[0]).focus();
      } else if (e.shiftKey && a === f[0]) {
        e.preventDefault();
        f[f.length - 1].focus();
      } else if (!e.shiftKey && a === f[f.length - 1]) {
        e.preventDefault();
        f[0].focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      const i = stack.indexOf(id);
      if (i >= 0) stack.splice(i, 1);
      wrapper()?.focus();
    };
  }, [active, ref, initial]);
}
