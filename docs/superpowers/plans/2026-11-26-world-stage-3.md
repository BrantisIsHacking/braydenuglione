# Brayden's World — Stage 3 (Interest Buildings) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic Exhibit Hall in the six remaining interest buildings (Library, Arcade, Record Store / Stage, Playhouse, Fan Shop, Golf clubhouse + 9-hole course) with bespoke low-poly toon interiors, give the culture and sports exteriors their reference-driven look, polish the Chess Park, Park and 5K-loop spots, and make every collection item (books, games, films, teams, artists) reachable from 3D, with every interest deep link landing home.

**Architecture:** Same shape as Stage 2. A foundation wave freezes the shared decisions: `bespoke: true` flags and authored positions in content, the Stage 3 sign strings, golf as a two-floor building (floor 1 clubhouse, floor 2 course, a walk-in pad between them), **collection stops** (builder-owned placements that open a content exhibit's panel focused on one collection item, generalising the Cinema's poster stops), and small kit additions (`StopRings`, `Caption`, `Bulbs`, pure stop/text/bulb helpers). The registry gets all six entries in W0, each pointing at a stub that re-exports the generic hall, so in W1 seven builders work in parallel: six own one interior folder each, the seventh owns the outdoor world folder. A final wave adds cross-building e2e (every interest deep link, collection reachability, golf round trip, budgets), README and the privacy scan.

**Tech Stack:** unchanged — React 18 + TS + Vite 5, R3F 8.18 / drei 9.122 / three 0.187 (troika-three-text 0.52 via drei), `@react-three/postprocessing@2`, Zustand 5, Vitest, Playwright (channel chromium). **No new dependencies.**

**Spec:** `docs/superpowers/specs/2026-11-23-braydens-world-design.md` (binding; Stage 3 = §15 batches 3a/3b/3c, interest buildings §5.6 "Interests" table + signage rule, building kinds §5.4, scene kinds §10, content model §11, art §12, budgets §8, a11y §13, tests §14). Previous plan and its owner amendments (stairs semantics A1, Cinema A2): `docs/superpowers/plans/2026-11-25-world-stage-2.md`. Lessons: `.superpowers/sdd/2026-11-25-world-stage-2/w0-notes.md`.

## Global Constraints

- Privacy: no phone number (`PHONE_PATTERN`), no private term (`loadPrivateTerms`/`findPrivateTerm`; `check-dist` scans built JS/HTML/GLB). The terms file now also lists the reference businesses: **no reference business name, venue name or logo anywhere** (code, comments, commit messages, tests, sign strings, dist). Refer to references only by file name (`_source/refs/<file>.png`). Never quote the terms file. Never write the high-school team nickname on its own. No omitted roles, no health info.
- Reference images are for look only: never copied, traced, embedded or committed; nothing under `_source/` is staged or imported.
- Signage: every 3D sign string is in `SIGN_ALLOW_LIST` (Task 1 adds the exact Stage 3 strings) or matches `^Brayden's `. Generic nouns only; never a real business, venue, school, studio, label, league or team mark.
- Copyrighted art: none. Cabinets, sleeves, jerseys, scarves, playbills and book spines are original flat shapes + colour; the only words on them are titles/names from content (games, artists, teams, the show title) in the kit label font, **never styled after a logo** (no logo-like lettering, colours or outlines imitating a game, album, show or club mark). Book spines carry no text.
- Other 3D text: exhibit labels (via `InteriorMarkers`), the content-derived `TEXT_LINES` each builder exports, hole numbers `1`–`9`, library shelf range labels. No new facts in 3D; any new copy (prompts, HUD) is neutral UI words or first person from content. Every 3D string goes through `toFontSafe`; troika `<Text>` (incl. signs and labels) ≤ **24 per scene** (`TEXT_CAP`); content captions use `Caption` (min font size 0.28 m, the Stage 2 lesson that 0.21 is illegible).
- Palette: only existing `theme.accents` keys; `theme.ts` is **not** edited. Interest accents (spec §12): Library `brick` + `mustard`; Arcade `teal` + `brick` (+ `offWhite`); Record Store `warmGlow` + `brick`; Playhouse `cinemaRed` + `mustard`; Fan Shop `rack` + `scarlet`; Golf `fairway` + `hardwood`. Neutrals: `offWhite`, `ink`, `stone`, `slate`, `path`, `sky`, `water`, `grass`. Toon gradient; outlines only on interactive props (never shells); bloom only on emissive items (`glow`).
- Geometry: boxes, cylinders, spheres, cones from code. No GLB, no image textures (except existing `/media/**` webps via `MediaBoard`, not needed in Stage 3). Instance everything repeated (`ShapeBatch`: one draw call per shape × colour × glow).
- Budgets (hard): initial JS ≤ 200 KB gzip; total gzip `dist/assets/**` + `dist/models/**` < 5 MB. Targets (warn): each interior chunk ≤ 120 KB gzip, world scene chunk ≤ 150 KB.
- Draw calls (whole frame, ReadySignal method): **each interior ≤ 150, full and `?fx=low`, both golf floors; world ≤ 200, full and `?fx=low`**. Interior design target ≤ 120 (room 2 · exit mat 1 · rings ≤ 8 · text ≤ 24 · avatar ≤ 18 · shadow 1 · composer ≤ 15 → props ≤ 50). World target: ≤ W0 baseline + 35.
- Placement rules (unchanged kit): ring at `pos`, prop footprint centre `propAnchor(pos)` = `[x, z − 1.6]`, ≤ 3 × 1.6 m (`propCollider`); larger set pieces are extra colliders; `interiorProblems(geometry) = []` with stops included (stops obey the 3 m ring gap and reachability).
- Room frame: origin south-centre, x ∈ [−W/2, W/2], z ∈ [−L, 0], south wall ≤ 0.6 m, exit trigger `INTERIOR_EXIT`, entrance `INTERIOR_ENTRANCE` `(0, −2, NORTH)`, camera distance 12–18, `cameraSouthPad` 0.5–2 (the shared HUD-safe framing applies to every interior).
- Reduced motion / low power: bulb chase, sign pulse and cabinet glow animation off (`bulbLevel(…, still=true)` = 1); no fades; snap camera.
- Accessibility: Skip link first, then Scouting Office, Map; letter keys only with wrapper/body focus; dialogs focus-trapped, Esc closes, focus returns; touch targets ≥ 44 px; a focused collection item is announced by `aria-current="true"` (never colour alone).
- W1 builders edit **only** their owned paths. A needed change elsewhere (content `pos`, kit bug, allow-list string) is reported to the controller, never made.
- `npm test` and `npx tsc -b` pass at every commit; each task also runs `npm run build`; e2e as each task states. E2E: after `ready()`, wait for `data-transition="idle"` and a settled `data-pose` before pressing keys (stale-key lesson).
- Git: branch `world-stage-3`. Stage explicit paths only; never stage `_source/` or `*.slbk`. Never push. Every commit message ends with a blank line then `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- No same-name-different-case files (Windows).

## Review Focus

1. **Golf round trip loops or traps** — arriving on the course next to its south exit, walking back down to the clubhouse while holding ArrowDown, or spawning on the course pad must not cascade (course → clubhouse → world) or re-trigger the pad; Back always leaves the building; `#/b/golf-clubhouse/3`, `/0`, `/x` land on the clubhouse. (Task 2 routes + history + pad tests; Task 9 e2e; Task 11 e2e)
2. **Stale or wrong collection focus** — open the games panel from the Halo cabinet, close it, then deep-link `#games`, use the Map, or open the Box Score: the item highlight must never leak; a focus that is not in the list (renamed content) highlights nothing and does not throw; a book hidden by an active filter is still shown when focused. (Task 2 store/collection-list tests; Task 11 e2e)
3. **Long titles and the text cap** — `LEGO Star Wars: The Complete Saga`, `Lovers in a Dangerous Spacetime`, `Tyler, The Creator`, en dashes in titles: wrap inside their cabinet/sleeve, stay font-safe, and the scene stays ≤ 24 `<Text>`. (common `text budget` test; Tasks 5, 6 wrap tests; screenshot check)
4. **Low-power and tablet frame cost** — 75 instanced spines + string lights in the Library, 18 glowing cabinets + bulbs in the Arcade, and the new exteriors on the world: within draw-call budgets under `?fx=low` and at 820×1180 touch, with bulbs static under reduced motion. (each W1 e2e; Task 11 tablet cases; Task 3 `bulbLevel` test)
5. **Exterior details blocking doors or spots** — canopies, steps, rails, columns, benches and hedges must not intrude into a door trigger, an exit pose, a spot approach or the e2e lanes, or the world becomes un-walkable. (Task 10 exterior-footprint + layout tests; Stage 1 e2e stays green)

---

## Shared contracts (read by every task)

**Bespoke after Task 1:** the seven existing (`gym`, `workshop`, `hq-tower`, `civic-center`, `campus-quad`, `hall-of-fame`, `cinema`) plus `library`, `arcade`, `record-store`, `playhouse`, `fan-shop`, `golf-clubhouse`. Spots (`chess-park`, `park`, `running-loop`, `mailbox`) stay `kind: 'spot'`, non-bespoke, pos-free (they live in the world scene). After Stage 3 no building uses the generic hall; it stays as the data-only fallback for future interests (spec §11).

**Authored content positions** (Task 1 writes `pos` into `interests.ts`; ring at `pos`, prop at `[x, z − 1.6]`):

