import { useEffect, useMemo } from 'react';
import { BoxGeometry, MeshToonMaterial } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildings } from '../../content/buildings';
import { gradientMap } from '../scene/materials';
import { theme } from '../look/theme';
import { massingFor } from './massing';

/** Boxes merged per district per colour. */
export function Massing() {
  const parts = useMemo(() => {
    const groups = new Map<string, { color: string; geos: BoxGeometry[] }>();
    for (const b of buildings) {
      for (const m of massingFor(b.id)) {
        const key = `${b.district}:${m.color}`;
        const g = new BoxGeometry(m.w, m.h, m.d);
        g.translate(m.x, m.y, m.z);
        const entry = groups.get(key) ?? { color: theme.accents[m.color], geos: [] };
        entry.geos.push(g);
        groups.set(key, entry);
      }
    }
    return [...groups.entries()].map(([key, { color, geos }]) => {
      const geometry = mergeGeometries(geos)!;
      geos.forEach((g) => g.dispose());
      return { key, geometry, material: new MeshToonMaterial({ color, gradientMap }) };
    });
  }, []);
  useEffect(() => () => parts.forEach((p) => { p.geometry.dispose(); p.material.dispose(); }), [parts]);
  return <group>{parts.map((p) => <mesh key={p.key} geometry={p.geometry} material={p.material} />)}</group>;
}
