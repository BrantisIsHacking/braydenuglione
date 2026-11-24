// Builds public/media/** and public/og.png from the private _source/ folder.
import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildOg } from './build-og.mjs';

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

  await buildOg(); // og.png lives in build-og.mjs
  console.log(`build-media: wrote ${MEDIA_OUTPUTS.length} media files`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