| Building (W × L) | Content placement → `pos` | Builder-owned stops (`{ id, pos, focus }`, not content) |
|---|---|---|
| library (22 × 20) | `books` [0, −8] favorites display table | shelf units `books` at [−6.5, −16], [0, −16], [6.5, −16]; focus = first title of each unit |
| arcade (24 × 24) | `rocket-league` [−7.5, −8] (cabinet 0), `fifa` [−4.5, −8] (cabinet 1), `games` [8.5, −3.5] token counter | cabinets 2–17 `games`, focus = game title; cabinet i at `[−7.5 + 3·(i mod 6), −8 − 6·⌊i/6⌋]` |
| record-store (20 × 18) | `music` [−4, −11] crates before the 12-sleeve wall · `karaoke` [5.5, −10] stage + mic | none |
| playhouse (18 × 20) | `stranger-things` [0, −11] playbill easel on the stage apron | none |
| fan-shop (18 × 16) | `teams` [0, −6] checkout counter | jersey wall `teams` [−5, −12] focus `Giants`; scarf wall `teams` [5, −12] focus `Manchester City` |
| golf-clubhouse F1 clubhouse (16 × 12) | `golf` [−4, −7] scorecard board | none |
| golf-clubhouse F2 course (36 × 30) | — | scorecard stand by hole 9: `golf`, no focus (builder picks pos) |

Cinema (done in Stage 2) gains `focus = film.title` on its 12 poster stops (Task 2).

**Collection focus keys** (`collectionKeys(id)`, Task 1): books → `title`, films → `title`, games → `title`, artists → the name, teams → `name`. Keys are unique per collection.

**Golf floors** (`src/content/floors.ts`, Task 1): `'golf-clubhouse': [{ n: 1, name: 'Clubhouse', sign: 'CLUBHOUSE', label: 'Clubhouse' }, { n: 2, name: 'Nine-hole course', sign: '9 HOLES', label: 'Course' }]`. HUD reads `Golf Clubhouse · Course`; HQ keeps `HQ Tower · Floor 3` (no `label`). Course pad on F1: `GOLF_COURSE_PAD = { id: 'course', rect: { x: 0, z: −11.4, w: 2.4, d: 1.2 }, arrival: { x: 0, z: −2, heading: NORTH }, to: 2 }` — walking in rides to F2 (replaceState, like the elevator; no dialog, no prompt). F2's south exit is "stairs down" (amendment A1 semantics) → F1 at `STAIR_LANDING`. Only F1's exit leaves the building. URL `#/b/golf-clubhouse/2` = course.

**Interior sign allow-list changes (exact, Task 1):** add `'FAVORITES'`, `'STAGE'`, `'TOP 12'`, `'BOX OFFICE'`, `'JERSEYS'`, `'SCARVES'`, `'PRO SHOP'`, `'TO THE COURSE'`, `'9 HOLES'`; replace `'5K LOOP'` with `'5K loop'` (spec: the marker reads "5K loop") and set `running-loop.sign = '5K loop'`. Length 36 → **45**. Building-name signs reuse `LIBRARY`, `ARCADE`, `RECORDS`, `PLAYHOUSE`, `FAN SHOP`, `CLUBHOUSE`.

**Owned folder layout (each interior builder):**
```
src/world/interiors/<id>/Interior.tsx   default export Interior(props: InteriorProps); re-exports sceneGeometry
src/world/interiors/<id>/geometry.ts    SPEC (golf: FLOOR_SPECS), STOPS (if any), sceneGeometry(id?, floor?)
src/world/interiors/<id>/look.ts        <ID>_LOOK, SIGNS, SIGN_SPECS, TEXT_LINES (+ pure layout helpers)
src/world/interiors/<id>/scene/*.tsx    set pieces
tests/world/interiors/<id>.test.ts
e2e/interiors/<id>.spec.ts
```

**Screenshots.** `SCRATCH=C:/Users/brant/AppData/Local/Temp/claude/d24ef27a0b9d1701/09458dfb-a726-41dc-87e0-58a0bb1d30fe/scratchpad`. Reuse `$SCRATCH/shot.mjs` from Stage 2 (`node $SCRATCH/shot.mjs <hash> <scene> <name> [floor]`, `PORT` env, 1280×800, `world.started` preset, waits for ready + 1500 ms, writes `$SCRATCH/<name>.png`); Task 1 recreates it per the Stage 2 contract if missing. Every builder's final shot is `$SCRATCH/s3-<name>.png`. Open each PNG with Read and check the task's visual bar.

**Visual bar (all screenshots):** the room/exterior reads at a glance from the entrance view and matches its reference file's layout and feel; exhibit props recognisable; text legible at zoom ×1 and clear of the HUD; no z-fighting; on-palette; **nothing resembles a logo, a real storefront sign, box/album art or a team crest**.

## Parallelism

- **W0a:** Task 1 alone (content, types, registry stubs).
- **W0b (2 in parallel):** Task 2 (runtime: focus, pads, floor labels — `store.ts`, `history.ts`, `WorldApp.tsx`, `useKeyboard.ts`, `scene/Player.tsx`, `logic/{proximity,pads}.ts`, `ui/{Panel,Prompt,InteractButton,Hud,MapDialog}.tsx`, `src/ui/{ExhibitContent,CollectionList}.tsx`, `src/ui/exhibit.css`, `interiors/cinema/geometry.ts`) ∥ Task 3 (kit: `kit/{StopRings,Caption,Bulbs}.tsx`, `logic/{stops,text,bulbs}.ts`, `e2e/helpers.ts`). Disjoint files.
- **W1 (7 in parallel):** Tasks 4–10. Each in its own worktree: `git worktree add ../portfolio-s3-<id> -b s3-<id> world-stage-3`, then link dependencies with a junction whose target uses a **capital `C:`** path (`cmd /c mklink /J C:\Users\brant\OneDrive\Documents\Projects\portfolio-s3-<id>\node_modules C:\Users\brant\OneDrive\Documents\Projects\portfolio\node_modules`) or `npm ci`; if vitest double-loads modules, recreate the junction with `C:` or run `node C:/Users/brant/OneDrive/Documents/Projects/portfolio/node_modules/vitest/vitest.mjs run`. Ports: library 4191, arcade 4192, record-store 4193, playhouse 4194, fan-shop 4195, golf-clubhouse 4196, outdoor 4197 (`npm run build && npx vite preview --port <p>`; `BASE_URL=http://localhost:<p> npx playwright test <spec>`). The controller merges each `s3-<id>` into `world-stage-3`; owned paths are disjoint.
- **W2:** Task 11 (integration e2e + budgets), then Task 12 (README, privacy scan, final verification).

---

### Task 1: Contracts — bespoke flags, positions, golf floors, sign strings, focus types, registry stubs

**Files:**
- Modify: `src/content/interests.ts` (9 `pos`), `src/content/buildings.ts` (6 × `bespoke: true`; `running-loop.sign`; `SIGN_ALLOW_LIST`), `src/content/floors.ts` (golf floors, `label`, `floorLabel`), `src/content/collections.ts` (`collectionKeys`), `src/content/index.ts` (exports), `src/world/types.ts`, `src/world/interiors/registry.ts` (6 entries), `scripts/check-dist.mjs` (`REQUIRED_SCENE_KEYS` + 6)
- Create: stubs `src/world/interiors/{library,arcade,record-store,playhouse,fan-shop,golf-clubhouse}/Interior.tsx` (each exactly `export { default, sceneGeometry } from '../generic/Interior';`)
- Test: `tests/content-model.test.ts`, `tests/world/registry.test.ts`, `tests/check-dist.test.ts`

**Interfaces:**
- Consumes: existing `exhibitsIn`, `floorsOf`, `isFloor`, `getCollection`.
- Produces:
```ts
// content/floors.ts
export type Floor = { n: number; name: string; sign: string; /** HUD/Map text instead of "Floor n" */ label?: string };
export function floorLabel(id: BuildingId, n: number): string;          // label ?? `Floor ${n}`
// content/collections.ts
export function collectionKeys(id: CollectionId): string[];             // focus keys, content order
// world/types.ts
export type PlacedExhibit = { id: string; pos: [number, number]; /** collection key the panel opens on */ focus?: string };
export type Pad = Trigger & { arrival: Pose; /** walk-in pad: ride straight to this floor */ to?: number };
```

- [ ] **Step 1: Write the failing tests** in `tests/content-model.test.ts`:
  - Rename `'stage-2 buildings are bespoke'` → `'bespoke buildings'`: sorted ids = `['arcade','campus-quad','cinema','civic-center','fan-shop','golf-clubhouse','gym','hall-of-fame','hq-tower','library','playhouse','record-store','workshop']`.
  - `it('stage-3 positions match the contract table')`: literal map `{ 'library/books': [0,-8], 'arcade/rocket-league': [-7.5,-8], 'arcade/fifa': [-4.5,-8], 'arcade/games': [8.5,-3.5], 'record-store/music': [-4,-11], 'record-store/karaoke': [5.5,-10], 'playhouse/stranger-things': [0,-11], 'fan-shop/teams': [0,-6], 'golf-clubhouse/golf': [-4,-7] }` equals the map built from `exhibitsIn(b).filter(p => p.pos)` for those six buildings.
  - `floors`: add `floorsOf('golf-clubhouse')` deep-equals the contract; `floorLabel('golf-clubhouse', 2)` = `'Course'`, `floorLabel('hq-tower', 3)` = `'Floor 3'`; `isFloor('golf-clubhouse', 2)` true, `isFloor('golf-clubhouse', 3)` false. Keep the HQ "every floor has a home exhibit" assertion HQ-only.
  - `signs`: `SIGN_ALLOW_LIST` length 45, contains the 9 new strings and `'5K loop'`, does not contain `'5K LOOP'`; `getBuilding('running-loop').sign` = `'5K loop'`; every golf floor sign is in the list.
  - `it('collection keys are unique and complete')`: lengths books 75, films 12, games 18, artists 12, teams 10; `new Set(keys).size === keys.length` each; `collectionKeys('games')[0]` = `'Rocket League'`; `collectionKeys('teams')[4]` = `'Manchester City'`.
  - Existing `'pos is present on a placement iff its building is bespoke'` and `'rings on the same floor are at least 3 m apart'` unchanged (they now cover the new positions).
  - `tests/world/registry.test.ts`: existing "loaders = bespoke ids" now expects 13 keys. `tests/check-dist.test.ts`: `REQUIRED_SCENE_KEYS` contains `src/world/interiors/<id>/Interior.tsx` for the six.
