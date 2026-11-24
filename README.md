# Brayden Uglione: portfolio

A portfolio site built as a basketball-arena "box score". Each project, job, and activity is a station with a one-liner, a few bullets, a stat, and links, and you can filter and deep-link to any of them (for example `/#tranquility-base`). A 3D version, Brayden's World, reuses the same content.

Live site: https://braydenuglione.pages.dev

Stack: Vite, React 18, TypeScript. Tests: Vitest (unit) and Playwright (end to end).

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | `tsc -b`, then `vite build`, then `scripts/check-dist.mjs` |
| `npm test` | Unit tests (Vitest) |
| `npm run e2e` | Playwright tests; builds and serves `dist` on port 4173 itself |
| `npm run media` | Regenerates `public/media` and `public/og.png` from source images |

`npm run media` needs a private `_source/` folder of original images. It is gitignored and not in this repo, so this command only works on the owner's machine. The generated files in `public/media` are committed, so a normal clone can build and deploy without it.

To run the e2e tests against a live site instead of a local build:

```
BASE_URL=https://your-site.pages.dev npx playwright test
```

When `BASE_URL` is set, the local server is skipped.

## Brayden's World

The portfolio is also a small 3D town you walk around (top-down camera, one shared canvas). The outdoor map has the Scouting Office (opens the Box Score), the Hall of Fame, a Press Desk (contact), and a ring of buildings and spots. Doors on a building's south face open its interior. Seven interiors are bespoke: the Gym, the Workshop (projects), HQ Tower (jobs, four floors with an elevator), Civic Center (leadership and community), Campus Quad (college and high school), Hall of Fame (awards and the Critic's Choice mirror) and the Cinema (poster hallway and theater). Every other building opens the generic Exhibit Hall, a row of pedestals, one per exhibit. There are 45 exhibits in all: 24 stations, 7 banners, 13 interests and the contact card. The same content powers the 2D Box Score.

Controls: W A S D or arrow keys to move; E, Enter or Space to open the nearby exhibit; M for the Map (fast travel); `+` / `-`, the mouse wheel or a two-finger pinch to zoom; Escape closes a panel or the Map. Letter keys only act while the world (or the page body) has focus, so typing in a filter never moves the player. On touch devices use the on-screen joystick and the Interact button. `Skip to box score` is the first tab stop.

Routes (hash based, parsed by `src/routing/routes.ts`):

| Hash | Opens |
|---|---|
| `#/` (or empty) | Start screen, then the world; phones, reduced motion, no WebGL or under 4 GB memory get the Box Score with an "Explore Brayden's World" button |
| `#/world` | The outdoor world at the spawn point |
| `#/b/hq-tower/<n>` | HQ Tower floor `n` (1 to 4; `#/b/hq-tower` is floor 1, a bad `n` falls back to floor 1) |
| `#/b/<building-id>` | That building's interior (`#/b/scouting-office` goes to the Box Score; unknown ids fall back to the default view) |
| `#/box-score` | The 2D Box Score |
| `#<exhibit-id>` | The building that holds the exhibit, with its panel open (Box Score: scrolls to the card). Mirrored exhibits keep their home building |
| `#/arena` | Legacy alias, rewritten to `#/b/gym` without a new history entry |

The world code is in `src/world/` (`WorldApp.tsx` shell, `logic/` pure rules, `kit/` shared 3D parts, `world/` the outdoor scene, `interiors/` the bespoke interiors and the generic hall, `ui/` HUD, panel, Map). Content is in `src/content/`.

### Add an interest

1. Append a `Building` to `src/content/buildings.ts` (id, name, sign, district, kind, accent, blurb). Signs use the generic allow-list or start with `Brayden's `; no logos.
2. Append its `Interest` rows to `src/content/interests.ts`, with `building` set to the new id. A long list can point at a collection file (`books.ts`, `films.ts`, ...), registered in `collections.ts`.
3. Add an entry to the `LOTS` table in `src/world/logic/layout.ts` (position and size; spots use a `spot` point, interiors a door on the south face).

An `Interest` (type in `src/content/types.ts`) looks like this; only `detail`, `link`, `collection` and `pos` are optional:

```ts
{
  id: 'speedcubing',            // unique, lowercase, no spaces
  building: 'workshop',         // an existing Building id
  title: 'Speedcubing',
  oneLiner: 'Best 3x3 solve: 24 seconds.',
  detail: 'Optional longer text.',
  link: { label: 'example.com', url: 'https://example.com' }, // https only
},
```

Run `npm test`: the layout, route and content tests check overlaps, reachability and ids. The interior appears automatically in the generic Exhibit Hall, the Map and the Box Score.

### HQ Tower floors and the elevator

HQ Tower has four floors (`src/content/floors.ts`). The floor is part of the URL, so reload, Forward and the Box Score round trip return you to it. Walk onto the elevator pad (or press E while standing on it) to open the Elevator dialog, with Up, Down and a button per floor. An elevator ride replaces the history entry instead of pushing one, so Back always means "leave the building". The south exit on floor 1 is the street door; on floors 2 to 4 it is a stairwell down one floor. Fast travel from the Map to an exhibit on another floor pushes, so Back returns to the floor you came from.

### Add a bespoke interior

