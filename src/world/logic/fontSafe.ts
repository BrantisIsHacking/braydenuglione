// Unicode ranges of the local Barlow Condensed latin subset (800 weight).
// Copied from @fontsource/barlow-condensed 800.css (latin block).
export const FONT_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0x0000, 0x00ff],
  [0x0131, 0x0131],
  [0x0152, 0x0153],
  [0x02bb, 0x02bc],
  [0x02c6, 0x02c6],
  [0x02da, 0x02da],
  [0x02dc, 0x02dc],
  [0x0304, 0x0304],
  [0x0308, 0x0308],
  [0x0329, 0x0329],
  [0x2000, 0x206f],
  [0x20ac, 0x20ac],
  [0x2122, 0x2122],
  [0x2191, 0x2191],
  [0x2193, 0x2193],
  [0x2212, 0x2212],
  [0x2215, 0x2215],
  [0xfeff, 0xfeff],
  [0xfffd, 0xfffd],
];

function safeCp(cp: number): boolean {
  return FONT_RANGES.some(([a, b]) => cp >= a && cp <= b);
}

export function isFontSafe(s: string): boolean {
  for (const ch of s) if (!safeCp(ch.codePointAt(0)!)) return false;
  return true;
}

export function toFontSafe(s: string): string {
  let out = '';
  for (const ch of s.replace(/→/g, 'to')) if (safeCp(ch.codePointAt(0)!)) out += ch;
  return out.replace(/ {2,}/g, ' ');
}
