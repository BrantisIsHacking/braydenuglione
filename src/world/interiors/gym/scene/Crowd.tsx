import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CapsuleGeometry, Color, InstancedBufferAttribute, Object3D, type InstancedMesh, type MeshToonMaterial } from 'three';
import { crowdLayout } from '../logic/dressing';
import { materials } from '../../../scene/materials';
import type { Theme } from '../../../look/theme';

export function Crowd({ theme }: { theme: Theme }) {
  const seats = useMemo(() => crowdLayout(undefined, undefined, theme.crowd.weights), [theme.crowd.weights]);
  const ref = useRef<InstancedMesh>(null);
  const geo = useMemo(() => new CapsuleGeometry(0.22, 0.4, 2, 6), []);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uSway: { value: 0 }, uHz: { value: 0 } }), []);
  useEffect(() => {
    uniforms.uSway.value = theme.crowd.sway;
    uniforms.uHz.value = theme.crowd.swayHz;
  }, [uniforms, theme.crowd.sway, theme.crowd.swayHz]);
  const mat = useMemo(() => {
    const m = (materials.crowd as MeshToonMaterial).clone();
    m.onBeforeCompile = (s) => {
      Object.assign(s.uniforms, uniforms);
      s.vertexShader = s.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aPhase;\nuniform float uTime;\nuniform float uSway;\nuniform float uHz;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.x += uSway * sin(6.2832 * uHz * uTime + aPhase);');
    };
    return m;
  }, [uniforms]);
  useEffect(() => () => mat.dispose(), [mat]);
  useEffect(() => () => geo.dispose(), [geo]);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new Object3D();
    const c = new Color();
    const phase = new Float32Array(seats.length);
    seats.forEach((s, i) => {
      o.position.set(s.x, s.y + 0.42, s.z);
      o.rotation.set(0, s.rotY, 0);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
      mesh.setColorAt(i, c.set(theme.crowd.colors[s.tint] ?? '#444444'));
      phase[i] = s.phase;
    });
    geo.setAttribute('aPhase', new InstancedBufferAttribute(phase, 1));
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [seats, theme.crowd.colors, geo]);
  useFrame(({ clock }) => {
    if (theme.crowd.sway > 0) uniforms.uTime.value = clock.elapsedTime;
  });
  return <instancedMesh ref={ref} args={[geo, mat, seats.length]} />;
}
