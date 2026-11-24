/** Hard cap on troika `<Text>` per scene (signs, content lines and labels together). */
export const TEXT_CAP = 24;

/** Text objects a scene creates: signs + content lines + at most six exhibit labels (the nearest ones). */
export function textCount(c: { signs: number; lines: number; labelled: number }): number {
  return c.signs + c.lines + Math.min(6, c.labelled);
}
