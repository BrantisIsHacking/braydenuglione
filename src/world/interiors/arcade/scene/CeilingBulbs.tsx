import { useMemo } from 'react';
import { Bulbs } from '../../../kit/Bulbs';
import type { InstanceItem } from '../../../kit/instancing';
import { LENGTH, WALL_HEIGHT, WIDTH } from '../look';

/** Marquee bulbs along the north and side walls, near the top. `still` = reduced motion or low fx. */
export function CeilingBulbs({ still }: { still: boolean }) {
  const items = useMemo(() => {
    const out: InstanceItem[] = [];
    const y = WALL_HEIGHT - 0.2;
    const s = 0.16;
    for (let x = -WIDTH / 2 + 1; x <= WIDTH / 2 - 1; x += 1) out.push({ x, y, z: -LENGTH + 0.18, sx: s, sy: s, sz: s });
    for (const side of [-1, 1]) for (let z = -1.5; z > -LENGTH + 0.9; z -= 1) out.push({ x: side * (WIDTH / 2 - 0.18), y, z, sx: s, sy: s, sz: s });
    return out;
  }, []);
  return <Bulbs items={items} color="warmGlow" still={still} />;
}
