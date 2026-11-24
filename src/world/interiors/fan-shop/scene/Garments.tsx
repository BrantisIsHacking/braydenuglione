import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { BoxGeometry, Color, MeshToonMaterial, type InstancedMesh } from 'three';
import { instanceMatrices } from '../../../kit/instancing';
import { gradientMap } from '../../../scene/materials';
import { buildGarments } from '../look';

/** Every team-coloured garment in one instanced mesh with per-instance colour (a single draw call). Colour only, no marks. */
export function Garments() {
  const mesh = useRef<InstancedMesh>(null);
  const garments = useMemo(() => buildGarments(), []);
  const geo = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const mat = useMemo(() => new MeshToonMaterial({ color: 0xffffff, gradientMap }), []);
  useEffect(() => () => { geo.dispose(); mat.dispose(); }, [geo, mat]);
  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    m.instanceMatrix.array.set(instanceMatrices(garments.map((g) => g.item)));
    m.instanceMatrix.needsUpdate = true;
    const c = new Color();
    garments.forEach((g, i) => m.setColorAt(i, c.set(g.color)));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [garments]);
  return <instancedMesh ref={mesh} args={[geo, mat, garments.length]} />;
}
