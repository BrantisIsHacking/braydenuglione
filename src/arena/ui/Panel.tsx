import { useEffect, useRef } from 'react';
import { getStation, type Station } from '../../content';
import { StationContent } from '../../ui/StationContent';
import { useArena } from '../store';
import './arena-ui.css';

export const FOCUSABLE = 'a[href],button:not([disabled]),[tabindex="0"]';

export function Panel({ store = useArena }: { store?: typeof useArena } = {}) {
  const activeId = store((s) => s.activeId);
  const closePanel = store((s) => s.closePanel);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const downOnBackdrop = useRef(false);

  useEffect(() => {
    if (!activeId) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closePanel();
        return;
      }
      const body = bodyRef.current;
      const act = document.activeElement as HTMLElement | null;
      if (body && !(act && body.contains(act))) {
        const page = body.clientHeight * 0.9;
        let dy = 0;
        if (e.key === 'ArrowDown') dy = 80;
        else if (e.key === 'ArrowUp') dy = -80;
        else if (e.key === 'PageDown') dy = page;
        else if (e.key === 'PageUp') dy = -page;
        else if (e.key === ' ' && !(act && (act.tagName === 'BUTTON' || act.tagName === 'A'))) dy = e.shiftKey ? -page : page;
        if (dy !== 0) {
          e.preventDefault();
          body.scrollTop += dy;
          return;
        }
      }
      if (e.key !== 'Tab') return;
      const d = dialogRef.current;
      if (!d) return;
      const f = Array.from(d.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (f.length === 0) return;
      const first = f[0];
      const last = f[f.length - 1];
      const a = document.activeElement as HTMLElement | null;
      if (!a || !d.contains(a)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && a === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && a === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.querySelector<HTMLElement>('[data-arena-focus]')?.focus();
    };
  }, [activeId, closePanel]);

  const station: Station | undefined = activeId ? getStation(activeId) : undefined;
  if (!station) return null;
  return (
    <div className="arena-panel-backdrop" data-testid="panel-backdrop"
      onMouseDown={(e) => {
        downOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        const ok = downOnBackdrop.current && e.target === e.currentTarget;
        downOnBackdrop.current = false;
        if (ok) closePanel();
      }}
    >
      <div
        ref={dialogRef}
        className="arena-panel"
        role="dialog"
        aria-modal="true"
        aria-label={station.title}
        onClick={(e) => e.stopPropagation()}
      >
        <button ref={closeRef} type="button" className="arena-panel__close" aria-label="Close panel" onClick={closePanel}>
          <span aria-hidden="true">&times;</span>
        </button>
        <div ref={bodyRef} className="arena-panel__body" tabIndex={0}>
          <StationContent station={station} headingLevel={2} />
        </div>
      </div>
    </div>
  );
}