- [ ] **Step 2: Run** `npx vitest run tests/content-model.test.ts tests/world/registry.test.ts tests/check-dist.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement** the content edits, types, six stubs, six registry lines (`library: () => import('./library/Interior')`, …) and check-dist keys. Generic halls ignore `pos`, `focus` and floors.
- [ ] **Step 4: Run** `npm test`, `npx tsc -b`, `npm run build` (six new `interior-<id>` chunk lines, no missing-key warning) — Expected: PASS. `tests/world/interiors/all.test.ts` still passes (its registry check reads the bespoke flags).
- [ ] **Step 5: Screenshot** — confirm `$SCRATCH/shot.mjs` exists (else recreate per Stage 2 contract); `npx vite preview --port 4173`; `node $SCRATCH/shot.mjs '#/b/arcade' arcade s3-t1-arcade-generic`. Check: generic hall with 3 pedestals, unchanged look.
- [ ] **Step 6: Commit**
```bash
git add src/content/interests.ts src/content/buildings.ts src/content/floors.ts src/content/collections.ts src/content/index.ts src/world/types.ts src/world/interiors/registry.ts src/world/interiors/library/Interior.tsx src/world/interiors/arcade/Interior.tsx src/world/interiors/record-store/Interior.tsx src/world/interiors/playhouse/Interior.tsx src/world/interiors/fan-shop/Interior.tsx src/world/interiors/golf-clubhouse/Interior.tsx scripts/check-dist.mjs tests/content-model.test.ts tests/world/registry.test.ts tests/check-dist.test.ts
git commit -m "feat(content): stage 3 contracts — bespoke interest buildings, positions, golf floors, signs, focus types

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 2: Runtime — collection focus, walk-in pads, floor labels

**Files:**
- Modify: `src/world/logic/proximity.ts`, `src/world/scene/Player.tsx`, `src/world/store.ts`, `src/world/useKeyboard.ts`, `src/world/history.ts`, `src/world/WorldApp.tsx`, `src/world/ui/{Panel,Prompt,InteractButton,Hud,MapDialog}.tsx`, `src/ui/ExhibitContent.tsx`, `src/ui/CollectionList.tsx`, `src/ui/exhibit.css`, `src/world/interiors/cinema/geometry.ts`
- Create: `src/world/logic/pads.ts`
- Test: `tests/world/proximity.test.ts`, `tests/world/player-frame.test.ts`, `tests/world/store.test.ts`, `tests/world/history.test.ts`, `tests/routes.test.ts`, `tests/ui/world-keyboard.test.tsx`, `tests/ui/world-prompt.test.tsx`, `tests/ui/world-hud.test.tsx`, `tests/world/interiors/cinema.test.ts`; create `tests/world/pads.test.ts`, `tests/ui/collection-focus.test.tsx`

**Interfaces:**
- Consumes: Task 1 `PlacedExhibit.focus`, `Pad.to`, `floorLabel`, `collectionKeys`.
- Produces:
```ts
// logic/proximity.ts
export function nearest(p, list: readonly Placed[]): { id: string; dist: number; focus?: string } | null; // Placed gains focus?
// scene/Player.tsx
PlayerFrame.nearFocus: string | null;                    // focus of the in-reach placement, else null
// store.ts
nearFocus: string | null; activeFocus: string | null;
setProximity(nearestId: string | null, nearId: string | null, nearFocus?: string | null): void;
activate(id: string, focus?: string | null): void; openPanel(id: string, focus?: string | null): void; // activeFocus = focus ?? null; closePanel and go() clear it
// logic/pads.ts
export type PadAction = { kind: 'ride'; floor: number; padId: string } | { kind: 'elevator' } | null;
export function padAction(pads: readonly Pad[], id: string): PadAction;   // pad.to set → ride; id 'elevator' → elevator; else null
// history.ts
ride(floor: number, opts?: { stairs?: boolean; padId?: string }): void;   // arrival from pads.find(p => p.id === (opts.padId ?? 'elevator'))
// ui
export function titleSortKey(t: string): string;          // exported from src/ui/CollectionList.tsx (was private sortKey)
CollectionList({ id, items?, focus?: string | null });     // focused <li>: aria-current="true", class collection__item--focus, scrollIntoView({ block: 'center' }); books: filter reset to ''
ExhibitContent({ exhibit, headingLevel, focus?: string | null });
```

- [ ] **Step 1: Write the failing tests**
  - proximity: `nearest({x:0,z:0}, [{id:'games',pos:[0,-1],focus:'Halo'},{id:'games',pos:[0,-5],focus:'Halo 2'}])` → `{ id: 'games', dist: 1, focus: 'Halo' }`.
  - player-frame: geometry exhibits `[{ id: 'games', pos: [0, -5], focus: 'Halo' }]`, pose (0, −3.5) → `nearId 'games'`, `nearFocus 'Halo'`; pose (0, 0) → both null.
  - store: `openPanel('games', 'Halo')` → `activeFocus 'Halo'`; `closePanel()` → null; `openPanel('games')` → null; `go(...)` clears it; `setProximity` idempotent incl. focus.
  - keyboard: `nearId 'games'`, `nearFocus 'Halo'`, `KeyE` → `activeId 'games'`, `activeFocus 'Halo'`.
  - prompt: `nearId 'games'`, `nearFocus 'Halo'` → `Press E — Arcade cabinets: Halo`; touch `Tap to open — Arcade cabinets: Halo`; Interact button `aria-label="Open Arcade cabinets: Halo"`; click → `activeFocus 'Halo'`. No focus → unchanged strings.
  - collection-focus (`tests/ui/collection-focus.test.tsx`, mock `Element.prototype.scrollIntoView`): `<CollectionList id="games" focus="Halo" />` → exactly one `[aria-current="true"]`, text `Halo`, scrollIntoView called once; `focus="Nope"` → none, no throw; books: type `xyz` in the filter, rerender with `focus="1984"` → filter value `''`, the `1984` item has `aria-current`; no `focus` → no `aria-current` (Box Score path). Panel with `activeId 'games'`, `activeFocus 'Halo'` → dialog contains the current item.
  - history: panel open with focus writes `replaceState('#games')` (focus never in the URL); popstate/hash `#games` while open with focus → `activeFocus` null.
  - pads: `padAction([GOLF_COURSE_PAD], 'course')` = `{ kind: 'ride', floor: 2, padId: 'course' }`; `padAction(hqPads, 'elevator')` = `{ kind: 'elevator' }`; unknown id → null.
  - history ride: on `#/b/golf-clubhouse` with geometry pads `[GOLF_COURSE_PAD]` (literal in the test), `ride(2, { padId: 'course' })` → one `replaceState('#/b/golf-clubhouse/2')`, zero pushes, pending pose `{ x: 0, z: -2, heading: NORTH }`; then on floor 2 `exit()` → `replaceState('#/b/golf-clubhouse')`, pose `STAIR_LANDING`; on floor 1 `exit()` → push `#/world`. HQ elevator ride behaviour unchanged (existing tests).
  - routes: `'#/b/golf-clubhouse/2'` → floor 2; `/3`, `/0`, `/x` → no `floor` key.
  - hud: golf floor 2 → `Golf Clubhouse · Course`; floor 1 → `Golf Clubhouse · Clubhouse`; HQ floor 3 → `HQ Tower · Floor 3`. Map: HQ button names still contain `Floor 3` (via `floorLabel`).
  - cinema: `sceneGeometry('cinema').exhibits.slice(0, 12).map(e => e.focus)` = `films.map(f => f.title)`; screen stop has no `focus`.
- [ ] **Step 2: Run** `npm test` — Expected: new cases FAIL.
- [ ] **Step 3: Implement.** Player writes `st.setProximity(f.nearestId, f.nearId, f.nearFocus)`; keyboard/Prompt/Interact call `activate(nearId, nearFocus)`. WorldApp `onPad = id => { const a = padAction(geometry.pads ?? [], id); a?.kind === 'ride' ? nav.ride(a.floor, { padId: a.padId }) : a?.kind === 'elevator' && openElevator() }` (`nav.ride` forwards opts). Panel passes `activeFocus` to `ExhibitContent` → `CollectionList`. Hud/MapDialog use `floorLabel`. Cinema `stops()` adds `focus: p.film.title`. CSS: `.collection__item--focus` = scarlet left border 4 px + bold (not colour alone; `aria-current` carries meaning).
- [ ] **Step 4: Run** `npm test`, `npx tsc -b`, `npm run build`, `npm run e2e` — Expected: all PASS (Stage 1/2 e2e unchanged).
- [ ] **Step 5: Screenshot** — Cinema poster focus: a scratch Playwright step walks to the `Cars` poster stop and presses `e`; save `$SCRATCH/s3-t2-cinema-focus.png`. Check: films list visible with `Cars` highlighted and scrolled into view.
- [ ] **Step 6: Commit** the listed files: `feat(world): collection focus from stops, walk-in floor pads, floor labels` + trailer.

### Task 3: Kit — stop rings, captions, bulbs, stop/text helpers, e2e walk helper

**Files:**
- Create: `src/world/kit/StopRings.tsx`, `src/world/kit/Caption.tsx`, `src/world/kit/Bulbs.tsx`, `src/world/logic/stops.ts`, `src/world/logic/text.ts`, `src/world/logic/bulbs.ts`
- Modify: `e2e/helpers.ts`
- Test: create `tests/world/stops.test.ts`, `tests/world/text-bulbs.test.ts`

