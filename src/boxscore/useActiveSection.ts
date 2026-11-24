import { useEffect, useRef, useState } from 'react';
import { pickActive } from './logic';

/**
 * Tracks which section the reader is in. A section is "current" while it crosses a thin band near the top third of the
 * viewport; a sentinel at the page end selects the last section (a short final section may never reach the band).
 * Purely observational, so it is safe under reduced motion.
 */
export function useActiveSection(ids: readonly string[], endId: string): string {
  const [active, setActive] = useState(ids[0] ?? '');
  const key = ids.join('|');
  const state = useRef({ visible: new Set<string>(), atEnd: false, prev: ids[0] ?? '' });

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const order = key.split('|');
    const s = state.current;
    const update = () => {
      const next = pickActive(order, s.visible, s.prev, s.atEnd);
      s.prev = next;
      setActive(next);
    };
    const band = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) s.visible.add(e.target.id);
          else s.visible.delete(e.target.id);
        }
        update();
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    for (const id of order) {
      const el = document.getElementById(id);
      if (el) band.observe(el);
    }
    const end = new IntersectionObserver((entries) => {
      s.atEnd = entries.some((e) => e.isIntersecting);
      update();
    });
    const endEl = document.getElementById(endId);
    if (endEl) end.observe(endEl);
    return () => {
      band.disconnect();
      end.disconnect();
      s.visible.clear();
    };
  }, [key, endId]);

  return active;
}
