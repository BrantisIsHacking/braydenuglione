import { useEffect, useMemo } from 'react';
import { BoxGeometry, CylinderGeometry, MeshToonMaterial, TorusGeometry } from 'three';
import { Outline } from '../scene/Outline';
import { gradientMap } from '../scene/materials';
import { LOTS } from '../logic/layout';
import { theme } from '../look/theme';

const toon = (c: string) => new MeshToonMaterial({ color: c, gradientMap });
const at = (id: 'mailbox' | 'chess-park' | 'park' | 'running-loop') => LOTS[id].spot!;

export function Spots() {
  const r = useMemo(() => {
    const ring = new TorusGeometry(0.45, 0.05, 6, 20);
    ring.rotateX(Math.PI / 2);
    return {
      mailbox: { geo: new BoxGeometry(0.6, 1.2, 0.5), mat: toon(theme.accents.scarlet) },
      table: { geo: new BoxGeometry(1, 0.7, 1), mat: toon(theme.accents.slate) },
      ring: { geo: ring, mat: toon(theme.accents.offWhite) },
      post: { geo: new CylinderGeometry(0.1, 0.12, 3, 8), mat: toon(theme.accents.scarlet) },
    };
  }, []);
  useEffect(() => () => Object.values(r).forEach((p) => { p.geo.dispose(); p.mat.dispose(); }), [r]);
  const m = at('mailbox'), c = at('chess-park'), p = at('park'), l = at('running-loop');
  return (
    <group>
      <mesh geometry={r.mailbox.geo} material={r.mailbox.mat} position={[m.x, 0.6, m.z]}><Outline /></mesh>
      <mesh geometry={r.table.geo} material={r.table.mat} position={[c.x, 0.35, c.z]}><Outline /></mesh>
      <mesh geometry={r.ring.geo} material={r.ring.mat} position={[p.x, 0.3, p.z]}><Outline /></mesh>
      <mesh geometry={r.post.geo} material={r.post.mat} position={[l.x, 1.5, l.z]}><Outline /></mesh>
    </group>
  );
}
