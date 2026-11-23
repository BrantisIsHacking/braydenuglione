import { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, Object3D, type InstancedMesh } from 'three';
import { materials } from '../../../scene/materials';
import type { Theme } from '../../../look/theme';
import { standBlocks, type Box } from '../logic/dressing';
import { GYM_LOOK } from '../gymLook';
import { gym } from './gymMaterials';

function fill(mesh: InstancedMesh, boxes: Box[], grow = 0) {
  const o = new Object3D();
  boxes.forEach((b, i) => {
    o.position.set(b.x, b.y, b.z);
    o.scale.set(b.w * (1 + grow), b.h * (1 + grow), b.d * (1 + grow));
    o.updateMatrix();
    mesh.setMatrixAt(i, o.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
}

/** Pull-out bleachers: rows alternate gym red and ink. No stands on the local -x (scene south) end. */
export function Stands({ theme }: { theme: Theme }) {
  const blocks = useMemo(() => standBlocks(), []);
  const a = useRef<InstancedMesh>(null);
  const h = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = a.current;
    if (m) {
      fill(m, blocks);
      const c = new Color();
      blocks.forEach((b, i) => m.setColorAt(i, c.set(b.row % 2 === 0 ? GYM_LOOK.bleacherA : GYM_LOOK.bleacherB)));
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
    if (h.current) fill(h.current, blocks, theme.outline.hullScale);
  }, [blocks, theme.outline.hullScale]);
  return (
    <group>
      <instancedMesh ref={a} args={[undefined, undefined, blocks.length]} material={gym.stand}>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
      <instancedMesh ref={h} args={[undefined, undefined, blocks.length]} material={materials.hull}>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
    </group>
  );
}
