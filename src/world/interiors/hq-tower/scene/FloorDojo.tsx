import { ShapeBatch } from '../../../kit/ShapeBatch';
import { bx } from '../look';

/** Floor 2: code-ninjas. Floor mats, a row of low desks with laptops, a whiteboard. */
export function FloorDojo() {
  const mats = (parity: number) =>
    [0, 1, 2, 3, 4, 5]
      .filter((i) => (Math.floor(i / 3) + (i % 3)) % 2 === parity)
      .map((i) => bx(2.2 + (i % 3) * 1.5, 0.02, -5.2 - Math.floor(i / 3) * 1.5, 1.4, 0.04, 1.4));
  const xs = [1.75, 2.55, 3.45, 4.25];
  return (
    <>
      <ShapeBatch shape="box" color="scarlet" items={mats(0)} />
      <ShapeBatch shape="box" color="ink" items={mats(1)} />
      <ShapeBatch shape="box" color="stone" outline items={xs.map((x) => bx(x, 0.375, -8.6, 0.7, 0.75, 0.5))} />
      <ShapeBatch shape="box" color="slate" items={xs.map((x) => bx(x, 0.8, -8.6, 0.4, 0.04, 0.3))} />
      <ShapeBatch shape="box" color="warmGlow" glow={0.8} items={xs.map((x) => bx(x, 0.98, -8.74, 0.4, 0.3, 0.03))} />
      <ShapeBatch shape="box" color="ink" items={[bx(6.2, 1.3, -11.93, 2.4, 1.3, 0.08)]} />
      <ShapeBatch shape="box" color="offWhite" items={[bx(6.2, 1.3, -11.88, 2.2, 1.1, 0.02)]} />
    </>
  );
}
