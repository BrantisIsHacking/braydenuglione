import { useMemo } from 'react';
import { games } from '../../../../content/games';
import type { ThemeColorKey } from '../../../../content/types';
import type { InstanceItem } from '../../../kit/instancing';
import { ShapeBatch } from '../../../kit/ShapeBatch';
import { CAB, CABINET_COLORS, cabinetSlot, MARQUEE } from '../look';

const BODY_H = 1.1;

/** 18 cabinets facing south: body (outlined, by colour), ink bezel, glowing teal screen, control slab, stick, buttons, lit header. */
export function Cabinets() {
  const parts = useMemo(() => {
    const bodies = new Map<ThemeColorKey, InstanceItem[]>();
    const bezel: InstanceItem[] = [];
    const screen: InstanceItem[] = [];
    const slab: InstanceItem[] = [];
    const stick: InstanceItem[] = [];
    const buttons: InstanceItem[] = [];
    const header: InstanceItem[] = [];
    games.forEach((_, i) => {
      const [x, z] = cabinetSlot(i);
      const c = CABINET_COLORS[i % CABINET_COLORS.length];
      const list = bodies.get(c) ?? [];
      list.push({ x, y: BODY_H / 2, z, sx: CAB.w, sy: BODY_H, sz: CAB.d });
      bodies.set(c, list);
      const front = z + CAB.d / 2;
      bezel.push({ x, y: 0.72, z: front + 0.01, sx: 0.98, sy: 0.52, sz: 0.04 });
      screen.push({ x, y: 0.72, z: front + 0.04, sx: 0.8, sy: 0.38, sz: 0.04 });
      slab.push({ x, y: 0.38, z: front + 0.15, sx: 1.0, sy: 0.1, sz: 0.4 });
      stick.push({ x: x - 0.25, y: 0.5, z: front + 0.15, sx: 0.07, sy: 0.2, sz: 0.07 });
      buttons.push({ x: x + 0.05, y: 0.46, z: front + 0.15, sx: 0.12, sy: 0.08, sz: 0.12 }, { x: x + 0.27, y: 0.46, z: front + 0.15, sx: 0.12, sy: 0.08, sz: 0.12 });
      header.push({ x, y: MARQUEE.y, z, sx: MARQUEE.w, sy: MARQUEE.h, sz: MARQUEE.d });
    });
    return { bodies: [...bodies.entries()], bezel, screen, slab, stick, buttons, header };
  }, []);
  return (
    <>
      {parts.bodies.map(([c, items]) => (
        <ShapeBatch key={c} shape="box" color={c} items={items} outline />
      ))}
      <ShapeBatch shape="box" color="ink" items={parts.bezel} />
      <ShapeBatch shape="box" color="teal" items={parts.screen} glow={1.0} />
      <ShapeBatch shape="box" color="slate" items={parts.slab} />
      <ShapeBatch shape="cylinder" color="scarlet" items={parts.stick} />
      <ShapeBatch shape="sphere" color="mustard" items={parts.buttons} />
      <ShapeBatch shape="box" color="offWhite" items={parts.header} glow={0.3} />
    </>
  );
}
