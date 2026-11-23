import { getExhibit } from '../../content';
import { useWorld, type WorldStore } from '../store';
import './controls.css';

export function InteractButton({ store = useWorld }: { store?: WorldStore }) {
  const nearId = store((s) => s.nearId);
  const open = store((s) => s.activeId !== null);
  const activate = store((s) => s.activate);
  const ex = nearId ? getExhibit(nearId) : undefined;
  if (!ex || open) return null;
  return (
    <button type="button" className="world-interact" data-testid="interact-button" aria-label={`Open ${ex.title}`} onClick={() => activate(ex.id)}>
      <span aria-hidden="true">E</span>
    </button>
  );
}
