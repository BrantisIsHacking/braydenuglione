import { ShapeBatch } from '../../../kit/ShapeBatch';
import { bx } from '../look';

const X = -4;
const Z = -7.6;
const MZ = -7.95;

/** One long scarlet-fronted desk with an offWhite top, brochure stacks and a flat-colour campus map board. */
export function TourDesk() {
  const stacks = [bx(-5.2, 1.06, Z + 0.1, 0.34, 0.04, 0.44), bx(-4.7, 1.06, Z + 0.1, 0.34, 0.04, 0.44), bx(-4.7, 1.1, Z + 0.1, 0.32, 0.04, 0.42), bx(-3.4, 1.06, Z + 0.1, 0.34, 0.04, 0.44)];
  return (
    <>
      <ShapeBatch shape="box" color="scarlet" outline items={[bx(X, 0.48, Z, 5, 0.96, 0.8)]} />
      <ShapeBatch shape="box" color="offWhite" items={[bx(X, 1.0, Z, 5.2, 0.08, 1.1), ...stacks]} />
      <ShapeBatch shape="box" color="slate" items={[bx(-2.8, 1.7, MZ, 1.2, 0.8, 0.06)]} />
      <ShapeBatch shape="box" color="ink" items={[bx(-3.3, 1.3, MZ, 0.05, 0.5, 0.05), bx(-2.3, 1.3, MZ, 0.05, 0.5, 0.05)]} />
      <ShapeBatch shape="box" color="grass" items={[bx(-3.1, 1.8, MZ + 0.04, 0.5, 0.4, 0.02)]} />
      <ShapeBatch shape="box" color="water" items={[bx(-2.5, 1.9, MZ + 0.04, 0.4, 0.5, 0.02)]} />
      <ShapeBatch shape="box" color="path" items={[bx(-2.8, 1.52, MZ + 0.04, 1.0, 0.1, 0.02)]} />
      <ShapeBatch shape="box" color="scarlet" items={[bx(-3.1, 1.95, MZ + 0.05, 0.08, 0.08, 0.02), bx(-2.4, 1.65, MZ + 0.05, 0.08, 0.08, 0.02)]} />
    </>
  );
}
