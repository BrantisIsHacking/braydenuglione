import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { ConeGeometry, CylinderGeometry, MeshToonMaterial, SphereGeometry, type BufferGeometry, type InstancedMesh } from 'three';
import { instanceMatrices, type InstanceItem } from '../kit/instancing';
import { gradientMap } from '../scene/materials';
import { FOUNTAIN } from '../logic/layout';
import { theme } from '../look/theme';
import { lampPositions, treePositions } from './geometry';

const toon = (c: string) => new MeshToonMaterial({ color: c, gradientMap });

function Inst({ geo, mat, items }: { geo: BufferGeometry; mat: MeshToonMaterial; items: InstanceItem[] }) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    m.instanceMatrix.array.set(instanceMatrices(items));
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [items]);
  return <instancedMesh ref={ref} args={[geo, mat, items.length]} frustumCulled={false} />;
}

export function Props() {
  const r = useMemo(() => {
    const trees = treePositions(), lamps = lampPositions();
    return {
      trunk: { geo: new CylinderGeometry(0.18, 0.24, 1.4, 6), mat: toon(theme.accents.brick), items: trees.map(([x, z]) => ({ x, y: 0.7, z })) },
      crown: { geo: new ConeGeometry(1.1, 2.6, 7), mat: toon(theme.accents.fairway), items: trees.map(([x, z], i) => ({ x, y: 2.5, z, sx: 0.9 + (i % 3) * 0.12, sz: 0.9 + (i % 3) * 0.12 })) },
      pole: { geo: new CylinderGeometry(0.06, 0.08, 3, 6), mat: toon(theme.accents.slate), items: lamps.map(([x, z]) => ({ x, y: 1.5, z })) },
      head: { geo: new SphereGeometry(0.25, 8, 6), mat: toon(theme.accents.warmGlow), items: lamps.map(([x, z]) => ({ x, y: 3.1, z })) },
      basin: { geo: new CylinderGeometry(1.4, 1.5, 0.5, 20), mat: toon(theme.accents.stone) },
      water: { geo: new CylinderGeometry(1.15, 1.15, 0.05, 20), mat: toon(theme.accents.water) },
    };
  }, []);
  useEffect(() => () => Object.values(r).forEach((p) => { p.geo.dispose(); p.mat.dispose(); }), [r]);
  return (
    <group>
      <Inst {...r.trunk} />
      <Inst {...r.crown} />
      <Inst {...r.pole} />
      <Inst {...r.head} />
      <mesh geometry={r.basin.geo} material={r.basin.mat} position={[FOUNTAIN.x, 0.25, FOUNTAIN.z]} />
      <mesh geometry={r.water.geo} material={r.water.mat} position={[FOUNTAIN.x, 0.5, FOUNTAIN.z]} />
    </group>
  );
}
