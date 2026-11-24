import { ShapeBatch } from '../../../kit/ShapeBatch';
import { bx } from '../look';

/** Floor 1: a door out of the building, a frame with daylight behind it. */
export function DoorOut() {
  return (
    <>
      <ShapeBatch shape="box" color="ink" items={[bx(-1.4, 1.3, -0.1, 0.2, 2.6, 0.3), bx(1.4, 1.3, -0.1, 0.2, 2.6, 0.3), bx(0, 2.65, -0.1, 3.0, 0.3, 0.3)]} />
      <ShapeBatch shape="box" color="sky" glow={0.35} items={[bx(0, 1.2, 0.12, 2.6, 2.4, 0.04)]} />
    </>
  );
}

/** Floors 2-4: the south exit is a stairwell going down: a curb round a dark opening, treads darkening as they descend, rails. */
export function StairsDown() {
  const treads = Array.from({ length: 6 }, (_, i) => bx(0, 0.035, -1.4 + i * 0.25, 2.2 - i * 0.1, 0.02, 0.2));
  return (
    <>
      <ShapeBatch shape="box" color="slate" items={[bx(-1.3, 0.1, -0.75, 0.2, 0.2, 1.7), bx(1.3, 0.1, -0.75, 0.2, 0.2, 1.7), bx(0, 0.1, -1.6, 2.8, 0.2, 0.2)]} />
      <ShapeBatch shape="box" color="ink" items={[bx(0, 0.02, -0.75, 2.4, 0.04, 1.5)]} />
      <ShapeBatch shape="box" color="offWhite" items={treads.slice(0, 2)} />
      <ShapeBatch shape="box" color="stone" items={treads.slice(2, 4)} />
      <ShapeBatch shape="box" color="rack" items={treads.slice(4)} />
      <ShapeBatch shape="box" color="scarlet" items={[bx(-1.3, 0.95, -0.75, 0.06, 0.06, 1.7), bx(1.3, 0.95, -0.75, 0.06, 0.06, 1.7)]} />
      <ShapeBatch shape="cylinder" color="scarlet" items={[-1.3, 1.3].flatMap((x) => [-1.5, -0.75, -0.05].map((z) => ({ x, y: 0.5, z, sx: 0.06, sy: 0.9, sz: 0.06 })))} />
    </>
  );
}
