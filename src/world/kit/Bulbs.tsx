import { useFrame } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Color, MeshBasicMaterial, SphereGeometry, type InstancedMesh } from 'three';
import type { ThemeColorKey } from '../../content/types';
import { bulbLevel } from '../logic/bulbs';
import { theme } from '../look/theme';
import { instanceMatrices, type InstanceItem } from './instancing';

const GLOW = 1.4;

/** Instanced marquee bulbs in one draw call. Brightness chases per `bulbLevel`; `still` does no per-frame work. */
export function Bulbs({ items, color, still }: { items: readonly InstanceItem[]; color: ThemeColorKey; still: boolean }) {
  const mesh = useRef<InstancedMesh>(null);
  const geo = useMemo(() => new SphereGeometry(0.5, 10, 8), []);
  const mat = useMemo(() => new MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), []);
  const base = useMemo(() => new Color(theme.accents[color]), [color]);
  const tmp = useMemo(() => new Color(), []);
  useEffect(() => () => { geo.dispose(); mat.dispose(); }, [geo, mat]);
  const paint = (t: number) => {
    const m = mesh.current;
    if (!m) return;
    for (let i = 0; i < items.length; i++) m.setColorAt(i, tmp.copy(base).multiplyScalar(GLOW * bulbLevel(i, t, still)));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  };
  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    m.instanceMatrix.array.set(instanceMatrices(items));
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
    paint(0);
  });
  useFrame((s) => {
    if (!still) paint(s.clock.elapsedTime);
  });
  if (items.length === 0) return null;
  return <instancedMesh key={items.length} ref={mesh} args={[geo, mat, items.length]} />;
}