**Interfaces:**
- Consumes: Task 1 `PlacedExhibit.focus`, `collectionKeys`; existing `instanceMatrices`, `materials.accent`/`accentHot`, `playerPose`, `REACH_INTERIOR_M`, `toFontSafe`, label font.
- Produces:
```ts
// logic/stops.ts
export function withStops(base: SceneGeometry, stops: readonly PlacedExhibit[]): SceneGeometry; // exhibits = [...base.exhibits, ...stops]
export function hotStop(stops: readonly PlacedExhibit[], p: { x: number; z: number }, reach = REACH_INTERIOR_M): number; // index or -1
export function uncovered(id: CollectionId, focuses: readonly (string | undefined)[], extra?: readonly string[]): string[]; // keys no stop/extra covers
// logic/text.ts
export const TEXT_CAP = 24;
export function textCount(c: { signs: number; lines: number; labelled: number }): number; // signs + lines + min(6, labelled)
// logic/bulbs.ts
export function bulbLevel(i: number, t: number, still: boolean): number; // still → 1; else chase, period 3 bulbs, 0.4 s step, range [0.25, 1]
// kit
export function StopRings(p: { stops: readonly PlacedExhibit[]; reducedMotion: boolean }): JSX.Element;  // 1 instanced ring layer + 1 hot ring (hotStop); no labels
export const CAPTION_MIN = 0.28; export function captionSize(size: number): number; // max(size, CAPTION_MIN)
export function Caption(p: { text: string; position: [number, number, number]; rotationY?: number; size: number; maxWidth?: number; color?: ThemeColorKey; outline?: boolean }): JSX.Element; // one troika Text, toFontSafe, label font, centred
export function Bulbs(p: { items: readonly InstanceItem[]; color: ThemeColorKey; still: boolean }): JSX.Element | null; // 1 instanced sphere mesh, per-instance colour from bulbLevel; no useFrame work when still
// e2e/helpers.ts
export async function settle(page: Page): Promise<void>;            // data-transition idle + two equal data-pose reads 200 ms apart
export async function walkTo(page: Page, x: number, z: number, tol = 0.35): Promise<void>; // holdUntil on x, then z (Arrow keys)
```

- [ ] **Step 1: Write the failing tests**
  - stops: `withStops(g, [{ id: 'games', pos: [1, -9], focus: 'Halo' }]).exhibits` = `[...g.exhibits, that stop]` and other fields equal; `hotStop([{id:'a',pos:[1,-9]}], {x:1,z:-7.5})` = 0, `{x:1,z:-5}` = −1; `uncovered('games', ['Fortnite', ...14 others], ['Rocket League','FIFA'])` lists exactly the missing title; `uncovered('teams', ['Giants'])` has 9 entries.
  - text: `textCount({ signs: 1, lines: 18, labelled: 3 })` = 22; `labelled: 9` counts 6; `TEXT_CAP` = 24.
  - bulbs: `bulbLevel(i, t, true)` = 1 for i 0..5, t ∈ {0, 0.3, 7}; `bulbLevel(i, t, false) === bulbLevel(i + 3, t, false)`; values within [0.25, 1]; `bulbLevel(0, 0, false) !== bulbLevel(0, 0.4, false)`.
  - caption: `captionSize(0.2)` = 0.28, `captionSize(0.4)` = 0.4.
- [ ] **Step 2: Run** `npx vitest run tests/world/stops.test.ts tests/world/text-bulbs.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement.** `StopRings` follows the Cinema `PosterRings` pattern (ring 0.75–0.9 m) driven by `hotStop`; reduced motion → no hot-ring scale pulse. `Bulbs` uses `instanceColor` scaled by `bulbLevel`, `glow 1.4`, `toneMapped false`; `still` = reduced motion or low-power fx. Cinema is not migrated (out of scope).
- [ ] **Step 4: Run** `npm test`, `npx tsc -b`, `npm run build`, `npm run e2e` — Expected: PASS.
- [ ] **Step 5: World baseline** — run `npx playwright test e2e/world-perf.spec.ts -g "world"` and record `draw calls world full: N / low: M` in `.superpowers/sdd/2026-11-26-world-stage-3/w0-notes.md` (controller notes, not committed); Task 10's target is `N + 35`.
- [ ] **Step 6: Commit** the listed files: `feat(world): stop rings, captions, bulbs and stop/text helpers` + trailer.

---

**W1 common steps (Tasks 4–9, interiors).** Written once; each task gives only its specifics.

- **Unit test** `tests/world/interiors/<id>.test.ts`:
  - `it('geometry is valid')`: `interiorProblems(sceneGeometry('<id>'))` = `[]` (golf: floors 1 and 2).
  - `it('places its content exhibits at their positions, then its stops')`: `sceneGeometry('<id>').exhibits` = `[...placedIn('<id>'[, floor]), ...STOPS]` (golf: per floor).
  - `it('camera')`: `cameraDistance` / `cameraSouthPad` equal `SPEC` values (12–18, 0.5–2).
  - `it('signs')`: every `SIGNS` string ∈ `SIGN_ALLOW_LIST` and `isFontSafe`; every `SIGN_SPECS[i].text` ∈ `SIGNS`.
  - `it('3D text is content-derived')`: `TEXT_LINES` equals the exact function of content named in the task; all `isFontSafe(toFontSafe(line))`.
  - `it('text budget')`: `textCount({ signs: SIGN_SPECS.length, lines: TEXT_LINES.length, labelled: placedIn('<id>').length }) <= TEXT_CAP`.
  - `it('stops focus real items')` (when `STOPS` exist): every stop id is a content exhibit homed in this building, every `focus` ∈ `collectionKeys(...)` of that exhibit's collection, and the task's coverage assertion holds.
- **E2E** `e2e/interiors/<id>.spec.ts` (desktop; `world.started` preset; `settle(page)` after every `ready`):
  - `draw calls (full|low) <= 150` for `/#/b/<id>` and `/?fx=low#/b/<id>` (golf: also `/2`), log the number, `> 1`, no console errors.
  - `every content exhibit deep link opens its panel here`: `/#<interest>` → `ready`, dialog named by title, pose within 0.3 m of `inFront(pos)`.
  - `walk in to the first prompt`: `walkTo` the first content exhibit's standing spot → `[data-testid=prompt]` `data-exhibit` = it; `e` → dialog.
  - `a stop opens its item` (when stops exist): `walkTo` the named stop's `inFront` → `e` → dialog, `[aria-current="true"]` text = the stop's focus.
  - `walk out`: from the entrance hold `ArrowDown` → `world`, pose ≈ `exitPose('<id>')` within 0.3 (library (−36, −7), arcade (−24, 34.5), record-store (−34, 22.5), playhouse (−20, −7.5), fan-shop (38, −7.5), golf-clubhouse (28, 26.5)); 1500 ms later still `world`.
- **Run order:** Step 1 tests → `npx vitest run tests/world/interiors/<id>.test.ts` FAIL → implement → PASS + `npm test` + `npx tsc -b` → `npm run build` (`chunk interior-<id>` ≤ 120 KB, no new warnings) → e2e on the task's port → screenshot `$SCRATCH/s3-<id>.png` → commit owned paths only (`git add src/world/interiors/<id> tests/world/interiors/<id>.test.ts e2e/interiors/<id>.spec.ts`).

### Task 4: Library (ref: `_source/refs/library-interior.png`)

**Files:** Replace `src/world/interiors/library/Interior.tsx`; create `src/world/interiors/library/{geometry.ts,look.ts}`, `src/world/interiors/library/scene/{Shelves,Spines,FavoritesTable,Reading,StringLights}.tsx`; tests `tests/world/interiors/library.test.ts`, `e2e/interiors/library.spec.ts`.

**Interfaces:** Consumes Task 1 positions, Task 2 `titleSortKey`, Task 3 `StopRings`, `Caption`, `withStops`, `uncovered`, kit `InteriorShell`, `ShapeBatch`. Produces `SPEC` (`width 22, length 20`, camera 15), `SHELF = { units: 3, shelves: 4, innerW: 2.4, height: 2.6, pitch: 0.6, xs: [-6.5, 0, 6.5], z: -17.6 }`, `shelfLayout(list?: readonly Book[]): Spine[]` (`Spine = { title; unit: 0|1|2; shelf: 0..3; x; y; z; w; h; color: ThemeColorKey }`), `unitRanges(): { unit; first: string; last: string; label: string }[]`, `favoriteTitles(): string[]`, `STOPS` (3 unit stops), `SIGNS = ['LIBRARY', 'FAVORITES']`, `TEXT_LINES = [...unitRanges().map(r => r.label), ...favoriteTitles()]`, `LIBRARY_LOOK`.

- [ ] **Step 1: Tests** per W1 common steps, plus:
  - `it('every book is on a shelf exactly once')`: `shelfLayout().map(s => s.title).sort()` = `books.map(b => b.title).sort()` (75, favorites included).
  - `it('shelves are alphabetical by unit and fit')`: units hold contiguous runs of `books` sorted by `titleSortKey`, 25 per unit; per (unit, shelf) the summed `w` + 0.02 gaps ≤ `SHELF.innerW`; every spine `w` ∈ [0.18, 0.30], `h` ∈ [0.36, 0.5], colour ∈ `['brick','mustard','teal','slate','sky']`; `shelfLayout()` deep-equals a second call (deterministic, no `Math.random`).
  - `it('unit stops focus the first book of each unit')`: `STOPS.map(s => s.focus)` = `unitRanges().map(r => r.first)`; `label` = first sort-letter `–` last sort-letter, uppercase, digits shown as `#`.
  - `it('favorites are the content favorites')`: `favoriteTitles()` = `['Pride and Prejudice', 'The Invisible Life of Addie LaRue', 'Feed', '1984']`.
