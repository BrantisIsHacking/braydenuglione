import { useEffect, useRef } from 'react';
import { getExhibit } from '../../content';
import { ExhibitContent } from '../../ui/ExhibitContent';
import { useWorld, type WorldStore } from '../store';
import { FOCUSABLE, useFocusTrap } from './focusTrap';
import './world-ui.css';

export { FOCUSABLE };

function isTyping(el: Element | null): boolean {
  if (!el) return false;
  const t = el.tagName;
  return t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT' || (el as HTMLElement).isContentEditable === true;
}

export function Panel({ store = useWorld }: { store?: WorldStore } = {}) {
  const activeId = store((s) => s.activeId);
  const activeFocus = store((s) => s.activeFocus);
  const closePanel = store((s) => s.closePanel);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const downOnBackdrop = useRef(false);
  const exhibit = activeId ? getExhibit(activeId) : undefined;

  useFocusTrap(dialogRef, !!exhibit, closePanel, closeRef);

  useEffect(() => {
    if (!exhibit) return;
    const onKey = (e: KeyboardEvent) => {
      const body = bodyRef.current;
      const act = document.activeElement as HTMLElement | null;
      if (!body || isTyping(act) || (act && body.contains(act))) return;
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
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [exhibit]);

  if (!exhibit) return null;
  return (
    <div
      className="world-backdrop"
      data-testid="panel-backdrop"
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
        className="world-panel"
        role="dialog"
        aria-modal="true"
        aria-label={exhibit.title}
        onClick={(e) => e.stopPropagation()}
      >
        <button ref={closeRef} type="button" className="world-panel__close" aria-label="Close panel" onClick={closePanel}>
          <span aria-hidden="true">&times;</span>
        </button>
        <div ref={bodyRef} className="world-panel__body" tabIndex={0}>
          <ExhibitContent exhibit={exhibit} headingLevel={2} focus={activeFocus} />
        </div>
      </div>
    </div>
  );
}
