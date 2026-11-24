# Brayden's World — Stage 2 (Career Buildings) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic Exhibit Hall in the five Stage 2 buildings (The Workshop, HQ Tower with four floors and an elevator, Civic Center, Campus Quad, Hall of Fame) with bespoke low-poly toon interiors, built in parallel by five builders who each own one folder, with every deep link landing on the right building, floor and exhibit.

**Architecture:** A short foundation wave freezes every shared decision: authored exhibit positions and `bespoke: true` flags in content, the interior-sign allow-list, a floor dimension on `Scene` (URL `#/b/hq-tower/<n>`, elevator pad → dialog → replaceState ride), and a bespoke-interior kit (pure `logic/interior.ts` geometry + validator, `InteriorShell`, `InteriorMarkers`, `ShapeBatch`, `MediaBoard`) extracted from the Gym and generic hall. The registry gets all five entries in W0, each pointing at a stub folder that re-exports the generic hall, so in W1 a builder only replaces files inside `src/world/interiors/<id>/` and never edits a shared file. A final wave adds cross-building e2e, budget verification and README.

**Tech Stack:** unchanged — React 18 + TS + Vite 5, R3F 8.18 / drei 9.122 / three 0.187, `@react-three/postprocessing@2`, Zustand 5, Vitest, Playwright (channel chromium). **No new dependencies.**

**Spec:** `docs/superpowers/specs/2026-11-23-braydens-world-design.md` (binding; Stage 2 = §15, buildings §5.6, routing §6, content model §11, art §12, a11y §13, tests §14). Conventions and contracts: `docs/superpowers/plans/2026-11-24-world-stage-1.md`. Ledger: `.superpowers/sdd/2026-11-24-world-stage-1/progress.md` (Publish → Later).

## Global Constraints

- Privacy: no phone number (`PHONE_PATTERN`), no private term (`loadPrivateTerms`/`findPrivateTerm`; `check-dist` scans built JS/HTML/GLB). No omitted roles, no health info. Never write the high-school team nickname on its own (text or image). "Tech Devils" (full robotics name) is allowed but not needed. Do not add the nickname to the private-terms file.
- Signage: every 3D sign string is in `SIGN_ALLOW_LIST` (Task 1 adds the exact Stage 2 strings) or matches `^Brayden's `. Never a real business, venue or school name or logo on a sign (no "Rutgers", "Morris Tech", "CCM", "Zayi", "Code Ninjas", "Oculogica", "Shah Sokoloff", "NASA", "UCLA" on signs). `public/media/robotics/logo.webp` is **never** used in 3D. No crests, posters, box art.
- Other 3D text: only exhibit labels (exhibit `title`, via `InteriorMarkers`; e.g. `Tech Devils Robotics`, the allowed full name — labels are not signs and need no allow-list entry), banner cloth text (`banner.title` / `banner.year` from content) and station `stat` values from content. No new facts in 3D; copy anywhere new (dialog text, floor names) is first person or neutral UI words, resume facts only. Every 3D string goes through `toFontSafe`; troika `<Text>` ≤ 24 per scene (labels count).
- Palette: only `theme.accents` keys (no new accent keys in Stage 2; `theme.ts` is not edited). Career District = scarlet/ink/offWhite + neutrals (`stone`, `slate`, `path`, `hardwood`, `sky`, `water`, `grass`); `mustard` = trophy gold; `warmGlow` for screens/LEDs only. Toon gradient via `gradientMap`; outlines only on interactive props (the prop at each exhibit), never on room shells. Bloom only on emissive things (`ShapeBatch glow`, screens).
- Geometry: boxes, cylinders, spheres, cones, extruded shapes from code. No GLB, no image textures except existing `public/media/**` webps on boards/screens via `MediaBoard`. Instance anything repeated (`ShapeBatch`: one draw call per colour per shape).
- Budgets (hard, build fails): initial JS ≤ 200 KB gzip, three/R3F/zustand only via dynamic import; total gzip `dist/assets/**` + `dist/models/**` < 5 MB. Targets (warn): each interior chunk ≤ 120 KB gzip JS. Each building is its own lazy chunk (`src/world/interiors/<id>/Interior.tsx`).
- Draw calls (whole frame, ReadySignal frame 30): **each interior ≤ 150, full and `?fx=low`, every HQ floor**. Design target ≤ 120: room 2 · exit mat 1 · rings ≤ 8 · labels ≤ 6 · signs 2 each · avatar ≤ 18 · shadow 1 · composer ≤ 15 → props ≤ 60.
- Exhibit placement: the ring sits at the content `pos`; the exhibit prop's footprint centre is `propAnchor(pos)` = `[x, z − 1.6]`, footprint ≤ 3 m wide × ≤ 1.6 m deep (`propCollider`). Larger set pieces are extra colliders and must pass `interiorProblems`.
- Room frame (all five): origin south-centre, x ∈ [−W/2, W/2], z ∈ [−L, 0] (north = −z), south wall ≤ 0.6 m, exit trigger `{x 0, z −0.45, w 2.4, d 0.9}`, entrance `(0, −2, NORTH)` unless stated.
- Accessibility: Skip link first, then Scouting Office, Map; letter keys only with wrapper/body focus; every dialog focus-trapped, Esc closes, focus returns to the wrapper; reduced motion = no fades, snap camera, no ambient animation; low power = no composer, dpr 1. Touch targets ≥ 44 px.
- W1 builders edit **only** their owned paths (their interior folder, their `tests/world/interiors/<id>.test.ts`, their `e2e/interiors/<id>.spec.ts`). A needed change outside them (a content `pos`, a kit bug, an allow-list string) is reported to the controller, never made.
- `npm test` and `npx tsc -b` pass at every commit; each task also runs `npm run build`; e2e as each task states.
- Git: branch `world-stage-2`. Stage explicit paths only (`git add <paths>`); never stage `_source/` or `Smart+Launcher+Setup.slbk`. Never push. Every commit message ends with a blank line then `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- No same-name-different-case files (Windows).

## Review Focus

1. **Elevator reopen loop or trap** — arriving on a floor, pressing Esc on the dialog, or standing still on the pad must not reopen the dialog in a loop; stepping off and on reopens it; E / Interact on the pad reopens it; Map and panels can't open over it. (Task 2 player-frame latch + keyboard tests; Task 5 e2e "Esc, stand, step off and on")
2. **Hostile floor hashes** — `#/b/hq-tower/0`, `/5`, `/2.5`, `/x`, `#/b/hq-tower/`, `#/b/gym/2`, `#/b/nope/2`: no throw; a bad floor lands on the lobby, an unknown building on the world. (Task 2 routes test)
3. **Back / popstate during an elevator ride** — the final scene and floor match the URL, no entry is pushed by a ride, and Back always leaves the building. (Task 2 history adapter tests; Task 5 e2e)
4. **Exhibit on another floor or a mirror** — `#ai-camp` while on HQ F1, `#oculogica` from the Workshop mirror, `#critics-choice` from the Hall of Fame: always the home building and the home floor, never a panel opened on the wrong floor. (Task 2 planRoute tests; Task 9 deep-link sweep)
5. **Media texture missing or slow** (`/media/**` 404, offline, slow) — the interior still reaches `data-ready="true"`, the board shows its plain frame, no page error, draw calls in budget. (Task 3 MediaBoard boundary test; Task 9 aborted-media e2e)

---

## Shared contracts (read by every task)

**Bespoke buildings after Task 1:** `gym`, `workshop`, `hq-tower`, `civic-center`, `campus-quad`, `hall-of-fame` (`bespoke: true`); every placement in them has `pos`. Everything else stays generic and pos-free.

**Authored positions** (Task 1 writes these into `stations.ts`, `banners.ts`, `mirrors.ts`; ring at `pos`, prop at `[x, z − 1.6]`):

| Building (W × L) | Exhibit → `pos` |
|---|---|
| workshop (20 × 16) | `tranquility-base` [−6, −12] moon globe · `dreams-come-true` [0, −12] storybook · `debate-mate` [6, −12] podiums · `zayi-ai-studio` [−6, −6] server rack + results board · `airbnb-classifier` [6, −6] city blocks + bar chart · mirror `oculogica` [0, −6] eye + trace screen |
| hq-tower (16 × 12, per floor) | F1 `shah-sokoloff` [3, −7] · F2 `code-ninjas` [3, −7] · F3 `oculogica` [1, −7], `ai-camp` [5.5, −7] · F4 `zayi-fellow` [3, −7] |
| civic-center (22 × 16) | `usacs` [−7, −12] lecture hall + mentorship board · `hackru` [0, −12] judging hall · `calc-ii-la` [7, −12] classroom · `honors-ambassador` [−6, −6] and `orientation-leader` [−2, −6] tour desk · `teaching-mentoring` [6, −6] bench |
| campus-quad (26 × 20) | college row: `rutgers-honors` [−8, −16] Honors Hall · `critics-choice` [0, −16] documentary screen · `ccm` [8, −16] certificate; high-school wing row: `robotics` [−10, −9] lab · `advisory-council` [−5, −9] · `hackmcst` [0, −9] · `nslc` [5, −9] · `java-juniors` [10, −9] |
| hall-of-fame (20 × 16) | `critics-choice-prize` [−7.5, −12] · `best-code-tech` [−2.5, −12] · `best-gemini` [2.5, −12] · `bloodiest-game` [7.5, −12] · `academy-scholar` [−7.5, −6] · `rising-star` [−2.5, −6] · `honor-societies` [2.5, −6] · mirror `critics-choice` [7.5, −6] screen |

