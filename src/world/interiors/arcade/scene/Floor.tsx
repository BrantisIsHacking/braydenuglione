import { useMemo } from 'react';
import type { InstanceItem } from '../../../kit/instancing';
import { ShapeBatch } from '../../../kit/ShapeBatch';
import { ARCADE_LOOK, LENGTH, TILE, WALL_HEIGHT, WIDTH } from '../look';

/** Teal half of the checkered floor (the Room floor is the off-white half), the off-white upper wall and the neon dado. */
export function Floor() {
  const tiles = useMemo(() => {
    const out: InstanceItem[] = [];
    const cols = WIDTH / TILE;
    const rows = LENGTH / TILE;
    for (let i = 0; i < cols; i++)
      for (let j = 0; j < rows; j++)
        if ((i + j) % 2 === 0) out.push({ x: -WIDTH / 2 + TILE / 2 + i * TILE, y: 0.01, z: -TILE / 2 - j * TILE, sx: TILE, sy: 0.02, sz: TILE });
    return out;
  }, []);
  const upper = useMemo<InstanceItem[]>(() => {
    const h = WALL_HEIGHT - 2.2;
    const y = 2.2 + h / 2;
    return [
      { x: 0, y, z: -LENGTH + 0.04, sx: WIDTH, sy: h, sz: 0.08 },
      { x: -WIDTH / 2 + 0.04, y, z: -LENGTH / 2, sx: 0.08, sy: h, sz: LENGTH },
      { x: WIDTH / 2 - 0.04, y, z: -LENGTH / 2, sx: 0.08, sy: h, sz: LENGTH },
    ];
  }, []);
  const dado = useMemo<InstanceItem[]>(
    () => [
      { x: 0, y: 2.2, z: -LENGTH + 0.07, sx: WIDTH, sy: 0.12, sz: 0.14 },
      { x: -WIDTH / 2 + 0.07, y: 2.2, z: -LENGTH / 2, sx: 0.14, sy: 0.12, sz: LENGTH },
      { x: WIDTH / 2 - 0.07, y: 2.2, z: -LENGTH / 2, sx: 0.14, sy: 0.12, sz: LENGTH },
      // neon edge under the ARCADE sign board
      { x: 0, y: 2.95, z: -LENGTH + 0.08, sx: 4.4, sy: 0.1, sz: 0.1 },
    ],
    [],
  );
  return (
    <>
      <ShapeBatch shape="box" color={ARCADE_LOOK.checker} items={tiles} />
      <ShapeBatch shape="box" color={ARCADE_LOOK.upper} items={upper} />
      <ShapeBatch shape="box" color="teal" items={dado} glow={1.2} />
    </>
  );
}
