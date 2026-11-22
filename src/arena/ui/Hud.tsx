import { getStation } from '../../content';
import { seasonLabel } from '../logic/season';
import { useArena } from '../store';
import './arena-ui.css';

export function Hud({ store = useArena }: { store?: typeof useArena } = {}) {
  const nearestId = store((s) => s.nearestId);
  const count = store((s) => s.visited.length);
  const nearest = nearestId ? getStation(nearestId) : undefined;
  return (
    <>
      <div className="arena-hud arena-hud--left">
        {nearest && <span className="arena-hud__season">{`Season ${seasonLabel(nearest.start)}`}</span>}
      </div>
      <div className="arena-hud arena-hud--right">
        <span className="arena-hud__count">{`Stations visited ${count}/24`}</span>
        <a className="arena-hud__skip" href="#/box-score">
          Skip to box score
        </a>
      </div>
    </>
  );
}
