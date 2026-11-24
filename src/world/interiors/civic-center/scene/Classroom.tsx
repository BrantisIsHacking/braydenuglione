import { ShapeBatch } from '../../../kit/ShapeBatch';
import { bx } from '../look';

const COLS = [5.7, 8.3];
const ROWS = [-15, -14.1, -13.2];
const GRID = COLS.flatMap((x) => ROWS.map((z) => ({ x, z })));

/** Six desks with chairs facing a chalkboard (an integral sign drawn from thin boxes) on the north wall. */
export function Classroom() {
  const legs = GRID.flatMap(({ x, z }) => [bx(x - 0.55, 0.35, z, 0.06, 0.7, 0.5), bx(x + 0.55, 0.35, z, 0.06, 0.7, 0.5)]);
  const chairs = GRID.flatMap(({ x, z }) => [bx(x, 0.42, z + 0.55, 0.4, 0.06, 0.4), bx(x, 0.65, z + 0.74, 0.4, 0.4, 0.05)]);
  const zc = -15.86;
  const strokes = [
    bx(5.9, 1.9, zc, 0.07, 0.8, 0.02),
    bx(6.0, 2.3, zc, 0.22, 0.07, 0.02),
    bx(5.8, 1.5, zc, 0.22, 0.07, 0.02),
    bx(7.4, 2.0, zc, 0.9, 0.05, 0.02, 0.3),
    bx(7.6, 1.8, zc, 0.9, 0.05, 0.02, -0.3),
    bx(8.4, 1.6, zc, 0.8, 0.05, 0.02),
  ];
  return (
    <>
      <ShapeBatch shape="box" color="hardwood" outline items={GRID.map(({ x, z }) => bx(x, 0.72, z, 1.2, 0.06, 0.6))} />
      <ShapeBatch shape="box" color="ink" items={[...legs, ...chairs]} />
      <ShapeBatch shape="box" color="slate" items={[bx(7, 1.9, -15.92, 3.4, 1.3, 0.08)]} />
      <ShapeBatch shape="box" color="offWhite" items={strokes} />
    </>
  );
}
