import { useMemo } from 'react';
import { ShapeBatch } from '../../../kit/ShapeBatch';
import { HOLES } from '../geometry';
import { bx, cy } from '../look';

/** Nine decorative putting holes: strips, greens, cups, tee mats, rails and three small obstacles. All flat, no physics. */
export function Holes() {
  const p = useMemo(() => {
    const strips: ReturnType<typeof bx>[] = [];
    const rails: ReturnType<typeof bx>[] = [];
    const mats: ReturnType<typeof bx>[] = [];
    const greenOuter: ReturnType<typeof cy>[] = [];
    const greenInner: ReturnType<typeof cy>[] = [];
    const cups: ReturnType<typeof cy>[] = [];
    const steps: ReturnType<typeof bx>[] = [];
    const tunnel: ReturnType<typeof bx>[] = [];
    const tunnelMouth: ReturnType<typeof bx>[] = [];
    const water: ReturnType<typeof bx>[] = [];
    const bridge: ReturnType<typeof bx>[] = [];
    for (const h of HOLES) {
      const [tx, tz] = h.tee;
      const [cx, cz] = h.cup;
      const dir = Math.sign(cx - tx);
      const mx = (tx + cx) / 2;
      const len = Math.abs(cx - tx) + 0.8;
      strips.push(bx(mx, 0.03, tz, len, 0.06, 1.4));
      const rl = Math.abs(cx - tx) - 0.9;
      const rx = tx - dir * 0.4 + (dir * rl) / 2;
      for (const s of [-1, 1]) rails.push(bx(rx, 0.075, tz + s * 0.78, rl, 0.15, 0.08));
      rails.push(bx(tx - dir * 0.4, 0.075, tz, 0.08, 0.15, 1.64));
      mats.push(bx(tx, 0.07, tz, 0.9, 0.02, 0.9));
      greenOuter.push(cy(cx, 0.025, cz, 2.4, 0.05));
      greenInner.push(cy(cx, 0.04, cz, 1.8, 0.08));
      cups.push(cy(cx, 0.085, cz, 0.28, 0.02));
      if (h.n === 3) steps.push(bx(mx, 0.07, tz, 1.6, 0.14, 1.2), bx(mx, 0.18, tz, 1.0, 0.08, 1.2), bx(mx, 0.26, tz, 0.5, 0.08, 1.2));
      if (h.n === 6) {
        tunnel.push(bx(mx, 0.15, tz - 0.55, 1.0, 0.3, 0.3), bx(mx, 0.15, tz + 0.55, 1.0, 0.3, 0.3), bx(mx, 0.34, tz, 1.0, 0.08, 1.4));
        tunnelMouth.push(bx(mx, 0.12, tz, 1.04, 0.14, 0.8));
      }
      if (h.n === 9) {
        water.push(bx(mx, 0.045, tz, 1.2, 0.05, 2.2));
        bridge.push(bx(mx, 0.075, tz, 1.2, 0.05, 1.1));
      }
    }
    return { strips, rails, mats, greenOuter, greenInner, cups, steps, tunnel, tunnelMouth, water, bridge };
  }, []);
  return (
    <>
      <ShapeBatch shape="box" color="fairway" items={p.strips} />
      <ShapeBatch shape="cylinder" color="fairway" items={p.greenOuter} />
      <ShapeBatch shape="cylinder" color="grass" items={p.greenInner} />
      <ShapeBatch shape="cylinder" color="ink" items={p.cups} />
      <ShapeBatch shape="box" color="offWhite" items={p.mats} />
      <ShapeBatch shape="box" color="hardwood" items={[...p.rails, ...p.bridge]} />
      <ShapeBatch shape="box" color="stone" items={p.steps} />
      <ShapeBatch shape="box" color="brick" items={p.tunnel} />
      <ShapeBatch shape="box" color="ink" items={p.tunnelMouth} />
      <ShapeBatch shape="box" color="water" items={p.water} />
    </>
  );
}
