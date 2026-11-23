import { useEffect, useMemo } from 'react';
import { MeshToonMaterial, Path, Shape, ShapeGeometry } from 'three';
import { gradientMap } from '../scene/materials';
import { MAP } from '../logic/layout';
import { theme } from '../look/theme';
import { LOOP_INSET, LOOP_WIDTH, PLAZA, ROAD } from './geometry';

export function Ground() {
  const mats = useMemo(() => ({
    grass: new MeshToonMaterial({ color: theme.accents.grass, gradientMap }),
    stone: new MeshToonMaterial({ color: theme.accents.stone, gradientMap }),
    path: new MeshToonMaterial({ color: theme.accents.path, gradientMap }),
  }), []);
  const ring = useMemo(() => {
    const o = LOOP_INSET - LOOP_WIDTH / 2, i = LOOP_INSET + LOOP_WIDTH / 2;
    const s = new Shape();
    s.moveTo(MAP.minX + o, MAP.minZ + o);
    s.lineTo(MAP.maxX - o, MAP.minZ + o);
    s.lineTo(MAP.maxX - o, MAP.maxZ - o);
    s.lineTo(MAP.minX + o, MAP.maxZ - o);
    s.closePath();
    const h = new Path();
    h.moveTo(MAP.minX + i, MAP.minZ + i);
    h.lineTo(MAP.minX + i, MAP.maxZ - i);
    h.lineTo(MAP.maxX - i, MAP.maxZ - i);
    h.lineTo(MAP.maxX - i, MAP.minZ + i);
    h.closePath();
    s.holes.push(h);
    return new ShapeGeometry(s);
  }, []);
  useEffect(() => () => { Object.values(mats).forEach((m) => m.dispose()); ring.dispose(); }, [mats, ring]);
  const flat = -Math.PI / 2;
  return (
    <group>
      <mesh rotation={[flat, 0, 0]} material={mats.grass}><planeGeometry args={[MAP.maxX - MAP.minX + 8, MAP.maxZ - MAP.minZ + 8]} /></mesh>
      <mesh rotation={[flat, 0, 0]} position={[PLAZA.x, 0.01, PLAZA.z]} material={mats.stone}><planeGeometry args={[PLAZA.w, PLAZA.d]} /></mesh>
      <mesh rotation={[flat, 0, 0]} position={[ROAD.x, 0.012, ROAD.z]} material={mats.path}><planeGeometry args={[ROAD.w, ROAD.d]} /></mesh>
      <mesh rotation={[flat, 0, 0]} position={[0, 0.014, 0]} material={mats.path} geometry={ring} />
    </group>
  );
}
