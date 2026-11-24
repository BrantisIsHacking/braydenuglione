import { useFrame } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { RingGeometry, type InstancedMesh, type Mesh, type MeshToonMaterial } from 'three';
import { hotStop } from '../logic/stops';
import { materials } from '../scene/materials';
import { playerPose } from '../scene/Player';
import type { PlacedExhibit } from '../types';
import { instanceMatrices } from './instancing';

/** One instanced ring layer for builder-owned collection stops plus one hot ring on the stop in reach. No labels. */
export function StopRings({ stops, reducedMotion }: { stops: readonly PlacedExhibit[]; reducedMotion: boolean }) {
  const geo = useMemo(() => new RingGeometry(0.75, 0.9, 32).rotateX(-Math.PI / 2), []);
  // Idle collection rings are small and faint so dense walls stay calm; only the ring in reach is full size and bright.
  const idleGeo = useMemo(() => new RingGeometry(0.38, 0.46, 24).rotateX(-Math.PI / 2), []);
  const idleMat = useMemo(() => {
    const m = (materials.accent as MeshToonMaterial).clone();
    m.emissiveIntensity *= 0.4;
    return m;
  }, []);
  const inst = useRef<InstancedMesh>(null);
  const hot = useRef<Mesh>(null);
  useEffect(() => () => geo.dispose(), [geo]);
  useEffect(() => () => idleGeo.dispose(), [idleGeo]);
  useEffect(() => () => idleMat.dispose(), [idleMat]);
  useLayoutEffect(() => {
    const m = inst.current;
    if (!m) return;
    m.instanceMatrix.array.set(instanceMatrices(stops.map((s) => ({ x: s.pos[0], y: 0.03, z: s.pos[1] }))));
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [stops]);
  useFrame(() => {
    const h = hot.current;
    if (!h) return;
    const i = hotStop(stops, playerPose);
    h.visible = i >= 0;
    if (i >= 0) h.position.set(stops[i].pos[0], 0.04, stops[i].pos[1]);
    h.scale.setScalar(reducedMotion ? 1 : 1.1);
  });
  if (stops.length === 0) return null;
  return (
    <>
      <instancedMesh key={stops.length} ref={inst} args={[idleGeo, idleMat, stops.length]} />
      <mesh ref={hot} geometry={geo} material={materials.accentHot} visible={false} />
    </>
  );
}
