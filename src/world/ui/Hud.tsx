import { EXHIBIT_COUNT, floorsOf, getBuilding } from '../../content';
import { useWorld, type WorldStore } from '../store';
import './world-ui.css';

export function Hud({
  store = useWorld,
  onScoutingOffice,
  onMap,
}: { store?: WorldStore; onScoutingOffice?(): void; onMap?(): void } = {}) {
  const scene = store((s) => s.scene);
  const count = store((s) => s.visited.length);
  const openMap = store((s) => s.openMap);
  const name = scene.kind === 'world' ? "Brayden's World" : (getBuilding(scene.id)?.name ?? "Brayden's World");
  const where = scene.kind === 'interior' && floorsOf(scene.id).length > 0 ? `${name} · Floor ${scene.floor ?? 1}` : name;
  return (
    <nav className="world-hud" aria-label="World">
      <a className="world-hud__btn" href="#/box-score">
        Skip to box score
      </a>
      <button
        type="button"
        className="world-hud__btn"
        onClick={() => {
          if (onScoutingOffice) onScoutingOffice();
          else window.location.hash = '#/box-score';
        }}
      >
        Scouting Office
      </button>
      <button
        type="button"
        className="world-hud__btn"
        onClick={() => {
          if (onMap) onMap();
          else openMap();
        }}
      >
        Map
      </button>
      <p className="world-hud__status">
        <span className="world-hud__where" aria-live="polite">{where}</span>
        <span className="world-hud__count">{`Exhibits visited ${count}/${EXHIBIT_COUNT}`}</span>
      </p>
    </nav>
  );
}
