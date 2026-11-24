import { ShapeBatch } from '../../../kit/ShapeBatch';
import { ELEVATOR_CAR, HQ_ELEVATOR } from '../geometry';
import { bx } from '../look';

/** Elevator car on the north wall plus the floor plate of the pad; the car doors are the interactive prop. */
export function Elevator() {
  const { x, z, w, d } = ELEVATOR_CAR;
  const front = z + d / 2;
  const p = HQ_ELEVATOR.rect;
  return (
    <>
      <ShapeBatch shape="box" color="ink" items={[bx(x, 1.3, z, w, 2.6, d)]} />
      <ShapeBatch shape="box" color="stone" outline items={[bx(x - 0.5, 1.0, front + 0.03, 0.95, 2.0, 0.06), bx(x + 0.5, 1.0, front + 0.03, 0.95, 2.0, 0.06)]} />
      <ShapeBatch shape="box" color="warmGlow" glow={0.8} items={[bx(x, 2.4, front + 0.04, 1.6, 0.12, 0.05)]} />
      <ShapeBatch shape="box" color="scarlet" items={[bx(p.x, 0.015, p.z, p.w, 0.03, p.d)]} />
    </>
  );
}
