// Builds public/media/** and public/og.png from the private _source/ folder.
import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, '_source');
const PUB = join(root, 'public');
const MAX = 1600;

// source file (relative to _source) -> output (relative to public)
const FILES = {
  'Tranquility Base/Moon View.jpg': 'media/tranquility-base/moon-view.webp',
  'Tranquility Base/Pole View.jpg': 'media/tranquility-base/pole-view.webp',
  'Tranquility Base/Standing View.jpg': 'media/tranquility-base/standing-view.webp',
  'DreamsComeTrue/Home.png': 'media/dreams-come-true/home.webp',
  'DreamsComeTrue/Choose Your Version.png': 'media/dreams-come-true/choose-your-version.webp',
  'DreamsComeTrue/Record Your Picture Book.png': 'media/dreams-come-true/record.webp',
  'DreamsComeTrue/Generated Picture Book.png': 'media/dreams-come-true/generated-book.webp',
  'DebateMate/Home Screen.jpg': 'media/debate-mate/home.webp',
  'DebateMate/Arena.jpg': 'media/debate-mate/arena.webp',
  'DebateMate/Dashboard.jpg': 'media/debate-mate/dashboard.webp',
  'DebateMate/How It Works.jpg': 'media/debate-mate/how-it-works.webp',
  'robotics/team-photo.png': 'media/robotics/team-photo.webp',
};
const LOGO = ['robotics/tech-devils-logo.png', 'media/robotics/logo.webp']; // 40x40, never upscaled past 2x
const POSTER = 'media/critics-choice/poster.webp';
const VESTIBULAR = {
  nb: 'notebooks/Vestibular Problem Detector.ipynb',
  outs: ['media/oculogica/correlation.webp', 'media/oculogica/threshold-3.webp'],
};
const AIRBNB = { nb: 'notebooks/airbnb_price_classification.ipynb', outs: ['media/airbnb-classifier/plot-1.webp'] };
const HEADSHOT = 'Headshot.jpg';

export const MEDIA_OUTPUTS = [
  ...Object.values(FILES), LOGO[1], POSTER, ...VESTIBULAR.outs, ...AIRBNB.outs,
];

const fail = (msg) => { console.error(`build-media: ${msg}`); process.exit(1); };
const need = (rel) => {
  const p = join(SRC, rel);
  if (!existsSync(p)) fail(`missing source file: _source/${rel}`);
  return p;
};
const writeOut = async (rel, buf) => {
  const p = join(PUB, rel); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, buf);
  const { width, height } = await sharp(buf).metadata();
  console.log(`  ${rel} ${width}x${height}`); // copy into Media width/height in src/content/stations.ts
};
// Source rows to drop from the top of specific screenshots (header strip with account info).
const CROP_TOP = { 'DebateMate/Dashboard.jpg': 38 };
const toWebp = async (input, cropTop = 0) => {
  if (cropTop) {
    const buf = await sharp(input).rotate().toBuffer();
    const { width, height } = await sharp(buf).metadata();
    input = await sharp(buf).extract({ left: 0, top: cropTop, width, height: height - cropTop }).toBuffer();
  }
  return sharp(input).rotate().resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
};

function notebookImages(rel) {
  const nb = JSON.parse(readFileSync(need(rel), 'utf8'));
  const imgs = [];
  for (const c of nb.cells) {
    const s = Array.isArray(c.source) ? c.source.join('') : c.source;
    if (c.cell_type === 'markdown') {
      for (const m of s.matchAll(/data:image\/png;base64,([A-Za-z0-9+/=]+)/g)) imgs.push(Buffer.from(m[1], 'base64'));
    }
    for (const o of c.outputs ?? []) {
      const d = o.data?.['image/png'];
      if (d) imgs.push(Buffer.from(Array.isArray(d) ? d.join('') : d, 'base64'));
    }
  }
  return imgs;
}

async function download(urls) {
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.ok) return Buffer.from(await res.arrayBuffer());
    } catch { /* try next */ }
  }
  fail(`could not download poster from ${urls.join(' or ')} (network failure)`);
}

async function main() {
  for (const [src, out] of Object.entries(FILES)) await writeOut(out, await toWebp(need(src), CROP_TOP[src] ?? 0));

  // logo: native 40x40 upscaled to 80 at most (2x)
  await writeOut(LOGO[1], await sharp(need(LOGO[0])).resize(80, 80, { fit: 'inside' }).webp({ quality: 80 }).toBuffer());

  for (const { nb, outs } of [VESTIBULAR, AIRBNB]) {
    const imgs = notebookImages(nb);
    if (imgs.length < outs.length) fail(`${nb}: expected at least ${outs.length} images, found ${imgs.length}`);
    for (let i = 0; i < outs.length; i++) await writeOut(outs[i], await toWebp(imgs[i]));
  }

  const poster = await download([
    'https://i.ytimg.com/vi/qGuouXZMmC4/maxresdefault.jpg',
    'https://i.ytimg.com/vi/qGuouXZMmC4/hqdefault.jpg',
  ]);
  await writeOut(POSTER, await toWebp(poster));

  // og.png 1200x630
  const D = 400;
  const head = await sharp(need(HEADSHOT)).rotate().resize(D, D, { fit: 'cover', position: 'top' })
    .composite([{ input: Buffer.from(`<svg width="${D}" height="${D}"><circle cx="${D / 2}" cy="${D / 2}" r="${D / 2}"/></svg>`), blend: 'dest-in' }])
    .png().toBuffer();
  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
<rect width="1200" height="630" fill="#0A0A0A"/><rect x="0" y="0" width="16" height="630" fill="#CC0033"/>
<text x="80" y="290" font-family="Arial Narrow, Arial, sans-serif" font-weight="700" font-size="84" fill="#FFFFFF">Brayden Uglione</text>
<rect x="80" y="320" width="120" height="8" fill="#CC0033"/>
<text x="80" y="390" font-family="Arial, sans-serif" font-size="36" fill="#CC0033">CS + Data Science · Rutgers Honors</text>
<circle cx="930" cy="315" r="${D / 2 + 8}" fill="#CC0033"/></svg>`;
  const og = await sharp(Buffer.from(svg)).composite([{ input: head, left: 930 - D / 2, top: 315 - D / 2 }]).png().toBuffer();
  mkdirSync(PUB, { recursive: true });
  writeFileSync(join(PUB, 'og.png'), og);
  console.log(`build-media: wrote ${MEDIA_OUTPUTS.length} media files + og.png`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
