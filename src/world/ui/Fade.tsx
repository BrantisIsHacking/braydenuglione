import { useEffect } from 'react';
import { useWorld, type WorldStore } from '../store';
import './world-ui.css';

export const FADE_MS = 250;

/** Black overlay over the canvas: opaque while fading out and loading, then fades back in. Drives beginLoad/settle. */
export function Fade({ reducedMotion, store = useWorld }: { reducedMotion: boolean; store?: WorldStore }) {
  const phase = store((s) => s.phase);
  useEffect(() => {
    if (phase !== 'fading-out' && phase !== 'fading-in') return;
    const t = window.setTimeout(
      () => {
        const s = store.getState();
        if (phase === 'fading-out') s.beginLoad();
        else s.settle();
      },
      reducedMotion ? 0 : FADE_MS,
    );
    return () => window.clearTimeout(t);
  }, [phase, reducedMotion, store]);
  const dark = phase === 'fading-out' || phase === 'loading';
  return (
    <div
      className="world-fade"
      data-testid="fade"
      aria-hidden={phase === 'loading' ? undefined : true}
      style={{ opacity: dark ? 1 : 0, transition: reducedMotion ? 'none' : `opacity ${FADE_MS}ms ease` }}
    >
      {phase === 'loading' && (
        <p className="world-fade__status" role="status">
          Loading…
        </p>
      )}
    </div>
  );
}