- [ ] **Step 2: Room.** Floor `slate` (gray carpet) with a `stone` instanced diamond pattern, walls `offWhite`, wallHeight 3.4. `LIBRARY` sign north wall `[0, 3.0, -19.85]` board `brick`; `FAVORITES` on the table front, size 0.35, board `mustard`.
- [ ] **Step 3: Props.** `Shelves`: three tall white units at `SHELF.xs` (one `offWhite` `ShapeBatch` for frames + boards), one `propCollider` each (2.8 × 0.6), range label `Caption` (size 0.3) on each unit's top board. `Spines`: all 75 from `shelfLayout()` as ≤ 5 `ShapeBatch` calls, no text. `FavoritesTable` (`books`): `hardwood` table 2.4 × 1.0, four standing books (one per favorite, `brick`/`mustard`) each with a `Caption` title card (size 0.28, maxWidth 0.9); outline on the table. `Reading`: instanced `mustard` armchairs (seat + back + arms) in two clusters west and east (x ±8, z −5…−11), `hardwood` wooden chairs and two small side tables, two floor lamps (`slate` pole, `warmGlow` shade, glow 0.8); colliders per cluster. `StringLights`: instanced `warmGlow` spheres (glow 1.0, static) strung along the shelf tops. `StopRings` for the 3 unit stops.
- [ ] **Step 4: Run** unit, tsc, build, e2e (port 4191; stop case: middle unit → `aria-current` = `STOPS[1].focus`) — Expected: PASS, draw calls ≤ 150 full and low.
- [ ] **Step 5: Screenshot** `PORT=4191 node $SCRATCH/shot.mjs '#/b/library' library s3-library`; visual bar + tall white shelves visibly full of coloured spines, mustard armchairs, warm string lights.
- [ ] **Step 6: Commit** owned paths: `feat(world): bespoke Library — every book shelved, favorites table, shelf stops` + trailer.

### Task 5: Arcade (refs: `_source/refs/arcade-interior.png`, `_source/refs/arcade-game-vault.png`)

**Files:** Replace `src/world/interiors/arcade/Interior.tsx`; create `src/world/interiors/arcade/{geometry.ts,look.ts}`, `src/world/interiors/arcade/scene/{Floor,Cabinets,Marquees,TokenCounter,CeilingBulbs}.tsx`; tests `tests/world/interiors/arcade.test.ts`, `e2e/interiors/arcade.spec.ts`.

**Interfaces:** Consumes Task 1 positions, Task 3 `StopRings`, `Caption`, `Bulbs`, `withStops`, `uncovered`. Produces `SPEC` (`width 24, length 24`, camera 15), `CAB = { cols: 6, x0: -7.5, pitch: 3, rows: [-8, -14, -20], w: 1.2, d: 0.9, h: 2.0 }`, `cabinetSlot(i: number): [number, number]`, `CABINET_COLORS: readonly ThemeColorKey[]` (cycle of `teal`, `brick`, `offWhite`, `ink`), `STOPS` (cabinets 2–17), `SIGNS = ['ARCADE']`, `TEXT_LINES = games.map(g => g.title)`, `ARCADE_LOOK`.

- [ ] **Step 1: Tests** per W1 common steps, plus:
  - `it('one cabinet per game in content order')`: 18 slots; `cabinetSlot(0)` = `[-7.5, -8]` (= `rocket-league` pos), `cabinetSlot(1)` = `[-4.5, -8]` (= `fifa` pos), `cabinetSlot(17)` = `[7.5, -20]`; `STOPS[k]` = `{ id: 'games', pos: cabinetSlot(k + 2), focus: games[k + 2].title }`.
  - `it('every game is reachable')`: `uncovered('games', STOPS.map(s => s.focus), ['Rocket League', 'FIFA'])` = `[]`.
  - `it('long titles wrap inside the marquee')`: every title is rendered with `maxWidth` = `CAB.w - 0.1` (exported `MARQUEE.maxWidth`) and `captionSize(MARQUEE.size) >= 0.28`.
  - `it('text budget')` evaluates to 22 (1 sign + 18 marquees + 3 labels).
- [ ] **Step 2: Room.** Blue/white checkered floor from instanced `teal` / `offWhite` 1.5 m tiles (2 calls), walls `brick` lower band + `offWhite` upper (dado strip), wallHeight 4. `ARCADE` sign north wall `[0, 3.4, -23.85]`, board `ink` (neon look comes from the board glow edge, a `teal` `ShapeBatch` strip, glow 1.2).
- [ ] **Step 3: Props.** `Cabinets`: 18 cabinets facing south (body box by `CABINET_COLORS[i % 4]`, `ink` bezel, `teal` screen glow 1.0, instanced stick + 2 buttons), one collider each (`propCollider(slot, 1.2, 0.9)`), outline on the cabinet bodies. `Marquees`: a lit `offWhite` header box (glow 0.6) per cabinet with its title `Caption` (size 0.3, `ink`, `maxWidth` 1.1). Cabinet art = title + flat colour only. `TokenCounter` (`games`): `brick` counter 2.4 × 1.0 with a `teal` glass top and instanced `mustard` token stacks. `CeilingBulbs`: `Bulbs` along the north and side walls (`warmGlow`, `still` = reduced motion or fx low). `StopRings` for the 16 stops.
- [ ] **Step 4: Run** unit, tsc, build, e2e (port 4192; stop case: `Halo` cabinet `cabinetSlot(11)`; also `/#rocket-league` opens `Rocket League` at cabinet 0) — Expected: PASS, draw calls ≤ 150 full and low.
- [ ] **Step 5: Screenshot** `PORT=4192 node $SCRATCH/shot.mjs '#/b/arcade' arcade s3-arcade`; visual bar + checkered floor, glowing cabinets, every marquee title readable, no art beyond colour.
- [ ] **Step 6: Commit** owned paths: `feat(world): bespoke Arcade — one cabinet per game` + trailer.

### Task 6: Record Store / Stage

**Files:** Replace `src/world/interiors/record-store/Interior.tsx`; create `src/world/interiors/record-store/{geometry.ts,look.ts}`, `src/world/interiors/record-store/scene/{SleeveWall,Crates,Counter,Stage}.tsx`; tests `tests/world/interiors/record-store.test.ts`, `e2e/interiors/record-store.spec.ts`.

**Interfaces:** Consumes Task 1 positions, Task 3 `Caption`, kit. Produces `SPEC` (`width 20, length 18`, camera 14), `SLEEVES = { cols: 6, size: 1.1, pitch: 1.35, x0: -7.4, ys: [2.6, 1.3], z: -17.85 }`, `sleeveLines(list?: readonly string[]): string[]` (`` `${i + 1}\n${name}` ``), `SIGNS = ['RECORDS', 'TOP 12', 'STAGE']`, `TEXT_LINES = sleeveLines()`, `RECORD_LOOK`.

- [ ] **Step 1: Tests** per W1 common steps, plus `it('sleeves are the top 12 in order')`: `sleeveLines()` has 12 entries, `[0]` = `'1\nDrake'`, `[8]` = `'9\nTyler, The Creator'`, `[11]` = `'12\nTame Impala'`; sleeve i sits at column `i % 6`, row `⌊i/6⌋` (ranks 1–6 on the top row).
- [ ] **Step 2: Room.** Floor `hardwood`, walls `brick` with a `warmGlow` neon strip (glow 1.0, static), wallHeight 3.6. `RECORDS` sign above the sleeve wall, `TOP 12` small sign left of it, `STAGE` above the stage (board `ink`).
- [ ] **Step 3: Props.** `SleeveWall`: 12 square sleeves on the north wall, flat colour blocks (`brick`, `mustard`, `teal`, `slate`, `offWhite` cycle) with an original stylised disc shape (sphere segment) and the `sleeveLines` `Caption` (size 0.28, maxWidth 1.0) — no album art. `Crates` (`music`): two instanced wooden crate rows (`hardwood`) of record edges (thin `ink` boxes) at `propAnchor([-4, -11])`, outlined. `Counter`: listening counter with a turntable (cylinder + tonearm box). `Stage` (`karaoke`): raised `ink` platform x 2.5…9.5, z −13…−17.5 (extra collider), mic stand (thin cylinder + sphere) at `propAnchor([5.5, -10])`, two speaker boxes, a `warmGlow` lyric screen (glow, no text).
- [ ] **Step 4: Run** unit, tsc, build, e2e (port 4193; deep links `#music`, `#karaoke`) — Expected: PASS.
- [ ] **Step 5: Screenshot** `PORT=4193 node $SCRATCH/shot.mjs '#/b/record-store' record-store s3-record-store`; visual bar + all 12 ranks/names legible.
- [ ] **Step 6: Commit** owned paths: `feat(world): bespoke Record Store with sleeve wall and karaoke stage` + trailer.

### Task 7: Playhouse

**Files:** Replace `src/world/interiors/playhouse/Interior.tsx`; create `src/world/interiors/playhouse/{geometry.ts,look.ts}`, `src/world/interiors/playhouse/scene/{Stage,Curtain,Seats,Marquee,Playbill}.tsx`; tests `tests/world/interiors/playhouse.test.ts`, `e2e/interiors/playhouse.spec.ts`.

**Interfaces:** Consumes Task 1 positions, Task 3 `Caption`, `Bulbs`, kit. Produces `SPEC` (`width 18, length 20`, camera 14), `showTitle(): string` (= `getExhibit('stranger-things').title`), `SIGNS = ['PLAYHOUSE', 'BOX OFFICE']`, `TEXT_LINES = [showTitle(), showTitle()]` (marquee + playbill cover), `PLAYHOUSE_LOOK`.

