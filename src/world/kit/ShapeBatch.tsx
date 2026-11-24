import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import {
  BoxGeometry, Color, ConeGeometry, CylinderGeometry, MeshToonMaterial, SphereGeometry, type BufferGeometry, type InstancedMesh,
} from 'three';
import type { ThemeColorKey } from '../../content/types';
import { theme } from '../look/theme';
import { gradientMap, materials } from '../scene/materials';
import { instanceMatrices, type InstanceItem } from './instancing';

export type BatchShape = 'box' | 'cylinder' | 'sphere' | 'cone';

/** Unit geometry: 1 m box, 1 m diameter x 1 m tall cylinder / cone, 1 m diameter sphere; items scale it. */
function unitGeometry(shape: BatchShape): BufferGeometry {
  switch (shape) {
    case 'box': return new BoxGeometry(1, 1, 1);
    case 'cylinder': return new CylinderGeometry(0.5, 0.5, 1, 20);
    case 'cone': return new ConeGeometry(0.5, 1, 20);
    case 'sphere': return new SphereGeometry(0.5, 20, 14);
  }
}

/** One instanced mesh per colour per shape (plus one outline hull when `outline`). Item `y` is the centre height. */
export function ShapeBatch({ shape, items, color, outline = false, glow }: {
  shape: BatchShape; items: readonly InstanceItem[]; color: ThemeColorKey; outline?: boolean; glow?: number;
}): JSX.Element | null {
  const body = useRef<InstancedMesh>(null);
  const hull = useRef<InstancedMesh>(null);
  const geo = useMemo(() => unitGeometry(shape), [shape]);
  const mat = useMemo(
    () =>
      new MeshToonMaterial({
        color: theme.accents[color],
        gradientMap,
        ...(glow ? { emissive: new Color(theme.accents[color]), emissiveIntensity: glow, toneMapped: false } : {}),
      }),
    [color, glow],
  );
  useEffect(() => () => { geo.dispose(); }, [geo]);
  useEffect(() => () => { mat.dispose(); }, [mat]);
  const count = items.length;
  useLayoutEffect(() => {
    const set = (m: InstancedMesh | null, grow: number) => {
      if (!m) return;
      m.instanceMatrix.array.set(
        instanceMatrices(items.map((it) => ({ ...it, sx: (it.sx ?? 1) * grow, sy: (it.sy ?? 1) * grow, sz: (it.sz ?? 1) * grow }))),
      );
      m.instanceMatrix.needsUpdate = true;
      m.computeBoundingSphere();
    };
    set(body.current, 1);
    set(hull.current, 1 + theme.outline.hullScale);
  }, [items, outline]);
  if (count === 0) return null;
  return (
    <>
      <instancedMesh key={`b${count}`} ref={body} args={[geo, mat, count]} />
      {outline && <instancedMesh key={`h${count}`} ref={hull} args={[geo, materials.hull, count]} />}
    </>
  );
}
