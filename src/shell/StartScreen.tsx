import { useEffect } from 'react';
import { profile } from '../content';
import { loadWorld } from './loadWorld';
import './shell.css';

export function StartScreen({ onExplore, touch = false }: { onExplore: () => void; touch?: boolean }) {
  useEffect(() => {
    loadWorld().catch(() => {
      /* the boundary handles failure when the world mounts */
    });
  }, []);
  return (
    <main className="tipoff start">
      <p className="tipoff__jersey" aria-hidden="true">
        {profile.jersey}
      </p>
      <h1 className="tipoff__name">Brayden&apos;s World</h1>
      <p className="start__owner">{profile.name}</p>
      <p className="tipoff__tagline">{profile.tagline}</p>
      <p className="tipoff__targets">{profile.targets}</p>
      <div className="start__actions">
        <button type="button" className="tipoff__go" autoFocus onClick={onExplore}>
          Explore
        </button>
        <button
          type="button"
          className="start__report"
          onClick={() => {
            window.location.hash = '#/box-score';
          }}
        >
          Scouting Report
        </button>
      </div>
      <p className="tipoff__hint">
        {touch ? 'Drag the pad to move · tap Interact to open' : 'W A S D / arrows to move · E to open · M for the map'}
      </p>
    </main>
  );
}