- [ ] **Step 1: Tests** per W1 common steps, plus `it('marquee and playbill show the content title')`: `TEXT_LINES` = `['Stranger Things on Broadway', 'Stranger Things on Broadway']`; `it('centre aisle is clear')`: no collider intersects `{ x: 0, z: -6, w: 2.4, d: 8 }`.
- [ ] **Step 2: Room.** Floor `cinemaRed` carpet with `ink` aisle runner, walls `ink` with `mustard` pilasters (instanced), wallHeight 5. Stage platform z −13.5…−20, h 0.6 (collider), proscenium arch (`mustard` boxes), `BOX OFFICE` sign by the entrance west wall (`rotationY π/2`), `PLAYHOUSE` low on the south wall.
- [ ] **Step 3: Props.** `Curtain`: red curtain (`cinemaRed` instanced vertical folds) half drawn, `ink` backdrop. `Marquee`: a marquee board above the proscenium with `Caption` show title (size 0.4, `ink` on `offWhite`, kit font, no show-logo styling) framed by `Bulbs` (`warmGlow`). `Seats`: 3 rows × 2 sides (x 1.6…7) instanced `cinemaRed` seats, colliders per side. `Playbill` (`stranger-things`): an easel at `propAnchor([0, -11])` with an `offWhite` playbill (`mustard` header band + `Caption` title, size 0.28, maxWidth 1.0), outlined. `TEXT_LINES` in that order.
- [ ] **Step 4: Run** unit, tsc, build, e2e (port 4194) — Expected: PASS.
- [ ] **Step 5: Screenshot** `PORT=4194 node $SCRATCH/shot.mjs '#/b/playhouse' playhouse s3-playhouse`; visual bar + marquee, red curtain, stage read at a glance; title not logo-styled.
- [ ] **Step 6: Commit** owned paths: `feat(world): bespoke Playhouse — marquee, curtain, stage, playbill` + trailer.

### Task 8: Fan Shop

**Files:** Replace `src/world/interiors/fan-shop/Interior.tsx`; create `src/world/interiors/fan-shop/{geometry.ts,look.ts}`, `src/world/interiors/fan-shop/scene/{JerseyRack,ScarfWall,Counter,Dressing}.tsx`; tests `tests/world/interiors/fan-shop.test.ts`, `e2e/interiors/fan-shop.spec.ts`.

**Interfaces:** Consumes Task 1 positions, Task 3 `StopRings`, `Caption`, `uncovered`. Produces `SPEC` (`width 18, length 16`, camera 14), `jerseyTeams(): Team[]` (non-soccer, content order), `scarfTeams(): Team[]` (soccer), `STOPS = [{ id: 'teams', pos: [-5, -12], focus: 'Giants' }, { id: 'teams', pos: [5, -12], focus: 'Manchester City' }]`, `SIGNS = ['FAN SHOP', 'JERSEYS', 'SCARVES']`, `TEXT_LINES = [...jerseyTeams(), ...scarfTeams()].map(t => t.name)`, `FAN_LOOK`.

- [ ] **Step 1: Tests** per W1 common steps, plus `it('racks hold every team')`: `jerseyTeams().map(t => t.name)` = `['Giants', 'Knicks', 'Yankees', 'Rangers']`, `scarfTeams()` length 6 starting `Manchester City`; `TEXT_LINES` length 10; `it('garment colours are palette, not team kits')`: every garment colour ∈ `['rack','scarlet','offWhite','ink','slate','sky']`.
- [ ] **Step 2: Room.** Floor `stone`, walls `offWhite`, `rack`-grey fixtures, wallHeight 3.4. `FAN SHOP` sign north wall; `JERSEYS` over the west rack, `SCARVES` over the east wall (board `rack`).
- [ ] **Step 3: Props.** `JerseyRack` (stop 1): a `rack` rail at `propAnchor([-5, -12])` with 4 hanging jerseys (box torso + sleeves, palette colours) each with a name `Caption` (size 0.28) on the chest. `ScarfWall` (stop 2): 6 long thin scarves hung on the north-east wall with name `Caption`s along each scarf. `Counter` (`teams`): checkout counter at `propAnchor([0, -6])`, outlined. `Dressing`: folded-shirt tables, a cap rack (instanced cones/cylinders). No crests, numbers or marks. `StopRings` for the 2 stops.
- [ ] **Step 4: Run** unit, tsc, build, e2e (port 4195; stop case: scarf wall → `aria-current` `Manchester City`) — Expected: PASS.
- [ ] **Step 5: Screenshot** `PORT=4195 node $SCRATCH/shot.mjs '#/b/fan-shop' fan-shop s3-fan-shop`; visual bar + names readable, no crest-like shapes.
- [ ] **Step 6: Commit** owned paths: `feat(world): bespoke Fan Shop — jersey rack and scarf wall` + trailer.

### Task 9: Golf — clubhouse and 9-hole course

**Files:** Replace `src/world/interiors/golf-clubhouse/Interior.tsx`; create `src/world/interiors/golf-clubhouse/{geometry.ts,look.ts}`, `src/world/interiors/golf-clubhouse/scene/{Clubhouse,Scorecard,CourseDoor,Course,Holes,Flags}.tsx`; tests `tests/world/interiors/golf-clubhouse.test.ts`, `e2e/interiors/golf-clubhouse.spec.ts`.

**Interfaces:** Consumes Task 1 golf floors + `Pad.to`, Task 2 pad ride (`padAction`, `ride(floor, { padId })`, `floorLabel`, `ready(page, scene, floor)`), Task 3 kit. Produces `GOLF_COURSE_PAD: Pad` (contract values), `FLOOR_SPECS: Record<1 | 2, InteriorSpec>` (F1 `16 × 12`, pads `[GOLF_COURSE_PAD]`; F2 `36 × 30`, entrance `GOLF_COURSE_PAD.arrival`, camera 18), `HOLES: Hole[]` (`Hole = { n: 1..9; tee: [number, number]; cup: [number, number]; cell: Rect }`), `COURSE_STOPS` (one `golf` scorecard stop near hole 9, no focus), `sceneGeometry(id?: BuildingId | null, floor?: number): SceneGeometry` (invalid/undefined floor → 1; `floor` always set), `SIGNS = ['CLUBHOUSE', 'PRO SHOP', 'TO THE COURSE', '9 HOLES']`, `TEXT_LINES = HOLES.map(h => String(h.n))`, `GOLF_LOOK`.

- [ ] **Step 1: Tests** per W1 common steps (both floors), plus:
  - `it('floor argument')`: `sceneGeometry('golf-clubhouse', 7).floor` = 1, `sceneGeometry('golf-clubhouse').floor` = 1, `sceneGeometry('golf-clubhouse', 2).exhibits` = `COURSE_STOPS`; F1 `pads` = `[GOLF_COURSE_PAD]`, F2 has no pads; F2 entrance = `GOLF_COURSE_PAD.arrival`.
  - `it('nine holes snake through the course')`: 9 holes numbered 1–9; cells 3 × 3, serpentine (hole n+1's cell shares an edge with hole n's); every tee and cup inside bounds, ≥ `PLAYER_R` from colliders, all reachable from the F2 entrance (`reachable`); hole 1 tee nearest the entrance.
  - `it('the course door is clear')`: the pad rect is inside F1 bounds, `STAIR_LANDING` (0, −2) clear of colliders on both floors, no collider intersects `{ x: 0, z: -7, w: 2.4, d: 8 }` on F1 (entrance → pad lane).
  - `it('scorecard shows no invented numbers')`: `TEXT_LINES` = `['1','2',…,'9']` and the scorecard board renders a blank 9-column grid (export `SCORECARD_COLUMNS = 9`, no score strings in `look.ts` exports).
  - E2E additions: `clubhouse to course and back`: cold `/#/b/golf-clubhouse`, `walkTo(0, -9)` then `ArrowUp` until `ready(page, 'golf-clubhouse', 2)`; hash `#/b/golf-clubhouse/2`, `history.length` unchanged, HUD contains `Golf Clubhouse · Course`, pose ≈ (0, −2); settle, hold `ArrowDown` → floor 1, hash `#/b/golf-clubhouse`, and 1500 ms later still floor 1 (no cascade to world); `goBack()` → world, pose ≈ `exitPose('golf-clubhouse')`. `course scorecard stop opens golf`: on F2 `walkTo` the stop's `inFront` → `e` → dialog `Varsity golf`. `reduced motion ride has no fade`.
- [ ] **Step 2: Clubhouse (F1).** Floor `hardwood`, walls `offWhite` with `fairway` trim, wallHeight 3.2. `Scorecard` (`golf`): a framed scorecard board on an easel at `propAnchor([-4, -7])` (blank grid of thin `ink` lines on `offWhite`, `fairway` header band), outlined. `Clubhouse`: pro-shop counter east (`PRO SHOP` sign), instanced club rack (cylinders + `slate` heads), a trophy shelf with plain `mustard` cups (no plaques). `CourseDoor`: double door frame in the north wall at the pad with `TO THE COURSE` sign above, `fairway` mat on the pad rect. `CLUBHOUSE` sign low on the south wall.
- [ ] **Step 3: Course (F2).** Floor `grass`, perimeter `fairway` hedge walls (wallHeight 0.9), `9 HOLES` sign at the south gate. `Holes`: per hole an instanced `fairway` putting strip from tee to green, `fairway`-lighter green disc (`grass` + `fairway` two-tone), `ink` cup disc, `offWhite` tee mat, low `hardwood` bumper rails (visual only, h 0.15, not colliders), one simple obstacle on holes 3, 6, 9 (ramp, tunnel arch, water strip `water`; obstacles are colliders only if ≥ 0.4 m tall and must keep `reachable` green). `Flags`: instanced `slate` poles + `scarlet` flags with the hole number `Caption` (size 0.3). Scorecard stand at the `COURSE_STOPS` pos; `StopRings`. All flat, decorative: no ball physics (spec non-goal).
- [ ] **Step 4: Run** unit, tsc, build, e2e (port 4196) — Expected: PASS, draw calls ≤ 150 for floors 1 and 2, full and low.
- [ ] **Step 5: Screenshots** `PORT=4196 node $SCRATCH/shot.mjs '#/b/golf-clubhouse' golf-clubhouse s3-golf-clubhouse 1` and `'#/b/golf-clubhouse/2' golf-clubhouse s3-golf-course 2`; visual bar + the course reads as nine tiny holes in order, flag numbers legible, course and venue generic.
- [ ] **Step 6: Commit** owned paths: `feat(world): bespoke Golf clubhouse and nine-hole course` + trailer.

