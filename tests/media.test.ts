import { describe, it, expect } from 'vitest';
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { stations } from '../src/content';
// @ts-expect-error plain mjs module
import { MEDIA_OUTPUTS } from '../scripts/build-media.mjs';

const pub = join(process.cwd(), 'public');
const rel = (src: string) => src.replace(/^\//, '');

describe('media', () => {
  const srcs = stations.flatMap((s) => [
    ...s.media.map((m) => m.src),
    ...(s.video ? [s.video.poster.src] : []),
  ]);
  it('every Media.src in content exists under public/', () => {
    for (const src of srcs) expect(existsSync(join(pub, rel(src))), src).toBe(true);
  });
  it('every media file is <= 400 KB', () => {
    for (const src of srcs) expect(statSync(join(pub, rel(src))).size, src).toBeLessThanOrEqual(400 * 1024);
  });
  it('every script output exists under public/ and og.png exists', () => {
    expect((MEDIA_OUTPUTS as string[]).length).toBe(17);
    for (const out of MEDIA_OUTPUTS as string[]) expect(existsSync(join(pub, out)), out).toBe(true);
    expect(existsSync(join(pub, 'og.png'))).toBe(true);
  });
});
