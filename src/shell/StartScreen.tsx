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
      <p className="start__role">SWE · Data Science · ML · Rutgers Honors College</p>
      <p className="tipoff__tagline">{profile.tagline}</p>
      <p className="tipoff__targets">{profile.targets}</p>
      <div className="start__actions">
        <div className="start__choice">
          <button type="button" className="tipoff__go" autoFocus onClick={onExplore} aria-describedby="start-explore-cap">
            Explore
          </button>
          <p className="start__cap" id="start-explore-cap">
            Walk around my 3D portfolio
          </p>
        </div>
        <div className="start__choice">
          <button
            type="button"
            className="start__report"
            aria-describedby="start-report-cap"
            onClick={() => {
              window.location.hash = '#/box-score';
            }}
          >
            Scouting Report
          </button>
          <p className="start__cap" id="start-report-cap">
            In a hurry? Experience, projects and contact on one page
          </p>
        </div>
      </div>
      <p className="tipoff__hint">
        {touch ? 'Drag the pad to move · tap Interact to open' : 'W A S D / arrows to move · E to open · M for the map'}
      </p>
    </main>
  );
}