Gym is unchanged (`basketball` [3, 5], mirror `rising-star` [−3, −7]).

**HQ floors** (`src/content/floors.ts`, Task 1): `{ n: 1, name: 'IT server room', sign: 'FLOOR 1: IT ROOM' }`, `{ n: 2, name: 'Coding dojo', sign: 'FLOOR 2: CODING DOJO' }`, `{ n: 3, name: 'Med-ML lab', sign: 'FLOOR 3: MED-ML LAB' }`, `{ n: 4, name: 'AI lab', sign: 'FLOOR 4: AI LAB' }`. Elevator pad (Task 5 owns the constant, Task 2 tests use the same numbers): `{ id: 'elevator', rect: { x: −5.5, z: −9.6, w: 2, d: 2 }, arrival: { x: −5.5, z: −7.6, heading: SOUTH } }`; elevator car collider `{ x: −5.5, z: −11.4, w: 2.4, d: 1.2 }`. F1 entrance `(0, −2, NORTH)`; F2–F4 entrance = the arrival pose. Every floor has the standard south exit (stairwell). Elevator lane (kept free of colliders on every floor; e2e walks it): x ∈ [−6.5, −4.5] for z ∈ [−10.6, −2], plus z ∈ [−3, −1] for x ∈ [−6.5, 0.5].

**Floor routing (decided):** floor is part of the interior scene and the URL. `#/b/hq-tower` = floor 1, `#/b/hq-tower/<2..4>` = that floor; an exhibit hash carries its home floor implicitly. **An elevator ride is `replaceState`** (no new entry): Back always means "leave this building" exactly as in every other interior and as spec §6 lists pushes only for enter/exit/fast-travel, while replacing keeps the URL truthful so reload, Forward and the Box Score round trip return to the floor you were on. Map fast travel to an exhibit on another floor is fast travel, so it pushes (Back returns to the floor you came from). `sameScene` compares `floor ?? 1`.

**Interior sign allow-list additions (exact, Task 1):** `'ELEVATOR'`, `'FLOOR 1: IT ROOM'`, `'FLOOR 2: CODING DOJO'`, `'FLOOR 3: MED-ML LAB'`, `'FLOOR 4: AI LAB'`, `'LECTURE HALL'`, `'JUDGING HALL'`, `'CLASSROOM'`, `'TOUR DESK'`, `'MENTORSHIP BOARD'`, `'HONORS HALL'`, `'SCREENING ROOM'`, `'HIGH SCHOOL WING'`, `'ROBOTICS LAB'`. With the 18 exterior signs: **32** entries. Building-name signs reuse `WORKSHOP`, `HQ TOWER`, `CIVIC CENTER`, `CAMPUS QUAD`, `HALL OF FAME`.

**Owned folder layout (each W1 builder):**
```
src/world/interiors/<id>/Interior.tsx   default export Interior(props: InteriorProps); re-exports sceneGeometry
src/world/interiors/<id>/geometry.ts    SPEC: InteriorSpec (HQ: FLOOR_SPECS), sceneGeometry(id, floor?)
src/world/interiors/<id>/look.ts        <ID>_LOOK (colours from theme.accents only), SIGNS: readonly string[]
src/world/interiors/<id>/scene/*.tsx    props (one file per exhibit set piece or shared dressing)
tests/world/interiors/<id>.test.ts
e2e/interiors/<id>.spec.ts
```

**Screenshots** (owner reviews visuals). `SCRATCH=C:/Users/brant/AppData/Local/Temp/claude/d24ef27a0b9d1701/09458dfb-a726-41dc-87e0-58a0bb1d30fe/scratchpad`. Task 1 writes `$SCRATCH/shot.mjs` (not committed): `node $SCRATCH/shot.mjs <hash> <scene> <name> [floor]` loads `@playwright/test` with `createRequire(join(process.cwd(), 'x.js'))` (so it resolves from the repo), launches channel `chromium` at 1280×800, `addInitScript` sets `sessionStorage['world.started']='1'`, goes to `http://localhost:${PORT ?? 4173}/${hash}`, waits for `[data-world-focus][data-ready="true"][data-scene="<scene>"]` (and `[data-floor="<floor>"]` when given), waits 1500 ms, writes `$SCRATCH/<name>.png`. Needs `npm run build && npx vite preview --port <PORT>` running. After each shot, open the PNG with Read and check the task's visual criteria.

## Parallelism

- **W0a:** Task 1 alone (content + types contracts).
- **W0b (2 in parallel):** Task 2 (floors, routing, elevator UI: `routing/*`, `history.ts`, `store.ts`, `scene/{SceneSwitcher,Player}.tsx`, `WorldApp.tsx`, `useKeyboard.ts`, `ui/{Hud,MapDialog,Prompt,InteractButton,ElevatorDialog}.tsx`, `ui/world-ui.css`) ∥ Task 3 (kit: `logic/interior.ts`, `kit/*`, `interiors/registry.ts`, `interiors/{generic,gym}/Interior.tsx`, the five stub folders, `scripts/check-dist.mjs`, `e2e/helpers.ts`). Disjoint files.
- **W1 (5 in parallel):** Tasks 4–8, one folder each. Run each in its own worktree (`git worktree add ../portfolio-s2-<id> -b s2-<id> world-stage-2`, then `npm ci`) because builds and e2e write `dist/`; preview ports: workshop 4181, hq-tower 4182, civic-center 4183, campus-quad 4184, hall-of-fame 4185 (`npm run build && npx vite preview --port <p>` then `BASE_URL=http://localhost:<p> npx playwright test e2e/interiors/<id>.spec.ts`). The controller merges each `s2-<id>` branch into `world-stage-2`; owned paths are disjoint, so merges are conflict-free.
- **W2:** Task 9 (integration e2e + budgets), then Task 10 (README + final verification).

---

### Task 1: Contracts — positions, bespoke flags, floors, sign allow-list, scene types

**Files:**
- Modify: `src/content/stations.ts` (add `pos` to all 24 stations), `src/content/banners.ts` (7 `pos`), `src/content/mirrors.ts` (`oculogica`→workshop `pos: [0, -6]`, `critics-choice`→hall-of-fame `pos: [7.5, -6]`), `src/content/buildings.ts` (`bespoke: true` on the five; `SIGN_ALLOW_LIST` + 14 strings), `src/content/index.ts` (export floors), `src/world/types.ts`
- Create: `src/content/floors.ts`
- Test: `tests/content-model.test.ts`

**Interfaces:**
- Consumes: existing `exhibitsIn`, `Placement`, `SIGN_ALLOW_LIST`.
- Produces:
```ts
// content/floors.ts
export type Floor = { n: number; name: string; sign: string };
export const FLOORS: Partial<Record<BuildingId, readonly Floor[]>>;   // only 'hq-tower', ordered 1..4
export function floorsOf(id: BuildingId): readonly Floor[];            // [] for single-floor buildings
export function isFloor(id: BuildingId, n: number): boolean;           // integer 1..floorsOf(id).length
// world/types.ts
export type Scene = { kind: 'world' } | { kind: 'interior'; id: BuildingId; floor?: number };
export type Pad = Trigger & { arrival: Pose };
export type SceneGeometry = { /* existing fields */ pads?: Pad[]; /** resolved floor of a multi-floor interior */ floor?: number };
export type SceneModule = { default: ComponentType<SceneProps>; sceneGeometry(id: BuildingId | null, floor?: number): SceneGeometry };
```

