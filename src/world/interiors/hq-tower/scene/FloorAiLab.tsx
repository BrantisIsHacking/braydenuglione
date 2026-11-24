import { ShapeBatch } from '../../../kit/ShapeBatch';
import { bx } from '../look';

/** Floor 4: zayi-fellow. Desk pod with monitors, a stack of document boxes, a node diagram board. */
export function FloorAiLab() {
  const desks = [[2.1, -8.2], [3.9, -8.2], [2.1, -9.0], [3.9, -9.0]];
  const boxes = [6.4, 7.2].flatMap((x) => [0.15, 0.45, 0.75].map((y) => bx(x, y, -10.5, 0.6, 0.28, 0.5)));
  const nodes = [bx(6.2, 1.7, -11.88, 0.3, 0.2, 0.03), bx(5.4, 1.1, -11.88, 0.3, 0.2, 0.03), bx(7.0, 1.1, -11.88, 0.3, 0.2, 0.03)];
  const lines = [bx(6.2, 1.4, -11.88, 0.04, 0.6, 0.03), bx(5.4, 1.4, -11.88, 0.04, 0.6, 0.03), bx(7.0, 1.4, -11.88, 0.04, 0.6, 0.03), bx(6.2, 1.4, -11.88, 1.6, 0.04, 0.03)];
  return (
    <>
      <ShapeBatch shape="box" color="stone" outline items={desks.map(([x, z]) => bx(x, 0.375, z, 1.2, 0.75, 0.6))} />
      <ShapeBatch shape="box" color="ink" items={desks.map(([x, z]) => bx(x, 1.05, z, 0.6, 0.4, 0.05))} />
      <ShapeBatch shape="box" color="warmGlow" glow={0.8} items={desks.map(([x, z]) => bx(x, 1.05, z + 0.03, 0.52, 0.32, 0.02))} />
      <ShapeBatch shape="box" color="offWhite" items={boxes} />
      <ShapeBatch shape="box" color="slate" items={[bx(6.2, 1.3, -11.93, 2.4, 1.3, 0.08)]} />
      <ShapeBatch shape="box" color="scarlet" items={nodes} />
      <ShapeBatch shape="box" color="offWhite" items={lines} />
    </>
  );
}
