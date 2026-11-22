import { useEffect } from 'react';
import { profile } from '../content';
import { loadArena } from './loadArena';
import './shell.css';

export function TipOff({ onStart, touch = false }: { onStart: () => void; touch?: boolean }) {
  useEffect(() => {
    loadArena().catch(() => {
      /* the boundary handles failure when the arena mounts */
    });
  }, []);
  return (
    <main className="tipoff">
      <p className="tipoff__jersey" aria-hidden="true">
        {profile.jersey}
      </p>
      <h1 className="tipoff__name">{profile.name}</h1>
      <p className="tipoff__tagline">{profile.tagline}</p>
      <p className="tipoff__targets">{profile.targets}</p>
      <button type="button" className="tipoff__go" autoFocus onClick={onStart}>
        Tip-off
      </button>
      <p className="tipoff__hint">{touch ? 'Drag the pad to move · tap a station to open' : 'W A S D / arrows to move · E to open a station'}</p>
      <a className="tipoff__skip" href="#/box-score">
        Skip to box score
      </a>
    </main>
  );
}