- [ ] **Step 1: Write the failing tests** in `tests/content-model.test.ts`:
  - `it('stage-2 buildings are bespoke')`: `buildings.filter(b => b.bespoke).map(b => b.id).sort()` equals `['campus-quad','civic-center','gym','hall-of-fame','hq-tower','workshop']`.
  - `it('authored positions match the contract table')`: a literal `POS` map of the 33 placements in the Shared contracts table (key `"<building>/<id>"`) equals the map built from `exhibitsIn(b).filter(p => p.pos)` for the five buildings.
  - `it('rings on the same floor are at least 3 m apart')`: for each bespoke building and floor group (`p.floor ?? 1`), every pair's distance ≥ 3.
  - `it('floors')`: `floorsOf('hq-tower').map(f => f.n)` = `[1,2,3,4]`; names as in contracts; `floorsOf('gym')` = `[]`; `isFloor('hq-tower', 3)` true, `isFloor('hq-tower', 0|5|2.5)` false, `isFloor('gym', 1)` false; every HQ floor has ≥ 1 home exhibit with that floor.
  - Update `it('signs use the allow-list ...')`: `SIGN_ALLOW_LIST` has length 32 and contains each of the 14 new strings; every `floorsOf('hq-tower')[i].sign` is in it.
  - Keep `'pos is present on a placement iff its building is bespoke'` unchanged (it now covers the new positions).
- [ ] **Step 2: Run** `npx vitest run tests/content-model.test.ts` — Expected: FAIL (bespoke set, positions, floors module missing).
- [ ] **Step 3: Implement** the content edits and `floors.ts`; extend `types.ts` as above (all new fields optional, so `generic` and `gym` `sceneGeometry` stay assignable).
- [ ] **Step 4: Run** `npm test` and `npx tsc -b` — Expected: PASS (generic halls ignore `pos`, the registry still falls back to generic for the five).
- [ ] **Step 5: Screenshot** — write `$SCRATCH/shot.mjs` (contract above), `npm run build && npx vite preview --port 4173`, `node $SCRATCH/shot.mjs '#/b/workshop' workshop s2-t1-workshop-generic`. Check: generic hall unchanged (6 pedestals, labels below HUD).
- [ ] **Step 6: Commit**
```bash
git add src/content/stations.ts src/content/banners.ts src/content/mirrors.ts src/content/buildings.ts src/content/floors.ts src/content/index.ts src/world/types.ts tests/content-model.test.ts
git commit -m "feat(content): stage 2 contracts — bespoke career buildings, exhibit positions, HQ floors, interior signs

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 2: HQ floors — routing, history, elevator pad and dialog

**Files:**
- Modify: `src/routing/routeWords.ts`, `src/routing/routes.ts`, `src/world/history.ts`, `src/world/store.ts`, `src/world/scene/SceneSwitcher.tsx`, `src/world/scene/Player.tsx`, `src/world/WorldApp.tsx`, `src/world/useKeyboard.ts`, `src/world/ui/{Hud,MapDialog,Prompt,InteractButton}.tsx`, `src/world/ui/world-ui.css`
- Create: `src/world/ui/ElevatorDialog.tsx`
- Test: `tests/routes.test.ts`, `tests/world/history.test.ts`, `tests/world/store.test.ts`, `tests/world/player-frame.test.ts`, `tests/ui/scene-switcher.test.tsx`, `tests/ui/world-keyboard.test.tsx`, `tests/ui/world-hud.test.tsx`, `tests/ui/map-dialog.test.tsx`, `tests/ui/world-prompt.test.tsx`, create `tests/ui/elevator-dialog.test.tsx`

**Interfaces:**
- Consumes: Task 1 `Scene.floor`, `Pad`, `SceneGeometry.{pads,floor}`, `SceneModule.sceneGeometry(id, floor?)`, `floorsOf`, `isFloor`.
- Produces:
```ts
// routing/routeWords.ts
| { view: 'building'; id: BuildingId; legacy: boolean; floor?: number }
// routing/routes.ts — '/b/<id>/<n>': floor set only when isFloor(id, n); bad n → building without floor
hashForRoute({ view: 'building', id, floor }) // '#/b/<id>/<n>' when floor >= 2, else '#/b/<id>'
// history.ts
export function hashForScene(s: Scene): string;           // '#/b/hq-tower/3'; floor 1 or undefined → '#/b/hq-tower'
export function sameScene(a: Scene, b: Scene): boolean;   // interiors: same id and (a.floor ?? 1) === (b.floor ?? 1)
createHistorySync(d) → { start(); travel(hash); ride(floor: number): void; restore(); dispose() }
// store.ts
elevatorOpen: boolean; padId: string | null;
openElevator(): void; closeElevator(): void; setPad(id: string | null): void;   // go() also sets elevatorOpen false
// scene/Player.tsx
PlayerFrame.pad: string | null;                            // triggerAt(pose, geo.pads ?? [])
Player({ ..., onPad?(id: string): void })                  // fires on outside→inside via its own createDoorLatch
// ui/ElevatorDialog.tsx
export function ElevatorDialog({ onRide, store }: { onRide(floor: number): void; store?: WorldStore }): JSX.Element | null;
// WorldApp wrapper: data-floor = interior scene floor as string, '' otherwise
```

- [ ] **Step 1: Write the failing tests**
  - routes: `parseRoute('#/b/hq-tower/3')` → `{ view: 'building', id: 'hq-tower', legacy: false, floor: 3 }`; `'#/b/hq-tower/1'` → floor 1; each of `'#/b/hq-tower/0'`, `'/5'`, `'/2.5'`, `'/x'`, `'#/b/hq-tower/'` → `{ view: 'building', id: 'hq-tower', legacy: false }` (no `floor` key); `'#/b/gym/2'` → gym, no floor; `'#/b/nope/2'` → `{ view: 'auto' }`; `hashForRoute` of floor 3 → `'#/b/hq-tower/3'`, floor 1 → `'#/b/hq-tower'`.
  - history hashes: `hashForScene({ kind: 'interior', id: 'hq-tower', floor: 3 })` = `'#/b/hq-tower/3'`; floor 1 and undefined → `'#/b/hq-tower'`; `sameScene(hq, hq floor 1)` true, `sameScene(hq floor 1, hq floor 3)` false.
  - targetForRoute: `#oculogica` → `{ scene: { kind: 'interior', id: 'hq-tower', floor: 3 }, pose: null, panelId: 'oculogica' }`; `#/b/hq-tower/4` → floor 4, no panel; `#tranquility-base` scene has no `floor` key.
  - planRoute: in HQ floor 1, `#ai-camp` → `go` to floor 3; in HQ floor 3, `#ai-camp` → `panel`; in workshop, `#oculogica` → `go` to hq-tower floor 3; in HQ floor 3 with no panel, `#/b/hq-tower/3` → `none`.
  - adapter `ride(3)` on `#/b/hq-tower` with geometry pads = contract pad: exactly one `replaceState('#/b/hq-tower/3')`, zero `pushState`, `pending` = `{ scene: hq floor 3, pose: { x: -5.5, z: -7.6, heading: SOUTH }, panelId: null }`, `elevatorOpen` false; `ride(n)` where n is the current floor → no write, no `go`; `ride(9)` → no-op; `ride` while `scene.kind === 'world'` → no-op.
  - adapter: after `ride(3)`, popstate to `#/world` while `fading-out` → pending world; after settle hash `#/world`, scene world, `worldPose` = `exitPose('hq-tower')`.
  - adapter: in HQ floor 1, `travel('#zayi-fellow')` pushes `'#zayi-fellow'` once; popstate `'#/b/hq-tower'` → `go` to floor 1, panel closed.
  - adapter: panel close on floor 3 replaces with `'#/b/hq-tower/3'`.
  - scene-switcher: target `{ interior hq-tower }` (no floor) with a module whose `sceneGeometry` returns `floor: 1` → `sceneGeometry` called with `('hq-tower', undefined)`, committed `store.scene` = `{ kind: 'interior', id: 'hq-tower', floor: 1 }`; target floor 3 → called with `('hq-tower', 3)` and the rendered component receives `floor={3}`; non-floor buildings commit a scene with no `floor` key.
  - store: `openElevator` / `closeElevator` / `setPad` are idempotent (no state change when equal); `go()` sets `elevatorOpen` false.
  - player-frame: a geometry with the contract pad: pose (−5.5, −9.6) → `pad === 'elevator'`; (−5.5, −7.6) → `null`; geometry without `pads` → `null`; a `createDoorLatch` fed the frames of a spawn at the arrival pose walking north onto the pad fires once, and spawning inside the pad fires nothing until the player leaves and re-enters.
  - keyboard: with `elevatorOpen` true, `KeyW` adds nothing to `liveInput.pressed` and `KeyM` does not open the Map; with `padId === 'elevator'`, `nearId === null`, `KeyE` calls `openElevator`.
  - elevator-dialog: closed → renders nothing; open in HQ floor 1 → `dialog` named `Elevator`, four buttons in order Floor 4, 3, 2, 1 with names matching `/^Floor 4: AI lab/` … `/^Floor 1: IT server room/` and each containing its floor's exhibit titles; current floor button has `aria-current="true"` and has focus on open; clicking Floor 3 → `onRide(3)` once and dialog closed; clicking the current floor → closes, `onRide` not called; Escape → closes, `onRide` not called; buttons have class `world-elevator__floor` (CSS `min-height: 44px`).
  - hud: in HQ floor 3 the status reads `HQ Tower · Floor 3`; the `.world-hud__where` span has `aria-live="polite"`.
  - map-dialog: in the HQ Tower list the `oculogica` button (title `Machine Learning Research Intern`) has a name matching `/Floor 3/`; the Workshop list is unchanged (still no oculogica button).
  - prompt: `padId === 'elevator'` and no `nearId` → desktop prompt `Press E — Elevator`, touch Interact button `aria-label="Open the elevator"`; clicking either calls `openElevator`.
