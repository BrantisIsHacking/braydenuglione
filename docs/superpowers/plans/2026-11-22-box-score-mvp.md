# Box Score MVP (Phase 0 remainder + Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a fast, accessible 2D "Box Score" portfolio at a free `*.pages.dev` URL that recruiters can open today, built on the content model the 3D arena will reuse in Phase 2.

**Architecture:** Vite + React + TypeScript single-page app with hash routing. All content lives in typed data files under `src/content/`; one shared `StationContent` component renders a station for both the 2D view (now) and the arena panel (Phase 2). A Node script turns raw source images/notebooks in `_source/` (gitignored) into optimized WebP under `public/media/`. No three.js in this phase.

**Tech Stack:** Node 22+, React 18, TypeScript 5, Vite 5, Vitest + @testing-library/react + jsdom, Playwright, sharp, @fontsource fonts, Cloudflare Pages + Cloudflare Web Analytics.

**Spec:** `docs/superpowers/specs/2026-11-21-arena-portfolio-design.md`. Facts for copy: `_source/docs/content-notes.md` + `_source/docs/Brayden_Uglione_Resume.pdf` (private, gitignored — read, never copy into git except as finished site copy).

## Global Constraints

- Palette tokens: scarlet `#CC0033`, black `#0A0A0A`, white `#FFFFFF`; no Rutgers, NASA, NBA, or other organization logos — names as text only. Exception: the Tech Devils team logo (owner's own team) may appear in the robotics station.
- **Never publish a phone number.** No area-code-style numbers, no phone pattern, and no private terms (the owner's phone number, matched via private terms in `_source/private-terms.txt`) anywhere in `src/`, `public/`, or `dist/`. No resume PDF in `public/`.
- Do not mention roles the owner chose to omit anywhere.
- Every fact and number matches the resume; when the resume and notes differ, the resume wins.
- Public email: `uglionebrayden@gmail.com`. Links: GitHub `https://github.com/BrantisIsHacking`, LinkedIn `https://www.linkedin.com/in/brayden-uglione/`, Devpost `https://devpost.com/brantisu5`.
- Copy: first person, plain, specific; `oneLiner` ≤ 90 chars; `bullets` ≤ 3; every link `https://`.
- Images: WebP, max 1600 px on the long edge, quality 80.
- Budget: initial JS ≤ 200 KB gzip; no three.js / R3F imports in this phase.
- Layout works at 320 px wide with no horizontal scroll; 16 px side gutter on phones.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Work on branch `phase-0-setup` (already created); do not push without owner confirmation.

## Review Focus

1. Deep link to an unknown or misspelled id (`/#tranqility-base`) → Box Score renders from the top, no crash, no console error. (Test in Task 5.)
2. YouTube blocked, offline, or JS-only embed failing → documentary card still shows poster, title, and a plain "Watch on YouTube" link; no iframe is created before a click. (Test in Task 4.)
3. Station with optional fields absent (`stat: null`, no `links`, no `media`, no `credits`) → card renders without empty headings or stray separators. (Test in Task 4.)
4. Crawler / no-JS visitor → `index.html` contains name, one-line intro, email, and GitHub/LinkedIn/Devpost links in `<noscript>` and correct OG/Twitter meta. (Test in Task 6.)
5. Narrow phone (320 px) with the longest title and tech list → no horizontal overflow. (Test in Task 6.)

---

## File Structure

```
package.json, vite.config.ts, tsconfig.json, playwright.config.ts, index.html
public/_headers                     cache + security headers for Cloudflare Pages
public/media/<station-id>/*.webp    generated (committed)
public/og.png                       generated (committed)
scripts/build-media.mjs             _source → public/media (+ og.png, notebook plots)
scripts/check-dist.mjs              post-build: phone scan + JS size budget
src/main.tsx, src/App.tsx           mount + hash router
src/styles/tokens.css, global.css   design tokens, base styles
src/content/types.ts                Station, Banner, LockerItem, Profile types
src/content/profile.ts              name, intro, email, links, targets, jersey
src/content/stations.ts             all 24 stations (order = college-first)
src/content/banners.ts              rafter banners
src/content/lockerRoom.ts           easter eggs (append-only list)
src/content/index.ts                re-exports + helpers (getStation, byCategory)
src/routing/hash.ts                 parseHash / toHash
src/ui/StationContent.tsx           shared station renderer (arena reuses it)
src/ui/VideoEmbed.tsx               click-to-load youtube-nocookie
src/ui/TerminalBlock.tsx            monospace metrics block for kind 'terminal'
src/boxscore/BoxScore.tsx           page: header, filters, sections, banners, locker room, contact
src/boxscore/StationCard.tsx        card wrapper around StationContent
src/boxscore/Filters.tsx            category filter chips
tests/content.test.ts, tests/hash.test.ts, tests/ui/*.test.tsx, e2e/*.spec.ts
README.md
```

## Station roster (ids are contracts — later tasks and Phase 2 depend on them)

| id | zone | category | kind |
|---|---|---|---|
| tranquility-base | projects | project | standard |
| dreams-come-true | projects | project | standard |
| debate-mate | projects | project | standard |
| zayi-ai-studio | projects | project | terminal |
| airbnb-classifier | projects | project | terminal |
| zayi-fellow | now | experience | standard |
| usacs | now | leadership | standard |
| hackru | now | leadership | standard |
| calc-ii-la | now | experience | standard |
| honors-ambassador | now | leadership | standard |
| orientation-leader | now | leadership | standard |
| rutgers-honors | rutgers | education | standard |
| critics-choice | rutgers | education | video |
| code-ninjas | bridge | experience | standard |
| shah-sokoloff | bridge | experience | standard |
| ccm | bridge | education | standard |
| teaching-mentoring | bench | leadership | standard |
| oculogica | throwback | experience | terminal |
| ai-camp | throwback | experience | standard |
| robotics | throwback | throwback | standard |
| advisory-council | throwback | throwback | standard |
| hackmcst | throwback | throwback | standard |
| nslc | throwback | throwback | standard |
| java-juniors | throwback | throwback | standard |

(24 stations. `pos` values are placeholders `[0, 0]` in this phase; Phase 2 assigns court coordinates.)

---

### Task 1: Scaffold, tooling, design tokens

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles/tokens.css`, `src/styles/global.css`, `playwright.config.ts`, `tests/setup.ts`, `tests/app.test.tsx`

**Interfaces:**
- Produces: npm scripts `dev`, `build` (`tsc -b && vite build && node scripts/check-dist.mjs` — add the check script call in Task 6; until then `tsc -b && vite build`), `test` (`vitest run`), `e2e` (`playwright test`), `media` (`node scripts/build-media.mjs`). CSS custom properties `--scarlet`, `--ink`, `--paper`, `--muted`, `--line`, `--font-display` (Barlow Condensed via `@fontsource/barlow-condensed` 600/800), `--font-body` (Inter via `@fontsource/inter` 400/600), `--font-mono` (JetBrains Mono via `@fontsource/jetbrains-mono` 400).

- [ ] **Step 1:** Scaffold with `npm create vite@5 . -- --template react-ts` (directory is non-empty: accept ignore of existing files), install `vitest @testing-library/react @testing-library/jest-dom jsdom @playwright/test sharp @fontsource/barlow-condensed @fontsource/inter @fontsource/jetbrains-mono` as dev/deps, delete Vite demo assets.
- [ ] **Step 2: Write failing test** `tests/app.test.tsx`: renders `<App />`, asserts `getByRole('heading', { level: 1 })` has text `Brayden Uglione`.
- [ ] **Step 3:** Run `npm test` → FAIL.
- [ ] **Step 4:** `App.tsx` renders `<h1>Brayden Uglione</h1>`; tokens + global CSS (dark-first: `--ink` background, `--paper` text; `body` gets explicit background; `prefers-reduced-motion` disables transitions). Configure Vitest `environment: 'jsdom'`, `setupFiles: tests/setup.ts`. Playwright projects: `desktop` (1280×800) and `mobile` (Pixel 7), `webServer: npm run build && npx vite preview --port 4173`; `use.baseURL = process.env.BASE_URL ?? "http://localhost:4173"` and omit `webServer` when `BASE_URL` is set (live checks in Task 7).
- [ ] **Step 5:** `npm test` → PASS; `npm run build` succeeds.
- [ ] **Step 6:** Commit `chore: scaffold vite react app with tokens and test tooling`.

### Task 2: Content types and schema/no-phone tests

**Files:**
- Create: `src/content/types.ts`, `src/content/index.ts`, `tests/content.test.ts`
- Create (empty stubs so tests compile): `src/content/profile.ts`, `stations.ts`, `banners.ts`, `lockerRoom.ts`

**Interfaces:**
- Produces:
```ts
export type Zone = 'projects'|'now'|'rutgers'|'bridge'|'bench'|'throwback';
export type Category = 'project'|'experience'|'leadership'|'education'|'throwback';
export type Link = { label: string; url: string };
export type Media = { src: string; alt: string };           // src = '/media/<id>/<file>.webp'
export type TerminalRow = { label: string; value: string };
export type Station = {
  id: string; zone: Zone; category: Category; kind: 'standard'|'terminal'|'video';
  title: string; org: string; role: string | null;
  start: string; end: string;                                // 'YYYY-MM' | 'present'
  oneLiner: string; body: string; bullets: string[];
  stat: { value: string; label: string } | null;
  tech: string[]; links: Link[]; media: Media[];
  credits?: string;                                          // e.g. teammates
  terminal?: { command: string; rows: TerminalRow[]; note?: string };  // kind 'terminal'
  video?: { youtubeId: string; poster: Media };              // kind 'video'
  shotCaption: string; pos: [number, number];
};
export type Banner = { id: string; title: string; issuer: string; year: string; why: string };
export type LockerItem = { id: string; title: string; oneLiner: string; detail?: string; link?: Link; shotCaption: string };
export type Profile = { name: string; intro: string; tagline: string; email: string; school: string;
  links: Link[]; targets: string; jersey: number };
// index.ts
export function getStation(id: string): Station | undefined;
export function stationsByCategory(c: Category | 'all'): Station[];   // preserves stations.ts order
export const ALL_TEXT: string;   // every string in profile/stations/banners/lockerRoom joined, for scans
```

- [ ] **Step 1: Write failing tests** in `tests/content.test.ts`:
  - `ids are unique and kebab-case` (`/^[a-z0-9]+(-[a-z0-9]+)*$/`).
  - `roster matches plan`: ids equal the 24 ids in the roster table, in that order.
  - `oneLiner <= 90 chars`, `bullets.length <= 3`, `title/org/body/shotCaption non-empty`.
  - `all urls are https` (station links, profile links, locker links).
  - `start is YYYY-MM; end is YYYY-MM or 'present'`.
  - `kind 'terminal' has terminal.rows.length >= 2`; `kind 'video' has video.youtubeId === 'qGuouXZMmC4'`.
  - `no phone numbers`: `ALL_TEXT` does not match `/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/` and does not contain any private term (the owner's phone number etc., matched via private terms in `_source/private-terms.txt`).
  - `no private terms`: `findPrivateTerm(ALL_TEXT, loadPrivateTerms())` is null (skipped when none configured); covers roles the owner chose to omit.
  - `profile.email === 'uglionebrayden@gmail.com'`.
- [ ] **Step 2:** `npm test` → FAIL (stubs empty).
- [ ] **Step 3:** Implement `types.ts` and `index.ts`. (Content filled in Task 3 — tests stay red until then; that is expected.)
- [ ] **Step 4:** Commit `feat: content types and schema tests`.

### Task 3: Write all site copy

**Files:**
- Modify: `src/content/profile.ts`, `stations.ts`, `banners.ts`, `lockerRoom.ts`

**Interfaces:**
- Consumes: types from Task 2. Media `src` paths must follow `/media/<station-id>/<kebab-name>.webp` with names listed below (Task 4 generates exactly these).

Source of facts: `_source/docs/content-notes.md` and the resume PDF. Station order in `stations.ts` = roster table order.

- Profile: `name: 'Brayden Uglione'`, `tagline: "I like fixing things that don't work."`, `intro`: the owner's own words — "I'm Brayden Uglione, studying CS and Data Science with Math and Stats minors at Rutgers Honors College. I enjoy building software and taking broken systems and making them work reliably.", `school: 'Rutgers University – Honors College · B.S. Computer Science & B.S. Data Science · Minors in Math & Statistics · 3.84 GPA · Dean's List · May 2029'`, `targets: 'Looking for Summer 2027 internships in Software Engineering, Data Science, and Machine Learning'`, `jersey: 29`.
- Attribution rules: Tranquility Base `credits: 'Built with Rohan Sharma, Tanish Banota, and Hasan Ali'`, body names Brayden's parts (3D Moon view on LOLA relief with real-Sun shadows, shadow bake 15→60 fps, Gemini copilot 96 s→2 s, quick tour). Zayi AI Studio metrics are labeled team results ("our pipeline") and Brayden's part is cleaning/chunking notebooks, data consolidation, delegation, retrieval testing — never claim the retriever or RAG chain as his.
- Terminal rows: `zayi-ai-studio` → hit@5 `95% (38/40)`, citation validity `100%`, weighted quality `78.8%`, automated tests `85`; command `python eval.py --queries 40 --papers 10`. `airbnb-classifier` → neural net `82.8% acc · 0.61 F1`, logistic regression `80.6% acc · 0.54 F1`. `oculogica` → sensitivity `70%`, specificity `71%`, exam logs `10,000+`.
- Banners: Critic's Choice Prize (Rutgers Honors College, 2025); Best Use of Code & Technology (NASA Space Apps NYC, 2026); Best Use of Gemini (NASA Space Apps NYC, 2026); Bloodiest Game (NSLC at UCLA, 2024); Academy Scholar (Morris County School of Technology, 2024); Rising Star Award (Morris Tech Basketball, 2023); NHS · NTHS · NSHSS (2024, one banner).
- Locker room (≥ 10 items): basketball (112 career pts in 26 games, 12-pt high vs Warren Tech), golf (best 9-hole 40, +5), chess (chess.com `brantis89`, peaked ~1400 on an old account), Rocket League (Champion), FIFA 23, Roundnet club, teams list, movies (Star Wars IV–VI, Cars; IMDb link), books (four favorites; Goodreads link), music top 5, Stranger Things on Broadway, Karaoke Club.
- Media file names: `tranquility-base/{moon-view,pole-view,standing-view}.webp`, `dreams-come-true/{home,choose-your-version,record,generated-book}.webp`, `debate-mate/{home,arena,dashboard,how-it-works}.webp`, `robotics/{team-photo,logo}.webp`, `critics-choice/poster.webp`, `airbnb-classifier/plot-1.webp`, `oculogica/{correlation,threshold-3}.webp`. Every Media has a specific `alt`.

- [ ] **Step 1:** Write the four content files.
- [ ] **Step 2:** `npm test -- tests/content.test.ts` → PASS (all Task 2 tests).
- [ ] **Step 3:** Commit `feat: portfolio copy for all stations, banners, locker room`.

### Task 4: Media pipeline + shared station renderer

**Files:**
- Create: `scripts/build-media.mjs`, `src/ui/StationContent.tsx`, `src/ui/VideoEmbed.tsx`, `src/ui/TerminalBlock.tsx`, `tests/media.test.ts`, `tests/ui/station-content.test.tsx`, `tests/ui/video-embed.test.tsx`
- Generated & committed: `public/media/**`, `public/og.png`

**Interfaces:**
- Consumes: `Station`, `Media` (Task 2); media names (Task 3).
- Produces: `<StationContent station={Station} headingLevel={2|3} />` (title, org/role/dates line, oneLiner, stat, body, bullets, terminal|video|gallery, tech chips, links, credits); `<VideoEmbed youtubeId poster title />`; `<TerminalBlock command rows note? />`. Date format helper `formatRange(start, end): string` → `'May 2026 – Present'` exported from `StationContent.tsx`.

`build-media.mjs`: map of `_source` file → output path (Tranquility "Purple and Yellow…Carousel.png" is not used). For notebooks, parse JSON, collect `data:image/png;base64` from markdown and `outputs[].data['image/png']`, write first N as named above. `critics-choice/poster.webp`: download `https://i.ytimg.com/vi/qGuouXZMmC4/maxresdefault.jpg` (fallback `hqdefault.jpg`). `og.png` 1200×630: scarlet-on-black composite with headshot circle (right) and name + "CS + Data Science · Rutgers Honors" (left, SVG text via sharp). Resize `fit: 'inside'`, 1600 px, `webp({ quality: 80 })`. Script is idempotent and exits non-zero if a mapped source is missing.

- [ ] **Step 1: Write failing tests:**
  - `tests/media.test.ts` → `every Media.src in content exists under public/` and `every file ≤ 400 KB`.
  - `station-content.test.tsx` → for `getStation('tranquility-base')` renders heading, `credits` text, 3 images with non-empty alt, links with `target="_blank"` and `rel` containing `noopener`; **Review Focus 3:** a fixture station with `stat:null, links:[], media:[], credits undefined` renders no `role="list"` for links, no figure, and no text `undefined`/`null`.
  - `video-embed.test.tsx` → **Review Focus 2:** initially no `iframe`, poster img and a link `Watch on YouTube` with href `https://www.youtube.com/watch?v=qGuouXZMmC4`; after clicking the play button an iframe with src starting `https://www.youtube-nocookie.com/embed/qGuouXZMmC4` exists.
  - `formatRange('2026-05','present') === 'May 2026 – Present'`.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement the script; run `npm run media`; implement the three components.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat: media pipeline and shared station renderer`.

### Task 5: Box Score page, filters, hash routing

**Files:**
- Create: `src/routing/hash.ts`, `src/boxscore/BoxScore.tsx`, `src/boxscore/StationCard.tsx`, `src/boxscore/Filters.tsx`, `tests/hash.test.ts`, `tests/ui/boxscore.test.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `StationContent`, content helpers.
- Produces: `parseHash(hash: string): { view: 'boxscore'; stationId: string | null }` (Phase 2 adds `'arena'`); `toHash(stationId: string): string` → `'#<id>'`. Each card root has `id={station.id}` and `data-station`.

Page sections in order: header (name h1, tagline, school line, targets line, email + 3 links), filter chips `All · Projects · Experience · Leadership · Education · Throwback`, station sections grouped by zone headings (`Projects`, `2026`, `Rutgers`, `Bridge Year`, `On the Bench`, `Throwback: Morris Tech`), Rafters (banners grid), Locker Room (compact grid), Press Table (contact). Visual direction: printed box-score / stat-sheet — condensed display type, tabular numbers, scarlet rules, stat values large; invoke `frontend-design:frontend-design` for the visual pass. A disabled-looking-but-honest teaser "Arena opening soon" is NOT added (no dead UI) — the arena button arrives in Phase 2.

- [ ] **Step 1: Write failing tests:**
  - `hash.test.ts`: `parseHash('')` → `{view:'boxscore', stationId:null}`; `'#/box-score'` → null id; `'#tranquility-base'` → `'tranquility-base'`; **Review Focus 1:** `'#tranqility-base'` and `'#<script>'` → `stationId: null`.
  - `boxscore.test.tsx`: renders 24 `[data-station]` cards; clicking `Projects` leaves exactly 5; `All` restores 24; rafters list has 7 items; email link `mailto:uglionebrayden@gmail.com`.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement. On load and `hashchange`, valid id → `scrollIntoView` + focus the card heading (`tabIndex=-1`); invalid id → top. Filter state is local only.
- [ ] **Step 4:** `npm test` → PASS; `npm run dev` and eyeball at 1280 px and 375 px.
- [ ] **Step 5:** Commit `feat: box score page with filters and deep links`.

### Task 6: SEO, no-JS fallback, dist checks, e2e

**Files:**
- Modify: `index.html`, `package.json` (build script)
- Create: `scripts/check-dist.mjs`, `public/_headers`, `e2e/boxscore.spec.ts`

**Interfaces:**
- Consumes: built `dist/`.

`index.html`: `<title>Brayden Uglione — CS + Data Science, Rutgers</title>`, description, OG + Twitter `summary_large_image` with `/og.png` (absolute URL from `VITE_SITE_URL`, default `https://brayden-uglione.pages.dev`), `theme-color #CC0033`, scarlet SVG favicon (basketball glyph, no logos), `<noscript>` block with name, intro, email, three links. Cloudflare Web Analytics: inject `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"…"}'>` only when `VITE_CF_BEACON_TOKEN` is set (Vite `transformIndexHtml` plugin). `_headers`: `/assets/*` immutable 1y; `/media/*` 30d; site-wide `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.

`check-dist.mjs`: fail if any file in `dist/` matches the phone regex from Task 2 or contains any private term; fail if any `*.pdf` is in `dist/`; sum gzip size of JS referenced by `dist/index.html` and fail if > 200 KB; print the size.

- [ ] **Step 1: Write failing e2e** `e2e/boxscore.spec.ts` (both projects):
  - loads `/`, h1 `Brayden Uglione`, 24 cards, no console errors.
  - `/#tranquility-base` → that card is in the viewport.
  - **Review Focus 1:** `/#nope` → page at top, no errors.
  - **Review Focus 5 (mobile):** `document.documentElement.scrollWidth <= window.innerWidth`.
  - **Review Focus 4:** fetch `/` as text → contains `<noscript>` with `uglionebrayden@gmail.com`, `og:image`, `og:title`.
- [ ] **Step 2:** `npm run e2e` → FAIL.
- [ ] **Step 3:** Implement; set build script to `tsc -b && vite build && node scripts/check-dist.mjs`.
- [ ] **Step 4:** `npm run build` prints JS size ≤ 200 KB and passes; `npm run e2e` → PASS (desktop + mobile).
- [ ] **Step 5:** Commit `feat: seo meta, no-js fallback, dist guard, e2e`.

### Task 7: Deploy to Cloudflare Pages

**Files:**
- Create: `README.md`

- [ ] **Step 1:** README: what the site is, `npm run media` (needs `_source/`, which is private), `npm test`, `npm run e2e`, deploy settings (Build `npm run build`, output `dist`, env `NODE_VERSION=20`, `VITE_SITE_URL`, `VITE_CF_BEACON_TOKEN`), how to add a locker-room item (append one object to `src/content/lockerRoom.ts`).
- [ ] **Step 2:** Commit `docs: readme with deploy and content-editing steps`.
- [ ] **Step 3 (needs owner):** Ask the owner to confirm creating a public GitHub repo and pushing (outward-facing). Then: create repo, push `main` after merging `phase-0-setup`; owner connects it in Cloudflare Dashboard → Workers & Pages → Pages → Connect to Git, project name `brayden-uglione`; owner adds Web Analytics site and pastes token into Pages env vars; redeploy.
- [ ] **Step 4:** Verify live: `curl -s https://brayden-uglione.pages.dev | grep -c "Brayden Uglione"` ≥ 1; run `npx playwright test --config playwright.config.ts` with `BASE_URL` set to the live URL; open on a real phone.
