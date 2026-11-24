import { ShapeBatch } from '../../../kit/ShapeBatch';
import { bx, cy } from '../look';

/** Floor 1: pro-shop counter, club rack, trophy shelf, bench, plants, trim and a runner to the course door. */
export function Clubhouse() {
  const shelfYs = [0.5, 1.1, 1.7];
  const cupZs = [-10.5, -9.5, -8.5];
  const clubZs = Array.from({ length: 8 }, (_, i) => -6.3 + i * 0.36);
  return (
    <>
      {/* trim + runner */}
      <ShapeBatch shape="box" color="fairway" items={[bx(0, 1.0, -11.93, 16, 0.14, 0.1), bx(-7.93, 1.0, -6, 0.1, 0.14, 12), bx(7.93, 1.0, -6, 0.1, 0.14, 12), bx(0, 0.012, -6.4, 2.0, 0.024, 8.8)]} />
      {/* pro shop counter */}
      <ShapeBatch shape="box" color="hardwood" outline items={[bx(5.6, 0.5, -10.9, 4, 1.0, 1.0)]} />
      <ShapeBatch shape="box" color="offWhite" items={[bx(5.6, 1.04, -10.9, 4.2, 0.08, 1.2)]} />
      <ShapeBatch shape="sphere" color="offWhite" items={[4.6, 5.2, 5.8, 6.4].map((x) => ({ x, y: 1.14, z: -10.7, sx: 0.14, sy: 0.14, sz: 0.14 }))} />
      <ShapeBatch shape="box" color="slate" items={[bx(5.6, 1.7, -11.8, 3.6, 0.08, 0.3), bx(5.6, 2.2, -11.8, 3.6, 0.08, 0.3)]} />
      {/* club rack */}
      <ShapeBatch shape="box" color="hardwood" items={[bx(7.45, 0.35, -5, 0.7, 0.7, 3.2)]} />
      <ShapeBatch shape="cylinder" color="slate" items={clubZs.map((z) => cy(7.4, 1.2, z, 0.07, 1.0))} />
      <ShapeBatch shape="box" color="stone" items={clubZs.map((z) => bx(7.4, 1.74, z, 0.28, 0.12, 0.16))} />
      {/* trophy shelf */}
      <ShapeBatch shape="box" color="hardwood" items={[bx(-7.78, 1.2, -9.5, 0.16, 2.4, 3.0), ...shelfYs.map((y) => bx(-7.45, y, -9.5, 0.6, 0.06, 3.0))]} />
      <ShapeBatch shape="cylinder" color="mustard" items={shelfYs.flatMap((y) => cupZs.flatMap((z) => [cy(-7.45, y + 0.2, z, 0.28, 0.2), cy(-7.45, y + 0.07, z, 0.07, 0.1)]))} />
      {/* bench */}
      <ShapeBatch shape="box" color="hardwood" outline items={[bx(-6, 0.45, -3, 2.4, 0.1, 0.7)]} />
      <ShapeBatch shape="box" color="slate" items={[bx(-7, 0.22, -3, 0.1, 0.44, 0.6), bx(-5, 0.22, -3, 0.1, 0.44, 0.6)]} />
      {/* plants */}
      <ShapeBatch shape="cylinder" color="brick" items={[cy(-7.2, 0.25, -1.3, 0.5, 0.5), cy(7.2, 0.25, -1.3, 0.5, 0.5)]} />
      <ShapeBatch shape="sphere" color="fairway" items={[cy(-7.2, 0.9, -1.3, 0.9, 0.9), cy(7.2, 0.9, -1.3, 0.9, 0.9)]} />
    </>
  );
}
