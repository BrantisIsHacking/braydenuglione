import { LOOP_INSET } from './geometry';
import { MAP, LOTS } from '../logic/layout';
import { box, cone, cyl, type ExteriorPart } from './exteriors';

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

function chessPark(): ExteriorPart[] {
  const { x, z } = LOTS['chess-park'].spot!;
  const out: ExteriorPart[] = [];
  const sq = 0.12, top = 0.7 + 0.01;
  // 64-square checker top
  for (const i of range(8)) for (const j of range(8)) {
    out.push(box((i + j) % 2 === 0 ? 'offWhite' : 'ink', x + (i - 3.5) * sq, top, z + (j - 3.5) * sq, sq, 0.02, sq));
  }
  // 8 + 8 simple pieces: cylinders and cones, one side per rank
  for (const i of range(8)) {
    const px = x + (i - 3.5) * sq;
    const make = (c: 'scarlet' | 'mustard', pz: number) => (i % 2 === 0 ? cyl(c, px, top + 0.08, pz, 0.07, 0.14) : cone(c, px, top + 0.08, pz, 0.08, 0.16));
    out.push(make('mustard', z + 2.5 * sq), make('scarlet', z - 2.5 * sq));
  }
  // two benches (seat + slab legs) and a low hedge ring open to the south
  for (const bx of [x - 1.3, x + 1.3]) {
    out.push(box('hardwood', bx, 0.45, z, 0.5, 0.08, 1.4), box('slate', bx, 0.2, z - 0.55, 0.4, 0.4, 0.08), box('slate', bx, 0.2, z + 0.55, 0.4, 0.4, 0.08));
  }
  out.push(box('fairway', x, 0.3, z - 1.3, 4.4, 0.6, 0.5), box('fairway', x - 2.2, 0.3, z + 0.025, 0.5, 0.6, 2.15), box('fairway', x + 2.2, 0.3, z + 0.025, 0.5, 0.6, 2.15));
  // sign pole north of the table
  out.push(cyl('slate', x, 1.35, z - 0.9, 0.08, 2.7));
  return out;
}

function park(): ExteriorPart[] {
  const { x, z } = LOTS.park.spot!;
  const out: ExteriorPart[] = [
    cyl('fairway', x, 0.03, z, 5.2, 0.05),
    // roundnet: net disc inside the ring, five legs, a ball
    cyl('ink', x, 0.3, z, 0.82, 0.03),
    ...range(5).map((i) => cyl('slate', x + Math.cos((i / 5) * Math.PI * 2) * 0.47, 0.15, z + Math.sin((i / 5) * Math.PI * 2) * 0.47, 0.06, 0.3)),
    { shape: 'sphere' as const, color: 'mustard' as const, x: x + 0.12, y: 0.4, z, sx: 0.16, sy: 0.16, sz: 0.16 },
    // bench and sign pole
    box('hardwood', x + 2.3, 0.45, z, 0.5, 0.08, 1.4), box('slate', x + 2.3, 0.2, z - 0.55, 0.4, 0.4, 0.08), box('slate', x + 2.3, 0.2, z + 0.55, 0.4, 0.4, 0.08),
    cyl('slate', x, 1.35, z - 0.9, 0.08, 2.7),
  ];
  return out;
}

function runningLoop(): ExteriorPart[] {
  const { x, z } = LOTS['running-loop'].spot!;
  const out: ExteriorPart[] = [];
  const step = 2.4;
  const x0 = MAP.minX + LOOP_INSET, x1 = MAP.maxX - LOOP_INSET, z0 = MAP.minZ + LOOP_INSET, z1 = MAP.maxZ - LOOP_INSET;
  const dash = (dx: number, dz: number, along: 'x' | 'z') => box('offWhite', dx, 0.025, dz, along === 'x' ? 1 : 0.14, 0.02, along === 'x' ? 0.14 : 1);
  for (let px = x0 + 1; px < x1; px += step) out.push(dash(px, z0, 'x'), dash(px, z1, 'x'));
  for (let pz = z0 + 1; pz < z1; pz += step) out.push(dash(x0, pz, 'z'), dash(x1, pz, 'z'));
  // start line on the loop below the marker, plus a base for the post
  out.push(box('scarlet', x, 0.028, z1, 0.3, 0.02, 1.5), box('slate', x, 0.1, z, 0.6, 0.2, 0.6));
  return out;
}

export function spotParts(id: 'chess-park' | 'park' | 'running-loop'): ExteriorPart[] {
  return id === 'chess-park' ? chessPark() : id === 'park' ? park() : runningLoop();
}