### Task 10: Outdoor — reference-driven exteriors, Chess Park, Park, 5K loop

**Files:**
- Modify: `src/world/world/{massing.ts,MassingMeshes.tsx,SignBoards.tsx,signs.ts,Spots.tsx,Ground.tsx,WorldScene.tsx,geometry.ts}`, `src/world/logic/layout.ts` (**only** add `DECOR_COLLIDERS` and include it in `worldColliders()`)
- Create: `src/world/world/{exteriors.ts,Exteriors.tsx,spots.ts}`
- Test: create `tests/world/exteriors.test.ts`, `e2e/world-outdoor.spec.ts`; modify `tests/world/world-scene.test.ts`, `tests/world/layout.test.ts`

**Interfaces:** Consumes `LOTS`, `doorTrigger`, `exitPose`, `spotPose`, `E2E_LANES`, `propBlocked`, `BatchShape`, Task 3 `Bulbs`, `bulbLevel`. Produces:
```ts
// world/exteriors.ts (pure)
export type ExteriorPart = { shape: BatchShape; x: number; y: number; z: number; sx: number; sy: number; sz: number; rotY?: number; color: ThemeColorKey; glow?: number };
export const EXTERIOR_ACCENTS: Record<'library'|'cinema'|'arcade'|'record-store'|'playhouse'|'fan-shop'|'golf-clubhouse', readonly ThemeColorKey[]>;
export function exteriorParts(id: BuildingId): ExteriorPart[];          // details beyond massingFor (merged per colour/glow in Exteriors.tsx)
export function exteriorBulbs(): InstanceItem[];                         // arcade + playhouse marquee bulbs
export function triCount(parts: readonly ExteriorPart[]): number;       // box 12, cylinder/cone 20 seg = 80/40, sphere 20×14 = 560
export const SIGN_STYLE: Partial<Record<BuildingId, { board: ThemeColorKey; color: ThemeColorKey; glow?: number; size?: number }>>;
// world/spots.ts (pure)
export function spotParts(id: 'chess-park' | 'park' | 'running-loop'): ExteriorPart[];
// logic/layout.ts
export const DECOR_COLLIDERS: Rect[];                                    // benches/hedges/tables that must block walking
```
`EXTERIOR_ACCENTS` (≤ 2 each): library `['brick','mustard']`, cinema `['cinemaRed','warmGlow']`, arcade `['teal','brick']`, record-store `['warmGlow','brick']`, playhouse `['cinemaRed','mustard']`, fan-shop `['rack','scarlet']`, golf-clubhouse `['fairway','hardwood']`.

- [ ] **Step 1: Write the failing tests** `tests/world/exteriors.test.ts`:
  - `it('each exterior stays under ~1k tris')`: `triCount(exteriorParts(id)) + 12 * massingFor(id).length <= 1000` for the seven.
  - `it('accents')`: every part colour of building id ∈ `EXTERIOR_ACCENTS[id]` ∪ neutrals (`offWhite`, `ink`, `stone`, `slate`, `path`, `sky`, `water`, `grass`).
  - `it('details never block a door, exit pose, spot or lane')`: for every part whose bottom (`y - sy/2`) < 2.2: footprint does not intersect `doorTrigger(LOTS[id])`, nor a 0.9 m circle around `exitPose(id)`, nor any `E2E_LANES` rect; parts above 2.2 m (canopies, signs) may overhang the lot by ≤ 1.5 m south; every part's footprint is otherwise within the lot rect.
  - `it('reference features exist')`: library has a canopy part (`offWhite`, bottom ≥ 2.2, width ≥ 0.5 × lot w), ≥ 3 step parts (`stone`), ≥ 2 rail parts, ≥ 4 window panes (`sky`); cinema has an arch (≥ 3 `warmGlow` glow parts at the door), a white band (`offWhite`) and ≥ 4 poster windows; arcade has ≥ 4 `offWhite` cylinder columns and a `teal` facade; `exteriorBulbs().length` ≥ 24 and all within arcade/playhouse lots.
  - `it('sign styles')`: `SIGN_STYLE.cinema` = `{ board: 'offWhite', color: 'cinemaRed' }`; `SIGN_STYLE.arcade.glow` > 0 (neon); `worldSigns()` texts = `buildings.map(b => b.sign)` (so `'5K loop'` for the running loop).
  - `it('spots')`: chess-park parts include a 64-square checker top (32 `ink` + 32 `offWhite`) and ≥ 2 bench parts; park includes a roundnet ring, ≥ 4 legs and a `mustard` ball; running-loop includes a marker post and the loop lane dashes; all spot parts keep `spotPose(id)` and the approach (1.5 m) clear.
  - `layout.test.ts`: existing door/spawn/flood-fill rules still pass with `DECOR_COLLIDERS`; every `DECOR_COLLIDERS` rect passes `!propBlocked`-style checks against doors, exit poses and lanes.
  - `world-scene.test.ts`: tree positions avoid `DECOR_COLLIDERS`.
- [ ] **Step 2: Run** `npx vitest run tests/world/exteriors.test.ts tests/world/layout.test.ts tests/world/world-scene.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement exteriors** (`Exteriors.tsx` merges `exteriorParts` of all buildings into one mesh per shape × colour × glow; bulbs via `Bulbs`, `still` under reduced motion or fx low):
  - Library (`_source/refs/library-exterior.png`): low red-brick modern body (existing massing), flat roof slab, wide `offWhite` entry canopy on two slim posts, 3 `stone` steps with `slate` rails, a band of big `sky` window panes with `ink` mullions, two `fairway` planters/trees by the steps, `mustard` door frame accent.
  - Cinema: glowing arched entrance (stacked `warmGlow` glow boxes forming an arch), white `offWhite` band carrying the `CINEMA` sign in `cinemaRed` letters, slatted `ink` canopy (instanced slats), 4 poster windows (flat colour blocks, no art).
  - Arcade (`_source/refs/arcade-santa-monica.png`, `_source/refs/arcade-game-vault.png`): old red-brick bank body with 4 `offWhite` columns and a pediment on the west half; white/`teal` boardwalk facade on the east half with marquee bulbs around the door; `ARCADE` sign as neon (`ink` board, `teal` text, glow).
  - Record Store (`warmGlow` awning + display window), Playhouse (`mustard`-framed marquee with bulbs, `cinemaRed` canopy), Fan Shop (striped `rack`/`scarlet` awning, window racks), Golf clubhouse (`hardwood` porch, `fairway` putting-green patch with one flag beside the lot, outside door and exit poses).
  - Nothing copies a real facade's sign, lettering or logo; shapes only.
- [ ] **Step 4: Implement spots.** Chess Park: table with a 64-square instanced checker top, 8 + 8 simple pieces (instanced cylinders/spheres/cones, `ink` / `offWhite`), two benches, a low hedge ring with a gap facing south (hedge/benches in `DECOR_COLLIDERS`, approach clear). Park: roundnet set (existing ring + 5 legs + `ink` net disc + `mustard` ball), a `fairway` grass patch, a bench. 5K loop: marker post with the world sign reading `5K loop` (from content), instanced `offWhite` lane dashes along the existing loop path, a `scarlet` start line by the marker. Outlines only on the interactive props (chess table, roundnet ring, marker post).
- [ ] **Step 5: E2E** `e2e/world-outdoor.spec.ts` (desktop + one mobile case): `world draw calls (full|low) <= 200` and `<= baseline + 35` (baseline from W0 notes, hard-coded in the spec with a comment), log the numbers; `#chess` and `#roundnet` → `world`, dialog `Chess` / `Roundnet club`, pose ≈ `spotPose`; walk from spawn to the Library door via Map → `ready(library)` → `goBack()` → pose ≈ `exitPose('library')`; tablet 820×1180 touch: Explore → world ready, draw calls ≤ 200, joystick visible; no console errors. Stage 1/2 e2e (`world.spec.ts`, `world-smoke.spec.ts`, `world-stage2.spec.ts`) still PASS on port 4197.
- [ ] **Step 6: Run** unit, tsc, build (`chunk world-scene` ≤ 150 KB), e2e — Expected: PASS.
- [ ] **Step 7: Screenshots** `PORT=4197 node $SCRATCH/shot.mjs '#/world' world s3-world`, plus scratch Playwright shots after Map fast travel and `goBack()` to each door: `s3-ext-library`, `s3-ext-cinema`, `s3-ext-arcade`, `s3-spot-chess` (`/#chess`, panel closed), `s3-spot-park` (`/#roundnet`, closed). Visual bar; each exterior recognisable by silhouette + sign + 2 accents.
- [ ] **Step 8: Commit** owned paths: `feat(world): reference-driven culture/sports exteriors, chess park, roundnet park, 5K loop marker` + trailer.

---

### Task 11: Integration — interest deep links, collection reachability, golf, budgets

**Files:**
- Create: `e2e/world-stage3.spec.ts`
- Modify: `tests/world/interiors/all.test.ts` (Stage 3 interiors), `e2e/world-perf.spec.ts` (the "generic hall" case → `library`, renamed `library (bespoke)`; no building uses the generic hall any more — it stays covered by `tests/world/generic-hall.test.ts`)

