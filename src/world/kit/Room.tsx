import { useEffect, useMemo } from 'react';
import { BoxGeometry, MeshToonMaterial } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { ThemeColorKey } from '../../content/types';
import { gradientMap } from '../scene/materials';
import { theme } from '../look/theme';

const T = 0.3;

/** Origin = south-centre; spans x +-width/2, z in [-length, 0]. Floor 1 mesh, walls merged 1 mesh. */
export function Room({ width, length, wallHeight = 3.2, southWall = 0.6, floor, wall }: {
  width: number; length: number; wallHeight?: number; southWall?: number; floor: ThemeColorKey; wall: ThemeColorKey;
}) {
  const walls = useMemo(() => {
    const box = (w: number, h: number, d: number, x: number, y: number, z: number) => {
      const g = new BoxGeometry(w, h, d);
      g.translate(x, y, z);
      return g;
    };
    const parts = [
      box(width + 2 * T, wallHeight, T, 0, wallHeight / 2, -length - T / 2),
      box(T, wallHeight, length, -width / 2 - T / 2, wallHeight / 2, -length / 2),
      box(T, wallHeight, length, width / 2 + T / 2, wallHeight / 2, -length / 2),
      box(width + 2 * T, southWall, T, 0, southWall / 2, T / 2),
    ];
    const merged = mergeGeometries(parts)!;
    parts.forEach((g) => g.dispose());
    return merged;
  }, [width, length, wallHeight, southWall]);
  const floorMat = useMemo(() => new MeshToonMaterial({ color: theme.accents[floor], gradientMap }), [floor]);
  const wallMat = useMemo(() => new MeshToonMaterial({ color: theme.accents[wall], gradientMap }), [wall]);
  useEffect(() => () => { walls.dispose(); floorMat.dispose(); wallMat.dispose(); }, [walls, floorMat, wallMat]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -length / 2]} material={floorMat}>
        <planeGeometry args={[width, length]} />
      </mesh>
      <mesh geometry={walls} material={wallMat} />
    </group>
  );
}
