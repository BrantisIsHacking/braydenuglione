import { Euler, Matrix4, Quaternion, Vector3 } from 'three';

export type InstanceItem = { x: number; y: number; z: number; sx?: number; sy?: number; sz?: number; rotY?: number };

/** Column-major 4x4 matrices, 16 floats per item. */
export function instanceMatrices(items: readonly InstanceItem[]): Float32Array {
  const out = new Float32Array(items.length * 16);
  const m = new Matrix4();
  const q = new Quaternion();
  const e = new Euler();
  const p = new Vector3();
  const s = new Vector3();
  items.forEach((it, i) => {
    q.setFromEuler(e.set(0, it.rotY ?? 0, 0));
    m.compose(p.set(it.x, it.y, it.z), q, s.set(it.sx ?? 1, it.sy ?? 1, it.sz ?? 1));
    m.toArray(out, i * 16);
  });
  return out;
}
