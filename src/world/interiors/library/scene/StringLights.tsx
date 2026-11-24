import { useMemo } from 'react';
import { ShapeBatch } from '../../../kit/ShapeBatch';
import { stringBulbs } from '../look';

/** Warm string lights along the shelf tops; static (no chase), one draw call. */
export function StringLights() {
  const items = useMemo(stringBulbs, []);
  return <ShapeBatch shape="sphere" items={items} color="warmGlow" glow={1.0} />;
}
