import { getStation } from '../../content';
import { useArena } from '../store';
import './arena-ui.css';

export function Prompt({ touch, store = useArena }: { touch: boolean; store?: typeof useArena }) {
  const nearId = store((s) => s.nearId);
  const open = store((s) => s.activeId !== null);
  const activate = store((s) => s.activate);
  const st = nearId ? getStation(nearId) : undefined;
  if (!st || open) return null;
  return (
    <button type="button" className={touch ? 'arena-prompt arena-prompt--touch' : 'arena-prompt'} data-testid="prompt" data-station={st.id} onClick={() => activate(st.id)}>
      {touch ? `Tap to open — ${st.title}` : `Press E — ${st.title}`}
    </button>
  );
}