- [ ] **Step 2: Run** `npm test` — Expected: the new cases FAIL.
- [ ] **Step 3: Implement.**
  - `ride(floor)`: guard (interior scene, `isFloor`, not current floor, no panel); `closeElevator()`; `write('replace', hashForScene(next))`; `applyGo({ scene: next, pose: pad?.arrival ?? null, panelId: null }, false)` where `pad = geometry.pads?.find(p => p.id === 'elevator')`.
  - `targetForBuilding` takes the route floor or the exhibit's home floor (`getExhibit(id).floor`) and sets `scene.floor` only when defined.
  - SceneSwitcher: `m.sceneGeometry(idOf(scene), floorOf(scene))`; commit `geometry.floor !== undefined ? { ...scene, floor: geometry.floor } : scene`; render `floor={scene.floor}`. Registry cache key stays per building (floor ignored).
  - Player: `st.setPad(f.pad)`; frozen also when `elevatorOpen`; pad latch → `onPad`. WorldApp: `onPad = id => id === 'elevator' && store.openElevator()`, render `<ElevatorDialog onRide={nav.ride} />` next to MapDialog, `data-floor` attribute.
  - ElevatorDialog: reuse `useFocusTrap(ref, open, closeElevator, currentBtn)` and the `world-backdrop` / `world-map` styles; heading `Elevator`; reads floors from `floorsOf(scene.id)`, exhibit titles from `exhibitsIn(scene.id)` home placements by `floor`.
  - useKeyboard: early-return also when `elevatorOpen`; E/Enter/Space with `padId === 'elevator'` and no `nearId` → `openElevator()`.
- [ ] **Step 4: Run** `npm test`, `npx tsc -b`, `npm run build`, `npm run e2e` — Expected: all PASS (HQ is still the generic stub; Stage 1 e2e unchanged).
- [ ] **Step 5: Screenshot** — HQ has no pad until Task 5 (the dialog is shot there): `node $SCRATCH/shot.mjs '#/b/hq-tower' hq-tower s2-t2-hq-generic 1`. Check: HUD reads `HQ Tower · Floor 1`, `data-floor="1"`, Stage 1 hall otherwise unchanged.
- [ ] **Step 6: Commit**
```bash
git add src/routing/routeWords.ts src/routing/routes.ts src/world/history.ts src/world/store.ts src/world/scene/SceneSwitcher.tsx src/world/scene/Player.tsx src/world/WorldApp.tsx src/world/useKeyboard.ts src/world/ui/Hud.tsx src/world/ui/MapDialog.tsx src/world/ui/Prompt.tsx src/world/ui/InteractButton.tsx src/world/ui/ElevatorDialog.tsx src/world/ui/world-ui.css tests/routes.test.ts tests/world/history.test.ts tests/world/store.test.ts tests/world/player-frame.test.ts tests/ui/scene-switcher.test.tsx tests/ui/world-keyboard.test.tsx tests/ui/world-hud.test.tsx tests/ui/map-dialog.test.tsx tests/ui/world-prompt.test.tsx tests/ui/elevator-dialog.test.tsx
git commit -m "feat(world): interior floors in scene and URL, elevator pad and dialog (ride = replaceState)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 3: Bespoke-interior kit, registry entries, stub folders, chunk keys

**Files:**
- Create: `src/world/logic/interior.ts`, `src/world/kit/{InteriorShell,InteriorMarkers,ShapeBatch,MediaBoard}.tsx`, stubs `src/world/interiors/{workshop,hq-tower,civic-center,campus-quad,hall-of-fame}/Interior.tsx` (each exactly `export { default, sceneGeometry } from '../generic/Interior';`)
- Modify: `src/world/interiors/registry.ts` (5 entries), `src/world/interiors/generic/Interior.tsx` and `src/world/interiors/gym/Interior.tsx` (render markers via `InteriorMarkers`), `src/world/kit/Sign.tsx` (board material gets `gradientMap` — ledger "Later" item), `scripts/check-dist.mjs` (`REQUIRED_SCENE_KEYS` + the five), `e2e/helpers.ts`
- Test: create `tests/world/interior.test.ts`, `tests/world/media-board.test.tsx`; modify `tests/world/registry.test.ts`, `tests/check-dist.test.ts`

**Interfaces:**
- Consumes: Task 1 types and content; existing `Room`, `Sign`, `ExitMat`, `ExhibitMarker`, `Lighting`, `instanceMatrices`, `materials.hull`, `gradientMap`, `reachable`, `triggerAt`, `PLAYER_R`, `inFront`.
- Produces:
```ts
// logic/interior.ts
export const PROP_SETBACK = 1.6, PROP_MAX_W = 3, PROP_MAX_D = 1.6, EXHIBIT_MIN_GAP = 3;
export const INTERIOR_EXIT: Trigger;      // { id: 'exit', rect: { x: 0, z: -0.45, w: 2.4, d: 0.9 } }
export const INTERIOR_ENTRANCE: Pose;     // { x: 0, z: -2, heading: NORTH }
export type InteriorSpec = { width: number; length: number; colliders: Rect[]; cameraDistance: number; cameraSouthPad?: number; entrance?: Pose; pads?: Pad[] };
export function placedIn(id: BuildingId, floor?: number): PlacedExhibit[];   // exhibitsIn order; floor filter (p.floor ?? 1) when floor given; throws `missing pos: <id>`
export function propAnchor(pos: [number, number]): [number, number];         // [x, z - PROP_SETBACK]
export function propCollider(pos: [number, number], w: number, d: number): Rect; // throws when w > 3 or d > 1.6
export function bespokeGeometry(id: BuildingId, spec: InteriorSpec, floor?: number): SceneGeometry; // doors [], exits [INTERIOR_EXIT], bounds from W×L, floor passed through
export function interiorProblems(g: SceneGeometry): string[];                // [] = valid; human-readable reasons
export function boardSize(m: Media, width: number): [number, number];        // [width, width * h / w], 9/16 when unknown
// kit
export type SignSpec = { text: string; position: [number, number, number]; rotationY?: number; board: ThemeColorKey; size?: number };
export function InteriorShell(p: { buildingId: BuildingId; spec: InteriorSpec; exhibits: readonly PlacedExhibit[]; theme: Theme; reducedMotion: boolean; floor: ThemeColorKey; wall: ThemeColorKey; wallHeight?: number; signs?: readonly SignSpec[]; children?: ReactNode }): JSX.Element; // daylight Lighting + Room + Signs + ExitMat + InteriorMarkers + children
export function InteriorMarkers(p: { exhibits: readonly PlacedExhibit[]; reducedMotion: boolean }): JSX.Element;  // titles from getExhibit, nearId + labelIds from useWorld
export function ShapeBatch(p: { shape: 'box' | 'cylinder' | 'sphere' | 'cone'; items: readonly InstanceItem[]; color: ThemeColorKey; outline?: boolean; glow?: number }): JSX.Element | null; // 1 instancedMesh (+1 hull when outline); unit geometry; disposes; null when items empty
export function MediaBoard(p: { media: Media; width: number; position: [number, number, number]; rotationY?: number; frame?: ThemeColorKey }): JSX.Element; // frame box + image plane (meshBasicMaterial, toneMapped false); own Suspense + error boundary → frame with ink face
// e2e/helpers.ts
export async function ready(page: Page, scene: string, floor?: number): Promise<void>; // also matches [data-floor="<floor>"] when given
```
`interiorProblems` checks, each with its reason string: exactly one exit, centred at x 0 with its south edge on `bounds.maxZ`; entrance inside bounds, outside exit and pads, ≥ `PLAYER_R` from every collider; every collider inside bounds; every exhibit's `inFront(pos)` inside bounds, ≥ `PLAYER_R` from colliders, outside exit and pads; exhibit rings pairwise ≥ `EXHIBIT_MIN_GAP`; each pad's `arrival` outside every pad and clear of colliders; `reachable(entrance, [...inFront poses, exit centre, pad centres], colliders, bounds)` all true.

- [ ] **Step 1: Write the failing tests**
  - `tests/world/interior.test.ts`: fixture spec `{ width: 12, length: 10, colliders: [propCollider([2, -6], 2, 1)], cameraDistance: 14 }` + exhibits `[{ id: 'a', pos: [2, -6] }]` → `interiorProblems(...)` = `[]`; `bespokeGeometry('workshop', spec)` bounds `{ minX: -6, maxX: 6, minZ: -10, maxZ: 0 }`, `exits` = `[INTERIOR_EXIT]`, `entrance` = `INTERIOR_ENTRANCE`, exhibits = `placedIn('workshop')` (6 ids in `exhibitsIn` order); `propAnchor([3, -7])` = `[3, -8.6]`; `propCollider([0,0], 3.1, 1)` and `(…, 1, 1.7)` throw; `placedIn('hq-tower', 3).map(e => e.id)` = `['oculogica', 'ai-camp']`, `placedIn('hq-tower').length` = 5; `placedIn('library')` throws `missing pos: books`; each failure mode yields a non-empty list naming it: collider over the entrance, two rings 2 m apart, a wall of colliders cutting off an exhibit, arrival inside its pad, exit moved to z −3; `boardSize({ src: '/media/x.webp', alt: '', width: 1280, height: 720 }, 3)` = `[3, 1.6875]`, no size → `[3, 1.6875]`.
  - `tests/world/media-board.test.tsx`: `MediaBoard` with `src` not starting `/media/` throws `MediaBoard: same-origin /media/ only`; the error boundary renders its fallback child when the loader throws (render the boundary component with a child that throws; assert the fallback renders and nothing is rethrown).
  - `tests/world/registry.test.ts`: add `it('every bespoke building (gym included) has a loader and every loader is bespoke')`: `Object.keys(interiorLoaders).sort()` = bespoke ids sorted.
  - `tests/check-dist.test.ts`: `REQUIRED_SCENE_KEYS` contains `src/world/interiors/<id>/Interior.tsx` for the five; a manifest missing `hall-of-fame` yields the warning `scene entry src/world/interiors/hall-of-fame/Interior.tsx missing from manifest; its chunk target is not checked`.
- [ ] **Step 2: Run** `npm test` — Expected: FAIL (modules missing).
- [ ] **Step 3: Implement** the kit, the five stubs and registry lines (`workshop: () => import('./workshop/Interior')`, etc.), and switch gym + generic to `InteriorMarkers` (generic drops its own `useFrame` label loop; `Player` already writes `labelIds`). `ShapeBatch` materials: `MeshToonMaterial({ color: theme.accents[color], gradientMap })`, plus `emissive` = same colour and `emissiveIntensity: glow`, `toneMapped: false` when `glow` is set.
- [ ] **Step 4: Run** `npm test`, `npx tsc -b`, `npm run build` (the five `interior-<id>` chunk lines print, no missing-key warning), `npm run e2e` — Expected: PASS; gym/generic draw calls unchanged (gym ≤ 150, hall ≤ 150).
- [ ] **Step 5: Screenshot** — `node $SCRATCH/shot.mjs '#/b/gym' gym s2-t3-gym` and `node $SCRATCH/shot.mjs '#/b/library' library s2-t3-library`. Check: gym and hall look exactly as before (markers, labels), sign boards now toon-shaded.
- [ ] **Step 6: Commit**
```bash
git add src/world/logic/interior.ts src/world/kit/InteriorShell.tsx src/world/kit/InteriorMarkers.tsx src/world/kit/ShapeBatch.tsx src/world/kit/MediaBoard.tsx src/world/kit/Sign.tsx src/world/interiors/registry.ts src/world/interiors/generic/Interior.tsx src/world/interiors/gym/Interior.tsx src/world/interiors/workshop/Interior.tsx src/world/interiors/hq-tower/Interior.tsx src/world/interiors/civic-center/Interior.tsx src/world/interiors/campus-quad/Interior.tsx src/world/interiors/hall-of-fame/Interior.tsx scripts/check-dist.mjs e2e/helpers.ts tests/world/interior.test.ts tests/world/media-board.test.tsx tests/world/registry.test.ts tests/check-dist.test.ts
git commit -m "feat(world): bespoke interior kit, stage 2 registry entries and chunk keys

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

