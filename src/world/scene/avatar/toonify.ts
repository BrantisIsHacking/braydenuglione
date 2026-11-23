import { Color, MeshToonMaterial, type Material, type Mesh, type Object3D } from 'three';
import { MATERIAL_ROLES } from './avatarConfig';
import { gradientMap, type materials } from '../materials';

// Textures are stripped from the GLB at build time, so near-black factors read as bald; override explicitly.
const COLOR_OVERRIDE: Record<string, string> = { Hair: '#3a2418', Eyes: '#14110f' };

export function toonify(root: Object3D, m: typeof materials): void {
  const shared = new Set<Material>(Object.values(m));
  root.traverse((o) => {
    const mesh = o as Mesh;
    if (!mesh.isMesh) return;
    const orig = mesh.material as Material & { color?: Color };
    // Idempotent: already-swapped meshes (shared or previously created toon) are left alone.
    if (shared.has(orig) || (orig instanceof MeshToonMaterial && orig.gradientMap === gradientMap)) return;
    const role = (MATERIAL_ROLES as Record<string, string>)[orig.name];
    if (role === 'jersey') mesh.material = m.jersey;
    else if (role === 'shorts') mesh.material = m.shorts;
    else {
      const t = new MeshToonMaterial({ gradientMap });
      if (COLOR_OVERRIDE[orig.name]) t.color.set(COLOR_OVERRIDE[orig.name]);
      else if (orig.color) t.color.copy(orig.color);
      t.name = orig.name;
      mesh.material = t;
    }
  });
}
