import { useEffect, useMemo } from 'react';
import { Shape, ShapeGeometry } from 'three';
import type { Rect } from '../types';
import { materials } from '../scene/materials';

/** Flat arrow on the floor pointing south (+z), no text. `y` lifts the arrow when something (e.g. stair treads) sits on the exit floor. */
export function ExitMat({ rect, y = 0.02 }: { rect: Rect; y?: number }) {
  const geo = useMemo(() => {
    const hw = Math.min(rect.w, rect.d) * 0.35;
    const s = new Shape();
    s.moveTo(-hw * 0.4, hw);
    s.lineTo(hw * 0.4, hw);
    s.lineTo(hw * 0.4, 0);
    s.lineTo(hw, 0);
    s.lineTo(0, -hw);
    s.lineTo(-hw, 0);
    s.lineTo(-hw * 0.4, 0);
    s.closePath();
    return new ShapeGeometry(s);
  }, [rect.w, rect.d]);
  useEffect(() => () => geo.dispose(), [geo]);
  // rotating -90deg about x maps shape y to world -z, so the tip (shape -y) points south
  return <mesh geometry={geo} material={materials.accent} position={[rect.x, y, rect.z]} rotation={[-Math.PI / 2, 0, 0]} />;
}