**W1 common steps (Tasks 4–8).** Every builder task has the same test and e2e shape, so it is written once here; each task below gives only its specifics.

- **Unit test** `tests/world/interiors/<id>.test.ts`:
  - `it('geometry is valid')`: `interiorProblems(sceneGeometry('<id>'))` = `[]` (HQ: for floors 1–4).
  - `it('places exactly its exhibits at their content positions')`: `sceneGeometry('<id>').exhibits` = `placedIn('<id>')` (HQ: per floor, and the union over floors = the 5 HQ ids).
  - `it('camera')`: `cameraDistance` and `cameraSouthPad` equal the values the builder pins in `SPEC` (allowed range 12–18 and 0.5–2).
  - `it('signs')`: every string in `SIGNS` is in `SIGN_ALLOW_LIST` and `isFontSafe`; every `SignSpec.text` used by the interior is in `SIGNS` (export the `SignSpec[]` from `look.ts` so the test can read it).
  - `it('3D text is content-derived')`: any non-sign string the interior renders comes from an exported function of content (e.g. `bannerLines(banners)`), and the test asserts its exact output.
- **E2E** `e2e/interiors/<id>.spec.ts` (desktop project; `addInitScript` sets `world.started`):
  - `draw calls (full|low) <= 150` for `/#/b/<id>` and `/?fx=low#/b/<id>` (HQ: each floor via `/#/b/hq-tower/<n>`), logging the number, `> 1`, no console errors.
  - `every home exhibit deep link opens its panel here`: for each home id → `ready(page, '<id>'[, floor])`, `getByRole('dialog', { name: title })` visible, `pose` within 0.3 m of `inFront(pos)`.
  - `walk in from the entrance to the first exhibit prompt`: hold `ArrowUp` (and a sideways key if needed) until `[data-testid=prompt]` shows `data-exhibit` = the nearest exhibit; press `e` → dialog.
  - `walk out`: from entrance hold `ArrowDown` until `data-scene="world"`; pose ≈ `exitPose('<id>')` (workshop (30, −22.5), hq-tower (−12, −22.5), civic-center (12, −22.5), campus-quad (−30, −22.5), hall-of-fame (8, 0)) within 0.3.
- **Visual bar for the screenshot check:** room reads at a glance from the spawn view; each exhibit prop is recognizable as the spec's prop; labels clear the HUD; no z-fighting; colours on-palette; nothing looks like a logo.
- **Run order:** Step 1 tests → `npx vitest run tests/world/interiors/<id>.test.ts` FAIL → implement → PASS + `npm test` + `npx tsc -b` → `npm run build` (check `chunk interior-<id>` ≤ 120 KB, no new warnings) → e2e on the task's port → screenshot → commit owned paths only.

### Task 4: The Workshop

**Files:** Replace `src/world/interiors/workshop/Interior.tsx`; create `src/world/interiors/workshop/{geometry.ts,look.ts}`, `src/world/interiors/workshop/scene/{MoonGlobe,Storybook,Podiums,ServerRack,CityChart,EyeExhibit,Dressing}.tsx`; tests `tests/world/interiors/workshop.test.ts`, `e2e/interiors/workshop.spec.ts`.

**Interfaces:** Consumes Task 3 kit (`InteriorShell`, `ShapeBatch`, `MediaBoard`, `bespokeGeometry`, `propAnchor`, `propCollider`) and Task 1 positions. Produces `SPEC: InteriorSpec` (`width 20, length 16`), `sceneGeometry(id?: BuildingId | null): SceneGeometry`, `SIGNS = ['WORKSHOP']`, `WORKSHOP_LOOK`.

