import { SPAWN, SPAWN_OFFSET_M, type Pose } from './court';
import type { Placed } from './proximity';

export function spawnFor(station: Placed | null): Pose {
  if (!station) return { ...SPAWN };
  const [sx, sz] = station.pos;
  const d = Math.hypot(sx, sz);
  if (d < 0.01) return { x: sx - SPAWN_OFFSET_M, z: sz, heading: 0 };
  const x = sx - (sx / d) * SPAWN_OFFSET_M;
  const z = sz - (sz / d) * SPAWN_OFFSET_M;
  return { x, z, heading: Math.atan2(sz - z, sx - x) };
}
