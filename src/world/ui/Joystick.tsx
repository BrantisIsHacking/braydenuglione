import { useRef, type PointerEvent } from 'react';
import { joystickVector } from '../logic/input';
import { liveInput } from '../liveInput';
import { useWorld, type WorldStore } from '../store';
import './world-ui.css';

const RADIUS = 50;

export function Joystick({ store = useWorld }: { store?: WorldStore } = {}) {
  const knob = useRef<HTMLDivElement>(null);
  const active = useRef<number | null>(null);

  const apply = (e: PointerEvent<HTMLDivElement>) => {
    const s = store.getState();
    if (s.activeId || s.mapOpen || s.phase !== 'idle') return end();
    const r = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const v = joystickVector(dx, dy, RADIUS);
    liveInput.joy.x = v.x;
    liveInput.joy.y = v.y;
    if (knob.current) knob.current.style.transform = `translate(${v.x * RADIUS * 0.6}px, ${-v.y * RADIUS * 0.6}px)`;
  };
  function end() {
    active.current = null;
    liveInput.joy.x = 0;
    liveInput.joy.y = 0;
    if (knob.current) knob.current.style.transform = '';
  }
  return (
    <div
      className="world-joystick"
      data-testid="joystick"
      aria-hidden="true"
      onPointerDown={(e) => {
        active.current = e.pointerId;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        apply(e);
      }}
      onPointerMove={(e) => {
        if (active.current === e.pointerId) apply(e);
      }}
      onPointerUp={(e) => active.current === e.pointerId && end()}
      onPointerCancel={(e) => active.current === e.pointerId && end()}
      onLostPointerCapture={(e) => active.current === e.pointerId && end()}
    >
      <div ref={knob} className="world-joystick__knob" />
    </div>
  );
}
