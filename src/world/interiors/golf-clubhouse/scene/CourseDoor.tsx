import { ShapeBatch } from '../../../kit/ShapeBatch';
import { GOLF_COURSE_PAD } from '../geometry';
import { bx } from '../look';

/** Floor 1: the double door to the course in the north wall, with a fairway mat on the walk-in pad. */
export function CourseDoor() {
  const r = GOLF_COURSE_PAD.rect;
  return (
    <>
      <ShapeBatch shape="box" color="ink" items={[bx(-1.75, 1.15, -11.85, 0.2, 2.3, 0.25), bx(1.75, 1.15, -11.85, 0.2, 2.3, 0.25), bx(0, 2.4, -11.85, 3.7, 0.2, 0.25)]} />
      <ShapeBatch shape="box" color="sky" glow={0.35} items={[bx(0, 1.15, -11.93, 3.3, 2.3, 0.04)]} />
      <ShapeBatch shape="box" color="hardwood" items={[bx(-1.45, 1.1, -11.8, 0.55, 2.2, 0.08), bx(1.45, 1.1, -11.8, 0.55, 2.2, 0.08)]} />
      <ShapeBatch shape="box" color="fairway" items={[bx(r.x, 0.03, r.z, r.w, 0.03, r.d)]} />
    </>
  );
}

/** Floor 1: the street door, a frame with daylight behind it. */
export function DoorOut() {
  return (
    <>
      <ShapeBatch shape="box" color="ink" items={[bx(-1.4, 1.3, -0.1, 0.2, 2.6, 0.3), bx(1.4, 1.3, -0.1, 0.2, 2.6, 0.3), bx(0, 2.65, -0.1, 3.0, 0.3, 0.3)]} />
      <ShapeBatch shape="box" color="sky" glow={0.35} items={[bx(0, 1.2, 0.12, 2.6, 2.4, 0.04)]} />
    </>
  );
}

/** Floor 2: the south exit is a stairwell down to the clubhouse. */
export function StairsDown() {
  const treads = Array.from({ length: 6 }, (_, i) => bx(0, 0.035, -1.4 + i * 0.25, 2.2 - i * 0.1, 0.02, 0.2));
  return (
    <>
      <ShapeBatch shape="box" color="slate" items={[bx(-1.3, 0.1, -0.75, 0.2, 0.2, 1.7), bx(1.3, 0.1, -0.75, 0.2, 0.2, 1.7), bx(0, 0.1, -1.6, 2.8, 0.2, 0.2)]} />
      <ShapeBatch shape="box" color="ink" items={[bx(0, 0.02, -0.75, 2.4, 0.04, 1.5)]} />
      <ShapeBatch shape="box" color="offWhite" items={treads.slice(0, 3)} />
      <ShapeBatch shape="box" color="stone" items={treads.slice(3)} />
    </>
  );
}
