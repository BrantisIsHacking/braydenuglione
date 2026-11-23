import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { BoxGeometry, MeshToonMaterial, type InstancedMesh } from 'three';
import type { Trigger } from '../types';
import { gradientMap } from '../scene/materials';
import { Outline } from '../scene/Outline';
import { theme } from '../look/theme';
import { instanceMatrices } from './instancing';

const H = 2.4;

export function DoorFrames({ doors }: { doors: readonly Trigger[] }) {
  const ref = useRef<InstancedMesh>(null);
  const geo = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const mat = useMemo(() => new MeshToonMaterial({ color: theme.accents.mustard, gradientMap }), []);
  useEffect(() => () => { geo.dispose(); mat.dispose(); }, [geo, mat]);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    m.instanceMatrix.array.set(instanceMatrices(doors.map((d) => ({ x: d.rect.x, y: H / 2, z: d.rect.z, sx: Math.min(d.rect.w, 2), sy: H, sz: 0.2 }))));
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [doors]);
  return (
    <instancedMesh key={doors.length} ref={ref} args={[geo, mat, doors.length]}>
      <Outline />
    </instancedMesh>
  );
}