- [ ] **Step 1: Tests** per W1 common steps, plus `it('bar chart heights keep the 3:1 split')`: `CHART_BARS` (exported from `look.ts`) = `[3, 1]` relative heights (from the airbnb result of about 21,000 vs 7,000; bars carry no numbers or text).
- [ ] **Step 2: Build the room.** Workshop look: floor `slate`, walls `offWhite`, wallHeight 3.6, pegboard strip on the north wall (thin `stone` box) and instanced workbench boxes along the west and east walls (`ShapeBatch` `hardwood`, colliders along the walls only). Sign `WORKSHOP` on the north wall `[0, 2.6, -15.85]`, board `ink`.
- [ ] **Step 3: Props** (each at `propAnchor(pos)`, one `propCollider` each, outline on the exhibit prop only):
  - `MoonGlobe` (`tranquility-base`): `stone` sphere r 0.8 on an `ink` cylinder plinth h 0.9; 5 crater discs (flattened `slate` spheres, one `ShapeBatch`).
  - `Storybook` (`dreams-come-true`): two `offWhite` slabs 1.2 × 0.08 × 1.0 tilted ±0.25 rad on a `scarlet` cover box, on a low `hardwood` stand; `MediaBoard` `dreams-come-true/generated-book.webp` width 1.4 behind it.
  - `Podiums` (`debate-mate`): two `ink` podiums (box 0.7 × 1.1 × 0.5) facing each other 1.6 m apart with `scarlet` top strips; nothing written on them.
  - `ServerRack` (`zayi-ai-studio`): `ink` rack box 0.9 × 2.0 × 0.7 with an instanced row of `warmGlow` LED slits (`glow 1.2`, static); results board = `slate` board with 4 `scarlet` bars (no text).
  - `CityChart` (`airbnb-classifier`): 9 instanced `stone`/`offWhite` blocks of varied heights on a 2.4 × 1.4 base, plus a two-bar chart (`scarlet` 1.5 m, `ink` 0.5 m = `CHART_BARS` × 0.5).
  - `EyeExhibit` (mirror `oculogica`): `offWhite` sphere r 0.7 with `scarlet` iris disc and `ink` pupil facing south; `MediaBoard` `oculogica/correlation.webp` width 1.6 as the trace screen.
- [ ] **Step 4: Run** unit, tsc, build, e2e (port 4181) — Expected: PASS, draw calls ≤ 150 full and low.
- [ ] **Step 5: Screenshot** `PORT=4181 node $SCRATCH/shot.mjs '#/b/workshop' workshop s2-workshop`; check the visual bar.
- [ ] **Step 6: Commit** owned paths: `feat(world): bespoke Workshop interior` + trailer.

### Task 5: HQ Tower (four floors + elevator)

**Files:** Replace `src/world/interiors/hq-tower/Interior.tsx`; create `src/world/interiors/hq-tower/{geometry.ts,look.ts}`, `src/world/interiors/hq-tower/scene/{Elevator,FloorIT,FloorDojo,FloorMedLab,FloorAiLab}.tsx`; tests `tests/world/interiors/hq-tower.test.ts`, `e2e/interiors/hq-tower.spec.ts`.

**Interfaces:** Consumes Task 2 (`SceneProps.floor`, `Pad`, `ElevatorDialog` via WorldApp, `data-floor`, `ready(page, scene, floor)`), Task 3 kit, `floorsOf('hq-tower')`. Produces `HQ_ELEVATOR: Pad` (contract values), `ELEVATOR_CAR: Rect`, `FLOOR_SPECS: Record<1|2|3|4, InteriorSpec>` (all `width 16, length 12`; floor 1 entrance `INTERIOR_ENTRANCE`, floors 2–4 entrance = `HQ_ELEVATOR.arrival`), `sceneGeometry(id?: BuildingId | null, floor?: number): SceneGeometry` (invalid/undefined floor → 1; `geometry.floor` always set; `pads: [HQ_ELEVATOR]`), `SIGNS = ['HQ TOWER', 'ELEVATOR', ...floorsOf('hq-tower').map(f => f.sign)]`.

- [ ] **Step 1: Tests** per W1 common steps (all floors), plus:
  - `it('floor argument')`: `sceneGeometry('hq-tower', 7).floor` = 1, `sceneGeometry('hq-tower').floor` = 1, `sceneGeometry('hq-tower', 3).exhibits.map(e => e.id)` = `['oculogica', 'ai-camp']`; floor 2 entrance = `HQ_ELEVATOR.arrival`.
  - `it('elevator lane is clear on every floor')`: no collider of any floor intersects `{ x: -5.5, z: -6.3, w: 2, d: 8.6 }` or `{ x: -3, z: -2, w: 7, d: 2 }`.
  - E2E additions:
    - `elevator ride replaces history and Back leaves the building`: cold `/#/b/hq-tower` → floor 1; `holdUntil ArrowLeft x <= -5.5`, then `ArrowUp` until `getByRole('dialog', { name: 'Elevator' })` visible; Floor 1 button focused with `aria-current="true"`; focus `Floor 3` button, press Enter → `ready(page, 'hq-tower', 3)`, hash `#/b/hq-tower/3`, `history.length` unchanged, pose ≈ (−5.5, −7.6); `goBack()` → world, pose ≈ (−12, −22.5); `goForward()` → floor 3.
    - `Esc, stand, step off and on`: on the pad, Escape closes the dialog; wait 1000 ms → still closed; press `e` → reopens; Escape; hold `ArrowDown` 400 ms then `ArrowUp` back onto the pad → reopens once.
    - `deep links on other floors`: `/#zayi-fellow` → floor 4, dialog `AI Fellow`, Escape → hash `#/b/hq-tower/4`; Map → the `Machine Learning Research Intern` button (name contains `Floor 3`) → floor 3 with panel, `history.length` + 1; `goBack()` → floor 4, no panel.
    - `reduced motion ride has no fade` (`test.use({ reducedMotion: 'reduce' })`, explicit `/#/b/hq-tower`): record `data-transition` values per frame as in `world-perf.spec.ts`; ride to Floor 2 → `fading-out` never seen.
    - `tablet tap` (mobile project, 820×1180, `hasTouch`): `/#/b/hq-tower`, walk to the pad with arrow keys, `tap()` Floor 2 → floor 2; every floor button's bounding box height ≥ 44.
- [ ] **Step 2: Build the shared shell.** `Elevator.tsx`: `ink` elevator car box at `ELEVATOR_CAR` with `stone` doors (outlined, it is interactive), a `warmGlow` floor-indicator strip (`glow 0.8`, static), a `scarlet` pad plate on the floor at the pad rect, `ELEVATOR` sign above the doors. Floor sign (`floorsOf(...)[floor-1].sign`) on the north wall `[2, 2.6, -11.85]`; `HQ TOWER` sign only on floor 1 at the south-west `[-5, 0.9, -0.2]` board `ink`, size 0.35 (low south wall). Walls `offWhite`, wallHeight 3.4; floors vary by level: F1 `slate`, F2 `hardwood`, F3 `offWhite` with `sky` trim, F4 `stone`.
- [ ] **Step 3: Floor props** (only the current floor renders; prop at `propAnchor(pos)`, collider via `propCollider`):
  - F1 `FloorIT` (`shah-sokoloff`): two instanced `ink` server racks with `warmGlow` LED rows, a cable tray (`slate` box) overhead, a help-desk counter with a laptop (thin `slate` slab).
  - F2 `FloorDojo` (`code-ninjas`): instanced `scarlet`/`ink` floor mats (flat boxes), 4 low desks with laptops (`ShapeBatch`), a `slate` whiteboard; no belts with text, no brand marks.
  - F3 `FloorMedLab` (`oculogica`, `ai-camp`): lab bench with an eye-scan station (`offWhite` sphere + `ink` chin-rest) for `oculogica` and `MediaBoard` `oculogica/threshold-3.webp` width 1.4; a second bench with two monitors (`warmGlow` faces) for `ai-camp`.
  - F4 `FloorAiLab` (`zayi-fellow`): open-office pod of 4 desks + monitors (instanced), a stack of document boxes (instanced `offWhite`, the retrieval corpus) and a `slate` whiteboard with abstract node-and-line diagram (thin boxes, no text).
- [ ] **Step 4: Run** unit, tsc, build, e2e (port 4182) — Expected: PASS; all eight draw-call cases ≤ 150.
- [ ] **Step 5: Screenshots** `PORT=4182 node $SCRATCH/shot.mjs '#/b/hq-tower' hq-tower s2-hq-tower 1`, then `'#/b/hq-tower/2' … s2-hq-tower-f2 2`, `/3 … s2-hq-tower-f3 3`, `/4 … s2-hq-tower-f4 4`, and one with the dialog open (`s2-hq-tower-elevator`, via a scratch Playwright step that walks to the pad). Check the visual bar; each floor distinct at a glance; dialog legible, current floor marked.
- [ ] **Step 6: Commit** owned paths: `feat(world): bespoke HQ Tower with four floors and elevator` + trailer.

### Task 6: Civic Center

**Files:** Replace `src/world/interiors/civic-center/Interior.tsx`; create `src/world/interiors/civic-center/{geometry.ts,look.ts}`, `src/world/interiors/civic-center/scene/{LectureHall,JudgingHall,Classroom,TourDesk,Bench,Dividers}.tsx`; tests `tests/world/interiors/civic-center.test.ts`, `e2e/interiors/civic-center.spec.ts`.

