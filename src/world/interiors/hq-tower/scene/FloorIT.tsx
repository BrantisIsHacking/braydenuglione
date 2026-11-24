import { ShapeBatch } from '../../../kit/ShapeBatch';
import { bx } from '../look';

/** Floor 1: shah-sokoloff. Server racks (outlined), cable tray, help desk. */
export function FloorIT() {
  const z = -8.6;
  const leds = [2.2, 3.8].flatMap((x) => [0.6, 0.9, 1.2, 1.5, 1.8].map((y) => bx(x, y, z + 0.37, 0.6, 0.05, 0.02)));
  return (
    <>
      <ShapeBatch shape="box" color="slate" outline items={[bx(2.2, 1.0, z, 0.9, 2.0, 0.7), bx(3.8, 1.0, z, 0.9, 2.0, 0.7)]} />
      <ShapeBatch shape="box" color="warmGlow" glow={1.2} items={leds} />
      <ShapeBatch shape="box" color="rack" items={[bx(3, 3.0, z, 4.2, 0.1, 0.4), bx(2.2, 2.5, z, 0.08, 1.0, 0.08), bx(3.8, 2.5, z, 0.08, 1.0, 0.08)]} />
      <ShapeBatch shape="box" color="hardwood" items={[bx(7.2, 0.45, -4, 0.8, 0.9, 2.4)]} />
      <ShapeBatch shape="box" color="slate" items={[bx(7.2, 0.93, -4.3, 0.4, 0.04, 0.5)]} />
      <ShapeBatch shape="box" color="warmGlow" glow={0.8} items={[bx(7.0, 1.15, -4.3, 0.04, 0.4, 0.5)]} />
    </>
  );
}
