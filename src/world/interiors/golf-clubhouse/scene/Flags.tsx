import { useMemo } from 'react';
import { Caption } from '../../../kit/Caption';
import { ShapeBatch } from '../../../kit/ShapeBatch';
import { HOLES } from '../geometry';
import { bx, cy } from '../look';

const POLE_H = 1.5;

/** One slate pole and scarlet flag per hole, and its number floating above. */
export function Flags() {
  const { poles, flags } = useMemo(
    () => ({
      poles: HOLES.map((h) => cy(h.cup[0], POLE_H / 2, h.cup[1] - 0.95, 0.06, POLE_H)),
      flags: HOLES.map((h) => bx(h.cup[0] + 0.25, POLE_H - 0.18, h.cup[1] - 0.95, 0.5, 0.3, 0.04)),
    }),
    [],
  );
  return (
    <>
      <ShapeBatch shape="cylinder" color="slate" items={poles} />
      <ShapeBatch shape="box" color="scarlet" items={flags} />
      {HOLES.map((h) => (
        <Caption key={h.n} text={String(h.n)} position={[h.cup[0], POLE_H + 0.55, h.cup[1] - 0.95]} size={0.6} color="offWhite" outline />
      ))}
    </>
  );
}
