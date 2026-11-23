import { getExhibit } from '../../content';
import { useWorld, type WorldStore } from '../store';
import './world-ui.css';

export function Prompt({ touch, store = useWorld }: { touch: boolean; store?: WorldStore }) {
  const nearId = store((s) => s.nearId);
  const open = store((s) => s.activeId !== null);
  const activate = store((s) => s.activate);
  const ex = nearId ? getExhibit(nearId) : undefined;
  if (!ex || open) return null;
  return (
    <button
      type="button"
      className={touch ? 'world-prompt world-prompt--touch' : 'world-prompt'}
      data-testid="prompt"
      data-exhibit={ex.id}
      onClick={() => activate(ex.id)}
    >
      {touch ? `Tap to open — ${ex.title}` : `Press E — ${ex.title}`}
    </button>
  );
}
