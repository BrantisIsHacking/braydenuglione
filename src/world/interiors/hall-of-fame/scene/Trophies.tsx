import { useMemo } from 'react';
import { Pedestals } from '../../../kit/Pedestals';
import { ShapeBatch } from '../../../kit/ShapeBatch';
import { propAnchor } from '../../../logic/interior';
import { FAME_LOOK } from '../look';

const TOP = 0.9;

/** One stone pedestal per award, each topped with a gold cup (3 instanced batches for all). */
export function Trophies({ positions }: { positions: readonly [number, number][] }) {
  const anchors = useMemo(() => positions.map(propAnchor), [positions]);
  const base = useMemo(() => anchors.map(([x, z]) => ({ x, z, y: TOP + 0.1, sx: 0.5, sy: 0.2, sz: 0.5 })), [anchors]);
  const cup = useMemo(() => anchors.map(([x, z]) => ({ x, z, y: TOP + 0.4, sx: 0.4, sy: 0.4, sz: 0.4 })), [anchors]);
  const knob = useMemo(() => anchors.map(([x, z]) => ({ x, z, y: TOP + 0.72, sx: 0.2, sy: 0.2, sz: 0.2 })), [anchors]);
  return (
    <>
      <Pedestals positions={anchors} color="stone" />
      <ShapeBatch shape="cone" items={base} color={FAME_LOOK.trophy} />
      <ShapeBatch shape="cylinder" items={cup} color={FAME_LOOK.trophy} />
      <ShapeBatch shape="sphere" items={knob} color={FAME_LOOK.trophy} />
    </>
  );
}
