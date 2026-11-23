import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { BoxGeometry, BufferGeometry, Float32BufferAttribute, type InstancedMesh } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { instanceMatrices } from '../../../kit/instancing';
import { END_WALL_X, SIDE_WALL_Z, SOUTH_WALL_X } from '../logic/dressing';
import { GYM_LOOK as L } from '../gymLook';
import { gym } from './gymMaterials';

const T = 0.4;
const LEN = END_WALL_X - SOUTH_WALL_X;
const CX = (END_WALL_X + SOUTH_WALL_X) / 2;
const SOUTH_WALL_H = 0.5;

function walls(): BufferGeometry {
  const box = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const g = new BoxGeometry(w, h, d);
    g.translate(x, y, z);
    return g;
  };
  const parts = [
    ...[1, -1].map((s) => box(LEN, L.wallHeight, T, CX, L.wallHeight / 2, s * (SIDE_WALL_Z + T / 2))),
    box(T, L.wallHeight, SIDE_WALL_Z * 2 + 2 * T, END_WALL_X + T / 2, L.wallHeight / 2, 0),
    box(T, SOUTH_WALL_H, SIDE_WALL_Z * 2 + 2 * T, SOUTH_WALL_X - T / 2, SOUTH_WALL_H / 2, 0),
  ];
  const g = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return g;
}

/** Cinder-block mortar grid (0.4 x 0.2 m blocks) for one side wall, in the wall plane at z = 0. */
function blockGrid(): BufferGeometry {
  const pts: number[] = [];
  const x0 = SOUTH_WALL_X, x1 = END_WALL_X;
  for (let y = 0; y <= L.wallHeight + 1e-6; y += L.block.h) pts.push(x0, y, 0, x1, y, 0);
  for (let x = x0; x <= x1 + 1e-6; x += L.block.w) pts.push(x, 0, 0, x, L.wallHeight, 0);
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pts, 3));
  return g;
}

export function Shell() {
  const wallGeo = useMemo(walls, []);
  const grid = useMemo(blockGrid, []);
  const truss = useRef<InstancedMesh>(null);
  useEffect(() => () => { wallGeo.dispose(); grid.dispose(); }, [wallGeo, grid]);
  useLayoutEffect(() => {
    const m = truss.current;
    if (!m) return;
    const n = L.trusses.count;
    const x0 = 0, x1 = END_WALL_X - 3;
    const items = Array.from({ length: n }, (_, i) => ({
      x: x0 + (i * (x1 - x0)) / (n - 1), y: L.trusses.y, z: 0, sx: L.trusses.w, sy: L.trusses.h, sz: SIDE_WALL_Z * 2,
    }));
    (m.instanceMatrix.array as Float32Array).set(instanceMatrices(items));
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, []);
  const inset = SIDE_WALL_Z - 0.01;
  return (
    <group>
      <mesh geometry={wallGeo} material={gym.wall} />
      <lineSegments geometry={grid} material={gym.mortar} position={[0, 0, inset]} />
      <lineSegments geometry={grid} material={gym.mortar} position={[0, 0, -inset]} />
      <instancedMesh ref={truss} args={[undefined, undefined, L.trusses.count]} material={gym.truss}>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
    </group>
  );
}
