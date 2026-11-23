import type { Bounds, Rect } from '../types';

export const PLAYER_R = 0.4;
const PASSES = 3;

export function collide(p: { x: number; z: number }, r: number, boxes: readonly Rect[], b: Bounds): { x: number; z: number } {
  if (Number.isNaN(p.x) || Number.isNaN(p.z)) return p;
  let x = Math.min(b.maxX - r, Math.max(b.minX + r, p.x));
  let z = Math.min(b.maxZ - r, Math.max(b.minZ + r, p.z));
  for (let pass = 0; pass < PASSES; pass++) {
    for (const box of boxes) {
      const hx = box.w / 2, hz = box.d / 2;
      const dx = x - box.x, dz = z - box.z;
      const cx = Math.min(hx, Math.max(-hx, dx)), cz = Math.min(hz, Math.max(-hz, dz));
      const ox = dx - cx, oz = dz - cz;
      const dist = Math.hypot(ox, oz);
      if (dist > 0) {
        if (dist < r) { x = box.x + cx + (ox / dist) * r; z = box.z + cz + (oz / dist) * r; }
      } else {
        // centre inside the box: exit through the face of least penetration
        const px = hx - Math.abs(dx), pz = hz - Math.abs(dz);
        if (px <= pz) x = box.x + (dx >= 0 ? hx + r : -hx - r);
        else z = box.z + (dz >= 0 ? hz + r : -hz - r);
      }
    }
  }
  return { x, z };
}
