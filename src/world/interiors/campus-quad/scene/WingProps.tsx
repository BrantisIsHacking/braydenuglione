import { useMemo } from 'react';
import { propAnchor } from '../../../logic/interior';
import { ShapeBatch, type BatchShape } from '../../../kit/ShapeBatch';
import type { InstanceItem } from '../../../kit/instancing';
import type { ThemeColorKey } from '../../../../content/types';

type Spec = { shape: BatchShape; color: ThemeColorKey; outline: boolean; items: InstanceItem[] };
type Pos = [number, number];

/** Advisory table, hackathon tables, small stage and the two Java desks; merged to one batch per shape and colour. */
export function WingProps({ positions }: { positions: Record<'advisory-council' | 'hackmcst' | 'nslc' | 'java-juniors', Pos> }) {
  const batches = useMemo(() => {
    const acc = new Map<string, Spec>();
    const add = (shape: BatchShape, color: ThemeColorKey, it: InstanceItem, outline = false) => {
      const k = `${shape}/${color}/${outline}`;
      if (!acc.has(k)) acc.set(k, { shape, color, outline, items: [] });
      acc.get(k)!.items.push(it);
    };
    const laptop = (x: number, y: number, z: number) => {
      add('box', 'ink', { x, y: y + 0.03, z, sx: 0.42, sy: 0.05, sz: 0.3 });
      add('box', 'ink', { x, y: y + 0.18, z: z - 0.15, sx: 0.42, sy: 0.28, sz: 0.04 });
    };
    {
      const [ax, az] = propAnchor(positions['advisory-council']);
      add('cylinder', 'hardwood', { x: ax, y: 0.375, z: az, sx: 1.2, sy: 0.75, sz: 1.0 }, true);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        add('box', 'ink', { x: ax + Math.cos(a) * 1.15, y: 0.25, z: az + Math.sin(a) * 0.6, sx: 0.3, sy: 0.5, sz: 0.3 });
      }
    }
    {
      const [ax, az] = propAnchor(positions.hackmcst);
      for (const dx of [-0.8, 0.8]) {
        add('box', 'hardwood', { x: ax + dx, y: 0.35, z: az + 0.2, sx: 1.3, sy: 0.7, sz: 0.7 }, true);
        laptop(ax + dx, 0.7, az + 0.2);
      }
      add('box', 'scarlet', { x: ax, y: 1.5, z: az - 1.5, sx: 2.6, sy: 0.8, sz: 0.04 });
      for (const dx of [-1.35, 1.35]) add('cylinder', 'slate', { x: ax + dx, y: 0.9, z: az - 1.5, sx: 0.06, sy: 1.8, sz: 0.06 });
    }
    {
      const [ax, az] = propAnchor(positions.nslc);
      add('box', 'stone', { x: ax, y: 0.15, z: az - 0.2, sx: 2.8, sy: 0.3, sz: 1.0 }, true);
      add('box', 'ink', { x: ax, y: 0.75, z: az - 0.3, sx: 0.5, sy: 0.9, sz: 0.4 });
    }
    {
      const [ax, az] = propAnchor(positions['java-juniors']);
      for (const dx of [-1.0, 1.0]) {
        add('box', 'hardwood', { x: ax + dx, y: 0.35, z: az + 0.3, sx: 1.0, sy: 0.7, sz: 0.7 }, true);
        laptop(ax + dx, 0.7, az + 0.3);
      }
      add('cylinder', 'offWhite', { x: ax, y: 0.5, z: az - 0.4, sx: 0.8, sy: 1.0, sz: 0.8 });
      add('box', 'offWhite', { x: ax + 0.5, y: 0.5, z: az - 0.4, sx: 0.25, sy: 0.5, sz: 0.1 });
      add('cylinder', 'ink', { x: ax, y: 1.0, z: az - 0.4, sx: 0.66, sy: 0.04, sz: 0.66 });
    }
    return [...acc.values()];
  }, [positions]);
  return (
    <>
      {batches.map((b) => (
        <ShapeBatch key={`${b.shape}/${b.color}/${b.outline}`} shape={b.shape} color={b.color} outline={b.outline} items={b.items} />
      ))}
    </>
  );
}
