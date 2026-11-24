import { useMemo } from 'react';
import type { InstanceItem } from '../../../kit/instancing';
import { ShapeBatch } from '../../../kit/ShapeBatch';
import { COUNTER, COUNTER_POS } from '../look';

/** Prize counter at the `games` ring: brick body, teal glass top, mustard token stacks. */
export function TokenCounter() {
  const [x, z] = COUNTER_POS;
  const tokens = useMemo<InstanceItem[]>(() => {
    const out: InstanceItem[] = [];
    for (let k = 0; k < 6; k++) {
      const h = 0.12 + (k % 3) * 0.08;
      out.push({ x: x - 0.9 + k * 0.36, y: COUNTER.h + 0.1 + h / 2, z: z + (k % 2 ? 0.12 : -0.12), sx: 0.22, sy: h, sz: 0.22 });
    }
    return out;
  }, [x, z]);
  return (
    <>
      <ShapeBatch shape="box" color="brick" items={[{ x, y: COUNTER.h / 2, z, sx: COUNTER.w, sy: COUNTER.h, sz: COUNTER.d }]} outline />
      <ShapeBatch shape="box" color="teal" items={[{ x, y: COUNTER.h + 0.05, z, sx: COUNTER.w - 0.1, sy: 0.1, sz: COUNTER.d - 0.1 }]} glow={0.5} />
      <ShapeBatch shape="cylinder" color="mustard" items={tokens} />
    </>
  );
}
