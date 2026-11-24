import { useMemo } from 'react';
import { buildings } from '../../content/buildings';
import type { ThemeColorKey } from '../../content/types';
import { Bulbs } from '../kit/Bulbs';
import { ShapeBatch, type BatchShape } from '../kit/ShapeBatch';
import type { InstanceItem } from '../kit/instancing';
import { exteriorBulbs, exteriorParts, type ExteriorPart } from './exteriors';
import { spotParts } from './spots';

type Group = { key: string; shape: BatchShape; color: ThemeColorKey; glow?: number; items: InstanceItem[] };

/** Every building and spot detail, merged by shape x colour x glow across the whole world. */
function groupParts(parts: readonly ExteriorPart[]): Group[] {
  const map = new Map<string, Group>();
  for (const p of parts) {
    const key = `${p.shape}:${p.color}:${p.glow ?? 0}`;
    const g = map.get(key) ?? { key, shape: p.shape, color: p.color, glow: p.glow, items: [] };
    g.items.push({ x: p.x, y: p.y, z: p.z, sx: p.sx, sy: p.sy, sz: p.sz, rotY: p.rotY });
    map.set(key, g);
  }
  return [...map.values()];
}

export function Exteriors({ still }: { still: boolean }) {
  const groups = useMemo(
    () => groupParts([...buildings.flatMap((b) => exteriorParts(b.id)), ...spotParts('chess-park'), ...spotParts('park'), ...spotParts('running-loop')]),
    [],
  );
  const bulbs = useMemo(() => exteriorBulbs(), []);
  return (
    <group>
      {groups.map((g) => <ShapeBatch key={g.key} shape={g.shape} color={g.color} glow={g.glow} items={g.items} />)}
      <Bulbs items={bulbs} color="warmGlow" still={still} />
    </group>
  );
}
