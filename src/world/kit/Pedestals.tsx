import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { BoxGeometry, MeshToonMaterial, type InstancedMesh } from 'three';
import type { ThemeColorKey } from '../../content/types';
import { materials, gradientMap } from '../scene/materials';
import { theme } from '../look/theme';
import { instanceMatrices } from './instancing';

const H = 0.9;

export function Pedestals({ positions, color = 'stone' }: { positions: readonly [number, number][]; color?: ThemeColorKey }) {
  const body = useRef<InstancedMesh>(null);
  const hull = useRef<InstancedMesh>(null);
  const geo = useMemo(() => new BoxGeometry(1, H, 1), []);
  const mat = useMemo(() => new MeshToonMaterial({ color: theme.accents[color], gradientMap }), [color]);
  useEffect(() => () => { geo.dispose(); mat.dispose(); }, [geo, mat]);
  useLayoutEffect(() => {
    const set = (m: InstancedMesh | null, s: number) => {
      if (!m) return;
      m.instanceMatrix.array.set(instanceMatrices(positions.map(([x, z]) => ({ x, y: (H * s) / 2, z, sx: s, sy: s, sz: s }))));
      m.instanceMatrix.needsUpdate = true;
      m.computeBoundingSphere();
    };
    set(body.current, 1);
    set(hull.current, 1 + theme.outline.hullScale);
  }, [positions]);
  return (
    <>
      <instancedMesh key={`b${positions.length}`} ref={body} args={[geo, mat, positions.length]} />
      <instancedMesh key={`h${positions.length}`} ref={hull} args={[geo, materials.hull, positions.length]} />
    </>
  );
}