1. In `src/content`, author a `pos` for every placement in the building (exhibits stay at least 3 m apart; the ring sits at `pos`, the prop at `[x, z - 1.6]`) and set `bespoke: true` on its `Building`. Add any new sign strings to `SIGN_ALLOW_LIST` in `buildings.ts`.
2. Create `src/world/interiors/<id>/`: `Interior.tsx` (default-exports the scene on top of `InteriorShell`, re-exports `sceneGeometry`), `geometry.ts` (an `InteriorSpec` run through `bespokeGeometry`) and `look.ts` (colours from `theme.accents` only, plus `SIGNS`).
3. Add one registry line to `src/world/interiors/registry.ts`:

```ts
'<building-id>': () => import('./<id>/Interior'),
```

4. Add `src/world/interiors/<id>/Interior.tsx` to `REQUIRED_SCENE_KEYS` in `scripts/check-dist.mjs`.
5. Add `tests/world/interiors/<id>.test.ts` (assert `interiorProblems(sceneGeometry(id))` is `[]`, signs are allow-listed and font-safe) and an e2e spec with a draw-call case.

Every 3D string must go through `toFontSafe` (troika would otherwise fetch glyphs from a CDN). Pictures go through `MediaBoard` and only from `/media/`; a missing image leaves a plain frame. All interiors share one camera view shifted down by a HUD-safe band, so labels in the back row stay clear of the top-left HUD. Keep each interior within the draw-call budget below.

Measured draw calls at 1280x800 (full effects / `?fx=low`): Workshop 92 / 75, HQ Tower floors 1 to 4 60-69 / 43-52, Civic Center 97 / 80, Campus Quad 108 / 91, Hall of Fame 80 / 63, Cinema 72 / 55.

### Budgets and effects mode

Hard limits (the build or the e2e suite fails): initial JS at most 200 KB gzip (three, R3F and zustand are only reachable through dynamic imports), total gzip of `dist/assets` plus `dist/models` under 5 MB, draw calls at most 200 in the world and 150 in each interior, no cross-origin requests (YouTube loads only after a click, from `youtube-nocookie.com`). Chunk targets (warnings only): engine 400 KB, world scene 150 KB, Gym 150 KB, other interiors 120 KB gzip (each Stage 2 interior is under 10 KB).

`?fx=low` (or `VITE_ARENA_FX=low` at build time) drops post-processing and uses device pixel ratio 1. `?fx=full` forces full effects. Without an override the world falls back to low on a slow GPU. Reduced motion removes fades and ambient animation.

E2E: `playwright.config.ts` uses `channel: 'chromium'` so the full Chromium build (software WebGL) runs the world. Projects are `desktop` and `mobile` (Pixel 7). Specs: `e2e/world.spec.ts` (navigation), `e2e/world-perf.spec.ts` (budgets, cross-origin, reduced motion, mobile, tablet), `e2e/world-stage2.spec.ts` (every deep link, mirrors, floors, media failure, all-interior budgets), `e2e/interiors/` (one spec per bespoke interior), `e2e/gym-look.spec.ts`, `e2e/boxscore.spec.ts`.

## 3D models and look

Look tuning (colours, lights, bloom, outline, crowd) lives in `src/world/look/theme.ts`. The Gym has no bloom, so its hardwood stays wood-coloured. `npm run build` and the e2e suite enforce the budgets above.

The player avatar is `public/models/player.glb`, built from CC0 assets by Quaternius: [Universal Base Characters](https://quaternius.itch.io/universal-base-characters) and [Universal Animation Library](https://quaternius.itch.io/universal-animation-library) (both CC0, thank you Quaternius). The raw packs are not in this repo. To rebuild the avatar:

1. Download both packs (the Standard zips) manually from their itch.io pages above.
2. Put the zips in `_source/models/` and unzip them to `_source/models/ubc/` and `_source/models/ual/`.
3. Run `npm run models`, which regenerates `public/models/player.glb`.

If the GLB fails to load, the world falls back to a capsule avatar and stays playable.

## Deploy (Cloudflare Pages)

Connect the repo in Cloudflare Pages with these settings:

- Framework preset: None (or Vite)
- Build command: `npm run build`
- Build output directory: `dist`
- Environment variable: `NODE_VERSION=22`

Optional environment variables:

- `VITE_SITE_URL`: the public URL, used for canonical and social-share tags. Defaults to `https://braydenuglione.pages.dev`.
- `VITE_CF_BEACON_TOKEN`: Cloudflare Web Analytics token. If unset, no analytics script is added.

## Editing content

All copy lives in `src/content/`. No component changes are needed for these edits.

### Edit a station

Stations are in `src/content/stations.ts`. Station ids are used by deep links and by tests, so do not rename them. The tests in `tests/content.test.ts` enforce:

- ids match the agreed roster
- `oneLiner` is at most 90 characters
- at most 3 `bullets`
- every link starts with `https://`
- no phone numbers anywhere

Run `npm test` after editing.

## Privacy rule

Never put phone numbers or private notes in this repo, including in comments and in `public/`. The build runs `scripts/check-dist.mjs`, which fails if:

- a phone-number pattern appears in `dist/`;
- a private term appears in `dist/` text files (and in embedded glTF JSON). Terms come from `src/privacy/privateTerms.mjs`: the `PRIVATE_TERMS` environment variable (comma-separated) if set, otherwise the gitignored file `_source/private-terms.txt` (one term per line, `#` comments). If neither provides any terms, the build prints a warning that the scan was skipped but does not fail;
- the initial JavaScript exceeds 200 KB gzip, or all built assets (`dist/assets` plus `dist/models`) exceed 5 MB gzip in total.

After the checks pass the script deletes `dist/.vite/` so the build manifest is not deployed.
