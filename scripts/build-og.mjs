// Builds public/og.png (1200x630 social card): headshot, name and title. No phone number, no logos.
// Runs standalone (`npm run og`) and as the last step of build-media.
import sharp from 'sharp';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HEADSHOT = join(root, '_source', 'Headshot.jpg');
const OUT = join(root, 'public', 'og.png');

export async function buildOg() {
  if (!existsSync(HEADSHOT)) {
    console.error('build-og: missing source file: _source/Headshot.jpg');
    process.exit(1);
  }
  const D = 400;
  const head = await sharp(HEADSHOT).rotate().resize(D, D, { fit: 'cover', position: 'top' })
    .composite([{ input: Buffer.from(`<svg width="${D}" height="${D}"><circle cx="${D / 2}" cy="${D / 2}" r="${D / 2}"/></svg>`), blend: 'dest-in' }])
    .png().toBuffer();
  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
<rect width="1200" height="630" fill="#0A0A0A"/><rect x="0" y="0" width="16" height="630" fill="#CC0033"/>
<text x="80" y="250" font-family="Arial Narrow, Arial, sans-serif" font-weight="700" font-size="88" fill="#FFFFFF">Brayden Uglione</text>
<rect x="80" y="282" width="120" height="8" fill="#CC0033"/>
<text x="80" y="360" font-family="Arial Narrow, Arial, sans-serif" font-weight="700" font-size="46" letter-spacing="2" fill="#FF5A78">SWE · DATA SCIENCE · ML</text>
<text x="80" y="425" font-family="Arial, sans-serif" font-size="30" fill="#E6E6E6">Rutgers Honors College · CS + Data Science</text>
<text x="80" y="475" font-family="Arial, sans-serif" font-size="30" fill="#9A9A9A">Seeking Summer 2027 internships</text>
<circle cx="930" cy="315" r="${D / 2 + 8}" fill="#CC0033"/></svg>`;
  const og = await sharp(Buffer.from(svg)).composite([{ input: head, left: 930 - D / 2, top: 315 - D / 2 }]).png({ compressionLevel: 9, palette: false }).toBuffer();
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, og);
  console.log(`build-og: wrote public/og.png (${(og.length / 1024).toFixed(0)} KB)`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await buildOg();
