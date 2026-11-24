import { useRef } from 'react';
import { buildings, exhibitsIn, floorsOf } from '../../content';
import type { District } from '../../content/types';
import { useWorld, type WorldStore } from '../store';
import { useFocusTrap } from './focusTrap';
import './world-ui.css';

const DISTRICTS: { id: District; name: string }[] = [
  { id: 'square', name: 'Town Square' },
  { id: 'career', name: 'Career District' },
  { id: 'culture', name: 'Culture Row' },
  { id: 'sports', name: 'Sports Side' },
];

export function MapDialog({ onTravel, store = useWorld }: { onTravel(hash: string): void; store?: WorldStore }) {
  const open = store((s) => s.mapOpen);
  const closeMap = store((s) => s.closeMap);
  const ref = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  useFocusTrap(ref, open, closeMap, closeBtn);
  if (!open) return null;
  const travel = (hash: string) => {
    closeMap();
    onTravel(hash);
  };
  return (
    <div
      className="world-backdrop"
      data-testid="map-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeMap();
      }}
    >
      <div ref={ref} className="world-map" role="dialog" aria-modal="true" aria-labelledby="world-map-title">
        <div className="world-map__head">
          <h2 id="world-map-title" className="world-map__title">
            Map
          </h2>
          <button ref={closeBtn} type="button" className="world-map__close" aria-label="Close map" onClick={closeMap}>
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div className="world-map__body">
          {DISTRICTS.map((d) => (
            <section key={d.id} className="world-map__district" aria-labelledby={`world-map-${d.id}`}>
              <h3 id={`world-map-${d.id}`} className="world-map__district-title">
                {d.name}
              </h3>
              <ul className="world-map__list">
                {buildings
                  .filter((b) => b.district === d.id)
                  .map((b) => {
                    const home = exhibitsIn(b.id).filter((p) => !p.mirror);
                    return (
                      <li key={b.id}>
                        <button
                          type="button"
                          className="world-map__building"
                          onClick={() => travel(b.kind === 'overlay' ? '#/box-score' : `#/b/${b.id}`)}
                        >
                          {b.name}
                        </button>
                        {home.length > 0 && (
                          <ul className="world-map__exhibits">
                            {home.map((p) => (
                              <li key={p.exhibit.id}>
                                <button type="button" className="world-map__exhibit" onClick={() => travel(`#${p.exhibit.id}`)}>
                                  {p.exhibit.title}
                                  {floorsOf(b.id).length > 0 && p.floor !== undefined ? ` (Floor ${p.floor})` : ''}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
