import { ShapeBatch } from '../../../kit/ShapeBatch';
import { bx } from '../look';

const TABLES = [-2.2, 2.2];

/** The judges table with three chairs facing south, and two project tables with laptops. */
export function JudgingHall() {
  const chairs = [-1, 0, 1].flatMap((x) => [bx(x, 0.45, -15.55, 0.5, 0.08, 0.5), bx(x, 0.8, -15.8, 0.5, 0.6, 0.08)]);
  const legs = TABLES.flatMap((x) => [bx(x - 0.6, 0.37, -12.6, 0.08, 0.74, 0.6), bx(x + 0.6, 0.37, -12.6, 0.08, 0.74, 0.6)]);
  return (
    <>
      <ShapeBatch shape="box" color="hardwood" outline items={[bx(0, 0.75, -14.7, 3, 0.08, 0.8), ...TABLES.map((x) => bx(x, 0.75, -12.6, 1.4, 0.08, 0.7))]} />
      <ShapeBatch shape="box" color="scarlet" items={[bx(0, 0.38, -14.35, 3, 0.74, 0.06)]} />
      <ShapeBatch shape="box" color="ink" items={[...chairs, ...legs]} />
      <ShapeBatch shape="box" color="slate" items={TABLES.map((x) => bx(x, 0.8, -12.55, 0.42, 0.03, 0.3))} />
      <ShapeBatch shape="box" color="warmGlow" glow={1.2} items={TABLES.map((x) => bx(x, 0.95, -12.7, 0.42, 0.26, 0.02))} />
    </>
  );
}
