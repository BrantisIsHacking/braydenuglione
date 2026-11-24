import { getExhibit } from '../../content';
import { useWorld, type WorldStore } from '../store';
import './controls.css';

export function InteractButton({ store = useWorld }: { store?: WorldStore }) {
  const nearId = store((s) => s.nearId);
  const nearFocus = store((s) => s.nearFocus);
  const open = store((s) => s.activeId !== null);
  const activate = store((s) => s.activate);
  const onElevator = store((s) => s.padId === 'elevator');
  const openElevator = store((s) => s.openElevator);
  const ex = nearId ? getExhibit(nearId) : undefined;
  if (open) return null;
  if (!ex) {
    if (!onElevator) return null;
    return (
      <button type="button" className="world-interact" data-testid="interact-button" aria-label="Open the elevator" onClick={openElevator}>
        <span aria-hidden="true">E</span>
      </button>
    );
  }
  return (
    <button type="button" className="world-interact" data-testid="interact-button" aria-label={`Open ${ex.title}${nearFocus ? `: ${nearFocus}` : ''}`} onClick={() => activate(ex.id, nearFocus)}>
      <span aria-hidden="true">E</span>
    </button>
  );
}
