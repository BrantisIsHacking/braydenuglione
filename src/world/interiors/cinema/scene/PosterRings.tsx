import { useFrame } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { RingGeometry, type InstancedMesh, type Mesh } from 'three';
import { materials } from '../../../scene/materials';
import { playerPose } from '../../../scene/Player';
import { instanceMatrices } from '../../../kit/instancing';
import { posterSlots } from '../look';

/** One instanced ring layer for the twelve poster stops, plus one hot ring on the stop nearest the player. */
export function PosterRings({ reducedMotion }: { reducedMotion: boolean }) {
  const slots = useMemo(() => posterSlots(), []);
  const geo = useMemo(() => new RingGeometry(0.75, 0.9, 32).rotateX(-Math.PI / 2), []);
  const inst = useRef<InstancedMesh>(null);
  const hot = useRef<Mesh>(null);
  useEffect(() => () => geo.dispose(), [geo]);
  useLayoutEffect(() => {
    const m = inst.current;
    if (!m) return;
    m.instanceMatrix.array.set(instanceMatrices(slots.map((p) => ({ x: p.stop[0], y: 0.03, z: p.stop[1] }))));
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [slots]);
  useFrame(() => {
    const h = hot.current;
    if (!h) return;
    let best = -1;
    let bd = 2.4;
    slots.forEach((p, i) => {
      const d = Math.hypot(p.stop[0] - playerPose.x, p.stop[1] - playerPose.z);
      if (d < bd) { bd = d; best = i; }
    });
    h.visible = best >= 0;
    if (best >= 0) h.position.set(slots[best].stop[0], 0.04, slots[best].stop[1]);
    h.scale.setScalar(reducedMotion ? 1 : 1.1);
  });
  return (
    <>
      <instancedMesh ref={inst} args={[geo, materials.accent, slots.length]} />
      <mesh ref={hot} geometry={geo} material={materials.accentHot} visible={false} />
    </>
  );
}