**Interfaces:** Consumes Task 3 kit, Task 1 positions. Produces `SPEC` (`width 22, length 16`), `sceneGeometry`, `SIGNS = ['CIVIC CENTER', 'LECTURE HALL', 'JUDGING HALL', 'CLASSROOM', 'TOUR DESK', 'MENTORSHIP BOARD']`, `CIVIC_LOOK`.

- [ ] **Step 1: Tests** per W1 common steps, plus `it('tour desk serves two exhibits')`: one collider spans x [−6.5, −1.5] at z −7.6 (depth ≤ 1.2) and both `honors-ambassador` and `orientation-leader` pass `interiorProblems`.
- [ ] **Step 2: Build the room.** Floor `stone`, walls `offWhite` with a `scarlet` dado strip, wallHeight 3.6. Low `ink` dividers (h ≤ 1.0, so the camera sees over them) separating the three north rooms at x = ±3.5 from z −16 to −10. Room signs on the north wall at x −7, 0, 7 (`LECTURE HALL`, `JUDGING HALL`, `CLASSROOM`, size 0.35); `CIVIC CENTER` low on the south wall west of the exit; `TOUR DESK` on the desk front; `MENTORSHIP BOARD` above the board.
- [ ] **Step 3: Props:**
  - `LectureHall` (`usacs`): three tiered rows of instanced `hardwood` benches (rising 0.25 m per row) facing a lectern at the north wall, plus a mentorship board (`slate` board with instanced `scarlet`/`offWhite` pin cards, no text).
  - `JudgingHall` (`hackru`): judges' table with three chairs facing south and two instanced project tables with laptops (`warmGlow` screens).
  - `Classroom` (`calc-ii-la`): 2 × 3 instanced desks, a `slate` chalkboard with thin `offWhite` curve strokes (an integral sign shape from boxes is fine; no words).
  - `TourDesk` (`honors-ambassador`, `orientation-leader`): one long `scarlet`-fronted desk with `offWhite` top, a stack of brochure slabs and a small campus-map board (flat coloured blocks, no names).
  - `Bench` (`teaching-mentoring`): a park-style bench (`hardwood` slats instanced, `ink` legs) with a low `offWhite` table and two book slabs.
- [ ] **Step 4: Run** unit, tsc, build, e2e (port 4183) — Expected: PASS.
- [ ] **Step 5: Screenshot** `PORT=4183 node $SCRATCH/shot.mjs '#/b/civic-center' civic-center s2-civic-center`; check the visual bar.
- [ ] **Step 6: Commit** owned paths: `feat(world): bespoke Civic Center interior` + trailer.

### Task 7: Campus Quad

**Files:** Replace `src/world/interiors/campus-quad/Interior.tsx`; create `src/world/interiors/campus-quad/{geometry.ts,look.ts}`, `src/world/interiors/campus-quad/scene/{Quad,HonorsHall,ScreeningRoom,Certificate,RoboticsLab,WingProps}.tsx`; tests `tests/world/interiors/campus-quad.test.ts`, `e2e/interiors/campus-quad.spec.ts`.

**Interfaces:** Consumes Task 3 kit (`MediaBoard` for the poster and the team photo), Task 1 positions, `getStation('critics-choice').video.poster`, `getStation('robotics').media`. Produces `SPEC` (`width 26, length 20`), `sceneGeometry`, `SIGNS = ['CAMPUS QUAD', 'HONORS HALL', 'SCREENING ROOM', 'HIGH SCHOOL WING', 'ROBOTICS LAB']`, `QUAD_LOOK`, `ROBOTICS_PHOTO: Media`.

- [ ] **Step 1: Tests** per W1 common steps, plus `it('robotics uses the team photo, never the logo')`: `ROBOTICS_PHOTO.src` = `'/media/robotics/team-photo.webp'` and no string in the folder's exported constants contains `logo`; `it('documentary screen uses the critics-choice poster')`: the screen's media `src` = `'/media/critics-choice/poster.webp'`.
- [ ] **Step 2: Build the quad.** Floor: `grass` lawn centre panel with `path` walkways (a cross path at x 0 and a band at z −12.5), walls `offWhite` with `scarlet` trim, wallHeight 3.2. A low hedge (`grass` boxes, h 0.8) at z −12.5 from x −13 to −2 and 2 to 13 separates the college row (north) from the high-school wing (south); the 4 m gap at x 0 stays open. `HONORS HALL` above `rutgers-honors`, `SCREENING ROOM` above the screen, `HIGH SCHOOL WING` on the hedge's west half facing south, `ROBOTICS LAB` above `robotics`, `CAMPUS QUAD` low on the south wall. A few instanced trees (cone + cylinder) in the lawn corners, outside every exhibit's `inFront`.
- [ ] **Step 3: Props:**
  - `HonorsHall` (`rutgers-honors`): a small colonnade facade (4 instanced `offWhite` columns, `scarlet` pediment box) with a bookshelf and two framed diploma slabs (`offWhite` with `ink` frame; no seal, no text).
  - `ScreeningRoom` (`critics-choice` home): `MediaBoard` poster width 3.2 on an `ink` stand, plus two short rows of instanced seats. 3D shows the poster only; the panel's click-to-load video is unchanged.
  - `Certificate` (`ccm`): a large framed certificate on an easel (`offWhite` sheet, `mustard` ribbon disc, `ink` frame; no text, no seal).
  - `RoboticsLab` (`robotics`): `MediaBoard` `ROBOTICS_PHOTO` width 2.2 on a lab wall panel, a robot chassis (box + 4 cylinder wheels + arm box, `scarlet`/`ink`), and an AprilTag board: a 6×6 grid of instanced `ink`/`offWhite` squares on a stand (generic fiducial pattern, not a logo).
  - `WingProps`: `advisory-council` round table + 6 instanced chairs; `hackmcst` two hackathon tables with laptops and a blank `scarlet` banner cloth (no text); `nslc` small stage + lectern; `java-juniors` two desks with laptops and an oversized coffee mug (cylinder body + box handle).
- [ ] **Step 4: Run** unit, tsc, build, e2e (port 4184) — Expected: PASS; the e2e deep-link test for `critics-choice` lands here (home), dialog shows the `Play` button and no iframe until clicked.
- [ ] **Step 5: Screenshot** `PORT=4184 node $SCRATCH/shot.mjs '#/b/campus-quad' campus-quad s2-campus-quad`; check the visual bar; poster and team photo are sharp and upright; no logo anywhere.
- [ ] **Step 6: Commit** owned paths: `feat(world): bespoke Campus Quad interior` + trailer.

### Task 8: Hall of Fame

**Files:** Replace `src/world/interiors/hall-of-fame/Interior.tsx`; create `src/world/interiors/hall-of-fame/{geometry.ts,look.ts}`, `src/world/interiors/hall-of-fame/scene/{Banners,Trophies,FameScreen}.tsx`; tests `tests/world/interiors/hall-of-fame.test.ts`, `e2e/interiors/hall-of-fame.spec.ts`.

**Interfaces:** Consumes Task 3 kit, `banners` content, Task 1 positions. Produces `SPEC` (`width 20, length 16`), `sceneGeometry`, `SIGNS = ['HALL OF FAME']`, `bannerLines(bs: readonly Banner[]): string[]` (each `toFontSafe(\`${b.title}\n${b.year}\`)`), `FAME_LOOK`.

- [ ] **Step 1: Tests** per W1 common steps, plus `it('banner cloth text is exactly title and year')`: `bannerLines(banners)` has 7 entries, entry 0 = `"Critic's Choice Prize\n" + banners[0].year`, all font-safe; `it('mirror screen is last and on the east')`: `sceneGeometry('hall-of-fame').exhibits.at(-1)` = `{ id: 'critics-choice', pos: [7.5, -6] }`.
- [ ] **Step 2: Build the hall.** Floor `stone` with an `ink` runner carpet down x 0, walls `offWhite`, wallHeight 5, `scarlet` pilasters (instanced). `HALL OF FAME` on the north wall `[0, 4.2, -15.85]`, board `scarlet`.
- [ ] **Step 3: Props:**
  - `Trophies`: one pedestal per banner exhibit at `propAnchor(pos)` (kit `Pedestals`, `stone`), each topped with a trophy (instanced `mustard` cylinder cup + cone base + sphere knob: three `ShapeBatch` calls for all 7).
  - `Banners`: 7 hanging cloths (`ShapeBatch` boxes 1.1 × 1.8 × 0.05 alternating `scarlet` / `ink`) at y 3.6 above each pedestal with a thin `mustard` rod; text = `bannerLines` on the cloth face (7 `<Text>`, size ≤ 0.16, `maxWidth` 1.0, `offWhite`). Total text = 7 + 1 sign + ≤ 6 labels = 14.
  - `FameScreen` (mirror `critics-choice`): `MediaBoard` critics-choice poster width 2.6 on an `ink` stand at `propAnchor([7.5, -6])`.
