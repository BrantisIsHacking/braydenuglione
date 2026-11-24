import { useRef } from 'react';
import { exhibitsIn, floorsOf } from '../../content';
import { useWorld, type WorldStore } from '../store';
import { useFocusTrap } from './focusTrap';
import './world-ui.css';

/** Floor picker opened from the elevator pad. A ride (or Up / Down) goes through `onRide`; the current floor just closes. */
export function ElevatorDialog({ onRide, store = useWorld }: { onRide(floor: number): void; store?: WorldStore }): JSX.Element | null {
  const open = store((s) => s.elevatorOpen);
  const scene = store((s) => s.scene);
  const close = store((s) => s.closeElevator);
  const ref = useRef<HTMLDivElement>(null);
  const currentBtn = useRef<HTMLButtonElement>(null);
  useFocusTrap(ref, open, close, currentBtn);
  if (!open || scene.kind !== 'interior') return null;
  const floors = floorsOf(scene.id);
  if (floors.length === 0) return null;
  const here = scene.floor ?? 1;
  const home = exhibitsIn(scene.id).filter((p) => !p.mirror);
  const ride = (n: number) => {
    close();
    if (n !== here) onRide(n);
  };
  return (
    <div
      className="world-backdrop"
      data-testid="elevator-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div ref={ref} className="world-map world-elevator" role="dialog" aria-modal="true" aria-labelledby="world-elevator-title">
        <div className="world-map__head">
          <h2 id="world-elevator-title" className="world-map__title">
            Elevator
          </h2>
          <button type="button" className="world-map__close" aria-label="Close elevator" onClick={close}>
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div className="world-elevator__body">
          <div className="world-elevator__steps">
            <button type="button" disabled={here >= floors.length} onClick={() => ride(here + 1)}>
              Up
            </button>
            <button type="button" disabled={here <= 1} onClick={() => ride(here - 1)}>
              Down
            </button>
          </div>
          {[...floors].reverse().map((f) => {
            const titles = home.filter((p) => p.floor === f.n).map((p) => p.exhibit.title);
            const current = f.n === here;
            return (
              <button
                key={f.n}
                ref={current ? currentBtn : undefined}
                type="button"
                className="world-elevator__floor"
                aria-current={current ? 'true' : undefined}
                onClick={() => ride(f.n)}
              >
                <strong>{`Floor ${f.n}: ${f.name}`}</strong>
                <span>{titles.join(', ')}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