**Interfaces:** Consumes every builder's `sceneGeometry`, `SIGNS`, `STOPS`/`COURSE_STOPS`, Task 3 `walkTo`, `settle`, `uncovered`.

- [ ] **Step 1: Write the tests**
  - `all.test.ts`: add `library`, `arcade`, `record-store`, `playhouse`, `fan-shop` and golf floors 1–2: `interiorProblems` = `[]`; content ids placed ⊇ `exhibitsIn(id)` ids (stops allowed, as for cinema); all `SIGNS` ⊆ `SIGN_ALLOW_LIST`; every `TEXT_LINES` scene within `TEXT_CAP`; none of the 13 bespoke `Interior.tsx` contains `../generic/`. `it('every collection item is reachable from 3D')`: books via library unit ranges (union of ranges = all 75), games `uncovered(...)` = `[]`, films via cinema stops = all 12, teams and artists via their panels (`teams`, `music` placements exist).
  - `e2e/world-stage3.spec.ts` (desktop):
    - `every interest deep link lands home with its panel`: literal table of the 13 interests → `{ scene, floor? }` (`basketball` gym, `golf` golf-clubhouse 1, `chess` world, `rocket-league`/`fifa`/`games` arcade, `roundnet` world, `teams` fan-shop, `movies` cinema, `books` library, `music`/`karaoke` record-store, `stranger-things` playhouse); dialog named by title; pose ≈ `inFront(pos)` (interiors) or `spotPose(building)` (spots).
    - `collection stops open on their item`: library unit 3 (`STOPS[2].focus`), arcade `Halo`, fan-shop `Manchester City`, cinema `Cars`: `walkTo` + `e` → `[aria-current="true"]` text; close; `/#games` (fresh) → no `[aria-current]` (Review Focus 2).
    - `golf round trip`: as Task 9's e2e, then hostile `#/b/golf-clubhouse/3`, `/0`, `/x` → floor 1, no page error.
    - `walk out of every interest building` (6 + cinema): pose ≈ `exitPose`, no re-trigger after 1500 ms.
    - `draw calls (full|low) <= 150 in every stage-3 interior` (both golf floors), logged.
    - `no external requests touring every interest building`: `trackExternal` empty.
  - Mobile: `tablet: Map → Arcade ready, joystick visible, draw calls <= 150`; `tablet: world draw calls <= 200`.
- [ ] **Step 2: Run** `npm test` and `npm run e2e` — Expected: PASS (all W1 merged). Fix only test code here; product defects go back to the owning task.
- [ ] **Step 3: Budgets** — `npm run build`. Expected: initial `JS gzip size` ≤ 200 KB, total < 5120 KB, each `chunk interior-<id>` ≤ 120 KB, `chunk world-scene` ≤ 150 KB, no `warn:` lines. Record all numbers and the draw-call logs in the commit body.
- [ ] **Step 4: Screenshots** `node $SCRATCH/shot.mjs '#games' arcade s3-deeplink-games`, `'#books' library s3-deeplink-books`.
- [ ] **Step 5: Commit**
```bash
git add e2e/world-stage3.spec.ts e2e/world-perf.spec.ts tests/world/interiors/all.test.ts
git commit -m "test(world): stage 3 interest deep links, collection reachability, golf round trip and budgets

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 12: README, privacy scan, final verification

**Files:** Modify `README.md` (sections "Brayden's World", "Add a bespoke interior", "Budgets and effects mode").

- [ ] **Step 1: README** — list all 13 bespoke interiors; document collection stops (`STOPS` with `focus`, panel highlights the item), walk-in pads (`Pad.to`), golf `#/b/golf-clubhouse/2`, `Floor.label`; update the measured draw calls (Tasks 4–11) and chunk sizes; note the generic hall is now only the data-only fallback. Refer to references only as "owner reference photos (not in the repo)".
- [ ] **Step 2: Verify** — `npm test`, `npx tsc -b`, `npm run build`, `npm run e2e`: all PASS.
- [ ] **Step 3: Privacy scan** — a scratch `node` script (in `$SCRATCH`, not committed) runs `findPrivateTerm(text, loadPrivateTerms())` and `PHONE_PATTERN` over (a) every `git ls-files` text file and (b) every file under `dist/` (JS, CSS, HTML, JSON, GLB as latin1) and prints only `path: HIT`/counts, never the matched term → 0 hits. The terms file covers the reference business names, so this is the "no reference names" check. Also: `git ls-files | grep -i "_source\|\.slbk"` empty; no PNG/JPG under `public/` or `dist/` that is not from `build-media` (`git diff --stat main -- public` shows no new images); `git grep -nE "logo\.webp" -- src/world` empty.
- [ ] **Step 4: Screenshot** `node $SCRATCH/shot.mjs '#/world' world s3-final-world` as the release check.
- [ ] **Step 5: Commit**
```bash
git add README.md
git commit -m "docs: stage 3 interest buildings, collection stops, golf course, exteriors

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Self-review notes

- Spec coverage: §15 3a Library/Arcade (+ Cinema exterior; Cinema interior done in Stage 2, focus retrofit Task 2) → Tasks 4, 5, 10; 3b Record Store, Playhouse, Fan Shop → Tasks 6–8; 3c Golf mini course → Tasks 1, 2, 9; Chess Park, Park, 5K loop → Tasks 1 (sign), 10. §5.4 kinds: golf/library/etc. stay `interior`, chess/park/loop stay `spot`. §5.6 Library "all books, instanced spines, no text, mustard armchairs, gray carpet, string lights, favorites table, Shelf panel, Goodreads" → Task 4 + existing BookList (filter, favorites first) + focus; Arcade cabinets "name + flat colour" for all 18 → Task 5; Record Store top 12 numbered sleeves + karaoke stage → Task 6; Playhouse marquee/curtain/stage → Task 7; Fan Shop racks with team text, no crests → Task 8; Golf 9 holes + scorecard, generic names → Task 9; exteriors per reference descriptions → Task 10. §8 budgets/instancing/text cap → Global Constraints, `textCount`, every e2e. §10 golf scene: uses the floor dimension instead of a new `{kind:'course'}` (the spec's "may add"; floors already give URL, history, exit-to-clubhouse and Back semantics for free). §12 accents → `EXTERIOR_ACCENTS` + per-interior colour rules, no theme edit. §13 a11y → `aria-current`, 44 px, reduced-motion bulbs. §14 signage test → Task 1 + common `signs` test + Task 11.
- Interfaces checked across tasks: `PlacedExhibit.focus`, `Pad.to`, `floorLabel`, `collectionKeys`, `padAction`, `ride(floor, { padId })`, `activate/openPanel(id, focus)`, `withStops`, `hotStop`, `uncovered`, `textCount`/`TEXT_CAP`, `bulbLevel`, `Caption`/`captionSize`, `StopRings`, `Bulbs`, `walkTo`, `settle`, `titleSortKey`, `GOLF_COURSE_PAD`, `STOPS`, `TEXT_LINES`, `SIGNS`, `SIGN_SPECS`.
- Left out on purpose: Cinema poster-title legibility and `PosterRings` → `StopRings` migration (Cinema folder untouched apart from `focus`), physics/putting gameplay (spec non-goal), per-artist stops in the Record Store (the sleeve wall shows all 12, one panel lists them).

---

## Owner answers (2026-11-24) — override anything above

- **Q1 Golf structure:** accepted as planned (two floors of the clubhouse; course at `#/b/golf-clubhouse/2`).
- **Q2 Golf copy:** add to the golf interest detail (Task 1): best nine-hole round 40 (+5) and Morris County Tournament, 18 holes, 108. The scorecard board may show these two summary lines (venue names generic, no per-hole scores).
- **Q3** "5K loop" exactly: accepted.
- **Q4 Fan Shop:** use each team's **real colours** (primary/secondary hex per team, pinned in content or the fan-shop look file, tested), still no logos, crests, names or numbers on garments. This is an allowed exception to the "≤2 accent colours" rule for the Fan Shop interior only.
- **Q5 Library:** only real books; empty shelf space is intentional (owner will add books later) — keep shelf capacity for growth and make adding a book a content-only change.
- **Q6 Record Store:** **a stop per artist** (like cinema posters), each opening the music panel focused on that artist. The artist list grows to the owner's ranked list below (46 entries after the owner removed one; rank by list order 1..46). Task 1 replaces `src/content/artists.ts` with this list (exact spelling): Drake; Don Toliver; Kendrick Lamar; J. Cole; Kanye West; Travis Scott; Future; Playboi Carti; Tyler, The Creator; J Balvin; Lil Uzi Vert; Tame Impala; Chris Brown; Daft Punk; The Beatles; Sam Gellaitry; BigXthaPlug; PARTYNEXTDOOR; Justin Bieber; JAŸ-Z; Lil Baby; NLE Choppa; Lil Tecca; JID; Knock2; The Weeknd; Dominic Fike; Kid Cudi; Ariana Grande; The Kid LAROI; Porter Robinson; slayr; Ty Dolla $ign; Bad Bunny; Yuno Miles; Yeat; Quavo; Offset; Shawn Mendes; A$AP Rocky; XXXTENTACION; Central Cee; Pop Smoke; Rihanna; Lil Wayne; deadmau5. Update the music interest one-liner/detail and Box Score accordingly (top 12 can stay featured). Record wall: 46 original stylized sleeves (colour blocks only, no album art, no 3D text per sleeve — the name appears in the HTML prompt "Press E — Music: <artist>"), instanced; stops must satisfy `interiorProblems` (ring spacing — use a long wall/bins layout or grouped stops if 46 rings can't fit at 3 m; if grouped, focus the first artist in the group and list the group in the prompt). Text budget per scene still ≤ 24.
- **Q7 Arcade:** accepted as planned.