- [ ] **Step 4: Run** unit, tsc, build, e2e (port 4185) — Expected: PASS; e2e also asserts that `/#critics-choice` lands in `campus-quad` (home), not here, and that walking to the screen ring and pressing `e` here opens the `Critic's Choice Documentary` dialog with `data-scene` still `hall-of-fame`.
- [ ] **Step 5: Screenshot** `PORT=4185 node $SCRATCH/shot.mjs '#/b/hall-of-fame' hall-of-fame s2-hall-of-fame`; check the visual bar; banner text legible at zoom ×1, no banner hides a back-row ring.
- [ ] **Step 6: Commit** owned paths: `feat(world): bespoke Hall of Fame interior` + trailer.

---

### Task 9: Integration — cross-building e2e, budgets, guards

**Files:**
- Create: `e2e/world-stage2.spec.ts`, `tests/world/interiors/all.test.ts`
- Modify: `e2e/world-perf.spec.ts` (generic-hall case → `#/b/library`, scene `library`)

**Interfaces:** Consumes every builder's `sceneGeometry` and `SIGNS`, Task 2 `ready(page, scene, floor)`.

- [ ] **Step 1: Write the tests**
  - `tests/world/interiors/all.test.ts`: for `workshop`, `civic-center`, `campus-quad`, `hall-of-fame` and HQ floors 1–4: `interiorProblems` = `[]`; union of exhibit ids per building = `exhibitsIn(id)` ids; every folder's `SIGNS` ⊆ `SIGN_ALLOW_LIST`; `Object.keys(interiorLoaders).sort()` = bespoke ids; no folder module imports `generic` anymore (read the five `Interior.tsx` files with `fs` and assert none contains `../generic/`).
  - `e2e/world-stage2.spec.ts` (desktop):
    - `every station and banner deep link lands home with its panel`: literal table of 31 ids → `{ scene, floor? }` (24 stations per the contracts table, 7 banners → `hall-of-fame`); for each `/#<id>` → `ready`, one `dialog` visible, pose within 0.3 m of `inFront(pos)` (pos read from `src/content`).
    - `mirrors never change the home`: `/#oculogica` → `hq-tower` floor 3 (not workshop); in `/#/b/workshop` walk `ArrowUp` to the prompt with `data-exhibit="oculogica"`, `e` → dialog `Machine Learning Research Intern`, `data-scene` stays `workshop`.
    - `fast travel across buildings and floors`: start `/#/b/workshop`, Map → `AI Fellow` (HQ floor 4) → `ready(…, 'hq-tower', 4)`; `goBack()` → `workshop`; `goForward()` → floor 4.
    - `walk out of every career building`: for each of the five, cold `/#/b/<id>`, hold `ArrowDown` → world, pose ≈ `exitPose(id)`, then 1500 ms later still `world` (no re-trigger).
    - `media failure keeps interiors working` (Review Focus 5): `page.route('**/media/**', r => r.abort())`; `/#/b/campus-quad`, `/#/b/hall-of-fame`, `/#/b/workshop`, `/#/b/hq-tower/3` all reach ready, draw calls ≤ 150, no page errors (ignore `Failed to load resource|ERR_FAILED` console lines only).
    - `no external requests touring all five`: `trackExternal` empty.
  - Mobile project: `tablet: Explore → Map → Campus Quad → ready, joystick visible, draw calls <= 150`.
- [ ] **Step 2: Run** `npm test` and `npm run e2e` — Expected: PASS (all W1 work merged). Fix only test code here; a product defect goes back to the owning builder task.
- [ ] **Step 3: Budgets** — `npm run build`. Expected: `JS gzip size` ≤ 200 KB, `Arena total gzip` < 5120 KB, `chunk interior-workshop|hq-tower|civic-center|campus-quad|hall-of-fame` each ≤ 120 KB, no `warn:` lines. Record the numbers in the commit body.
- [ ] **Step 4: Screenshots** — `node $SCRATCH/shot.mjs '#/world' world s2-world` (exteriors unchanged) and `'#ai-camp' hq-tower s2-deeplink-ai-camp 3` (panel open on floor 3).
- [ ] **Step 5: Commit**
```bash
git add e2e/world-stage2.spec.ts e2e/world-perf.spec.ts tests/world/interiors/all.test.ts
git commit -m "test(world): stage 2 deep links, floors, mirrors, media failure and budgets

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 10: README and final verification

**Files:** Modify `README.md` (sections "Brayden's World", "Add a bespoke interior", "Budgets and effects mode").

- [ ] **Step 1: README** — list the six bespoke interiors; document `#/b/hq-tower/<n>`, the elevator (walk onto the pad or press E on it; ride = replace, Back leaves the building); rewrite "Add a bespoke interior": author `pos` for every placement and set `bespoke: true` in content, add allow-list strings, create `src/world/interiors/<id>/` (Interior, geometry with `bespokeGeometry`, look with `SIGNS`), one registry line, one `REQUIRED_SCENE_KEYS` line, tests with `interiorProblems`, an e2e draw-call case. Note per-interior draw calls measured in Tasks 4–9.
- [ ] **Step 2: Verify** — `npm test`, `npx tsc -b`, `npm run build`, `npm run e2e`: all PASS. Privacy scan of the tree: `node -e` script that runs `findPrivateTerm` (with `loadPrivateTerms()`) and `PHONE_PATTERN` over every `git ls-files` text file → 0 hits; `git grep -nE "logo\.webp" -- src` → only `stations.ts` (Box Score card media), none under `src/world`.
- [ ] **Step 3: Screenshot** — `node $SCRATCH/shot.mjs '#/b/hall-of-fame' hall-of-fame s2-final-hof` as the release check.
- [ ] **Step 4: Commit**
```bash
git add README.md
git commit -m "docs: stage 2 career buildings, HQ floors, bespoke interior recipe

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Self-review notes

- Spec coverage: §15 Stage 2 buildings → Tasks 4–8; HQ floors + elevator (§5.6, §10 `floor`) → Tasks 1, 2, 5; §11 `bespoke` + `pos` schema → Task 1; §6 routing/history (floor added) → Task 2; §7 one panel, video only in the DOM → Tasks 7, 8 (poster only); §8 chunks/draw calls → Tasks 3, 4–9; §12 art rules → Global Constraints + each builder; §13 a11y (dialog, focus, touch, reduced motion) → Tasks 2, 5; §14 tests → every task; signage rule → Task 1 allow-list + builder `SIGNS` tests + Task 9.
- Ledger "Later" folded in: Sign `gradientMap` (Task 3). Left out (not Stage 2 files): heading levels in the Box Score collection list, `role=application` scope, fast-travel Back pose, roof z-fighting, Pages `PRIVATE_TERMS` secret.
- Interfaces checked across tasks: `sceneGeometry(id, floor?)`, `Scene.floor`, `Pad.arrival`, `ride(floor)`, `placedIn`, `propAnchor`, `interiorProblems`, `ready(page, scene, floor?)`, `SIGNS`.

---

## Owner amendments (2026-11-23) — override anything above

**A1. HQ Tower stairs go down one floor.** The south exit on floor n > 1 is a stairwell to floor n − 1 (arrive at that floor's stair landing, facing north), not out of the building. Only floor 1's south exit leaves the tower. Stair travel is a floor change (replaceState, like the elevator). The elevator dialog keeps all four floors, and also gets "Up" / "Down" buttons to the adjacent floor (disabled at the ends). Tests: on floor 3, walking into the south exit gives `#/b/hq-tower/2`; on floor 1 it exits to the world at the HQ door; Back from any floor leaves the building.

**A2. Cinema becomes bespoke in Stage 2 (Task 8b, W1, owns `src/world/interiors/cinema/**`).** It's a real movie theater: entrance lobby (ticket counter, concession stand) → a lit hallway lined with the 12 favorite-film posters in the owner's order (from `src/content/films.ts`) → an auditorium with a big screen, rows of seats (instanced), and the screen showing the documentary poster. Interacting at the screen opens `critics-choice` (the video plays in the panel after a click; still no cross-origin before it). Each hallway poster is an exhibit-like stop that opens the movies interest panel focused on the films list. Posters are original stylized designs (title text from content + simple shapes/colour blocks); no studio poster art, logos, or real theater branding. Signs (add to the allow-list): "NOW SHOWING", "TICKETS", "CONCESSIONS", "THEATER 1". Draw calls ≤ 150 (full and `?fx=low`). Task 1 sets `bespoke: true` for cinema and adds positions; Task 3 adds the registry stub.
