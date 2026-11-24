import { ShapeBatch } from '../../../kit/ShapeBatch';
import { bx } from '../look';

const X = -7;
const ROWS = [0, 1, 2].map((k) => ({ z: -14 + k * 0.8, h: 0.25 * (k + 1) }));
const CARDS = Array.from({ length: 12 }, (_, i) => ({
  alt: i % 2 === 1,
  item: bx(-10.85, 1.2 + Math.floor(i / 4) * 0.4, -14 + (i % 4) * 0.66, 0.04, 0.3, 0.42),
}));

/** Three tiered bench rows facing a lectern on the north wall, plus the mentorship board on the west wall. */
export function LectureHall() {
  const seats = ROWS.map((r) => bx(X, r.h + 0.35, r.z, 3, 0.08, 0.36));
  const backs = ROWS.map((r) => bx(X, r.h + 0.62, r.z + 0.2, 3, 0.4, 0.06));
  const legs = ROWS.flatMap((r) => [bx(X - 1.3, r.h + 0.17, r.z, 0.08, 0.34, 0.3), bx(X + 1.3, r.h + 0.17, r.z, 0.08, 0.34, 0.3)]);
  return (
    <>
      <ShapeBatch shape="box" color="path" items={ROWS.map((r) => bx(X, r.h / 2, r.z, 3.6, r.h, 0.8))} />
      <ShapeBatch shape="box" color="hardwood" outline items={[...seats, ...backs]} />
      <ShapeBatch shape="box" color="ink" items={[...legs, bx(X, 0.5, -15.3, 0.7, 1, 0.5)]} />
      <ShapeBatch shape="box" color="offWhite" items={[bx(X, 1.03, -15.3, 0.8, 0.06, 0.6), ...CARDS.filter((c) => c.alt).map((c) => c.item)]} />
      <ShapeBatch shape="box" color="slate" items={[bx(-10.92, 1.6, -13, 0.08, 1.4, 2.8)]} />
      <ShapeBatch shape="box" color="scarlet" items={CARDS.filter((c) => !c.alt).map((c) => c.item)} />
    </>
  );
}
