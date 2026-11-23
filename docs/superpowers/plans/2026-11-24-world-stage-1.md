# Brayden's World — Stage 1 (World Shell) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single 3D arena with a walkable top-down town: every building and exhibit exists from day one (13 interiors behind doors, a Scouting Office that opens the Box Score, 4 outdoor spots), the Gym is the first bespoke interior, every other interior is the auto-laid-out generic Exhibit Hall, and every deep link (`#<exhibit>`, `#/b/<id>`, `#/box-score`, legacy `#/arena`) lands in the right place with correct Back/Forward.

**Architecture:** `src/arena` becomes `src/world` (git mv). One `<Canvas>` for the session; a `SceneSwitcher` swaps the outdoor `world` scene and lazy interior chunks (`interiors/registry.ts`). Movement, collision, doors, camera, layout, generic-hall layout, routing and history planning are pure modules with unit tests; a single `history.ts` module owns every URL write. Content gains a building/exhibit model (`buildings.ts`, `interests.ts`, `mirrors.ts`, `exhibits.ts`, collections) shared by the 3D panel, the Map dialog and the Box Score.

**Tech Stack:** unchanged — React 18 + TS + Vite 5, R3F 8 / drei 9 / three 0.187, `@react-three/postprocessing@2`, Zustand 5, Vitest, Playwright, Cloudflare Pages. **No new dependencies** (merged massing uses `three/examples/jsm/utils/BufferGeometryUtils`, already in three).

**Spec:** `docs/superpowers/specs/2026-11-23-braydens-world-design.md` (binding; Stage 1 = §15). Site-wide rules from `docs/superpowers/specs/2026-11-21-arena-portfolio-design.md` stay binding. Conventions from `docs/superpowers/plans/2026-11-23-arena-look.md`. Content inputs: `_source/docs/library-and-theater.md` (films + books, private file; titles become public content), existing `src/content/*`.

## Global Constraints

- Privacy: never publish a phone number (`PHONE_PATTERN`) or a private term (`loadPrivateTerms`/`findPrivateTerm`, also scanned in built HTML/JS/GLB by `check-dist`). Never mention roles the owner omitted. Never write the high-school team nickname on its own, in text or image (robotics "Tech Devils" full name is allowed). Do not add the nickname to the private-terms file.
- No organization/business/school logos, crests, box art, posters, album covers. Signs use the generic allow-list (Task 2) or `^Brayden's `. Team/game/film/artist names are plain text only. No raw reference photos in repo or build.
- Palette: scarlet `#cc0033`, ink `#0a0a0a`, off-white `#f4f0ea`, neutrals, plus the named accent list in `theme.accents` (Task 2). Every look value lives in `src/world/look/theme.ts`.
- Budgets (hard, build fails): initial JS ≤ 200 KB gzip, three/R3F/zustand only reachable via dynamic import (`three.js in initial bundle` guard); total gzip of `dist/assets/**` + `dist/models/**` < 5 MB. Targets (warning only): engine ≤ 400 KB, world scene ≤ 150 KB, Gym ≤ 150 KB, each other interior ≤ 120 KB gzip JS. Player GLB ≤ 400 KB raw (existing guard).
- Perf: 60 fps mid laptop; `dpr` `[1, 1.75]`, coarse pointer `[1, 1.5]`, low-power `1`; no shadow maps; draw calls (whole frame, existing ReadySignal method) **world ≤ 200, each interior ≤ 150**; troika `<Text>` ≤ 24 per scene; labels only for the nearest 6 exhibits; outlines only on player, doors, interactive props.
- No cross-origin requests (fonts local, `useGLTF(url, false)`, every 3D string through `toFontSafe`); YouTube only after a click, `youtube-nocookie`, never in WebGL, never autoplay before click.
- `canRunArena` unchanged: phones (coarse + short side < 768), reduced motion, no WebGL, deviceMemory < 4 → Box Score default with "Explore Brayden's World". Reduced motion in 3D: no fades, snap camera, no ambient animation, bloom × 0.6. Low power (`?fx=low`, `VITE_ARENA_FX=low`, FPS monitor): no composer, dpr 1.
- Accessibility: in 3D, "Skip to box score" is first in tab order, then Scouting Office, Map. Letter keys (WASD, E, M) and Enter/Space-to-interact only act while the world wrapper (or `body`) has focus (WCAG 2.1.4). Panel and Map are focus-trapped, Esc closes, focus returns to the wrapper.
- Versions: R3F 8 / drei 9 / three 0.187 / postprocessing-react 2 only. No physics engine, no new runtime deps.
- No same-name-different-case files (Windows).
- Branch `world-stage-1` cut from local `phase-3-look` (Stage 0 Task 9 landed at `67e26fc`). Never push dev branches; owner publishes by squash onto `main` after review; nothing deploys before Stage 1 is done. Every commit ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Between Task 2 and Task 19 the 3D view is mid-migration: **`npm test` and `npx tsc -b` must pass at every commit**; `npm run e2e` is required only in Tasks 1, 19, 20, 21.

## Review Focus

1. **Door re-trigger loop** — spawning or returning inside a door/exit trigger (exit pose, Back restore, Box Score round trip, cold load) bounces the player between scenes. Expect: a trigger fires only on an outside→inside transition, and every exit pose is outside all triggers. (Task 4 exit-pose test, Task 7 latch test, Task 20 "stand still after exit" e2e)
2. **Interior chunk fails or is slow** (offline, stale deploy hash) → toast "Couldn't open this building", player back at that door, world still walkable, URL restored, no unhandled rejection, and a later retry works (rejected loads are not cached; prefetch failures are swallowed). (Task 2 registry test, Task 19 SceneSwitcher test, Task 20 aborted-chunk e2e)
3. **History desync under rapid input** — Back pressed mid-fade, a door hit while a map jump is loading, popstate during loading → the final scene matches the URL and no duplicate entries are pushed. (Task 8 history tests "go while pending", "popstate while loading"; Task 20 Back-mid-fade e2e)
4. **Keys leaking out of text inputs and buttons** — typing "m"/"e"/"w" in the books filter or with focus on a HUD button moves the player, reopens the Map, or Space double-activates. Expect: no world action while typing, letters only with wrapper/body focus, and Space on a focused button is the button's own click. (Task 13 keyboard tests, Task 14 map/panel filter test)
5. **Hostile or ambiguous hashes** — `#/b/`, `#/b/tranquility-base`, `#%E0%A4%A`, `#/b/scouting-office`, `#chess` (home is an outdoor spot), `#rising-star` (home Hall of Fame, mirrored in Gym), `#critics-choice` (home Campus Quad, mirrored in Cinema and Hall of Fame). Expect: no throw, unknown → world at spawn / Box Score, mirrors never change the home building. (Task 3 route table, Task 8 target table, Task 20 `#critics-choice` e2e)

---

## File Structure

```
src/world/                         (git mv from src/arena; tests/arena → tests/world)
  WorldApp.tsx                     one Canvas, SceneSwitcher, overlays, history sync wiring          (T19)
  store.ts                         + scene, worldPose, phase, pending, geometry, labels, map, toast, zoom (T8)
  history.ts                       pure route→target planning + the only URL-writing adapter          (T8)
  types.ts                         Pose, Bounds, Rect, Scene, Target, Trigger, SceneGeometry, SceneProps, SceneModule (T2)
  look/theme.ts                    + accents, districts, daylight                                        (T2)
  logic/layout.ts                  map bounds, lots, doors, exit poses, colliders, flood fill          (T4)
  logic/{collide,movement,input}.ts  circle-vs-AABB, 8-dir step, keys/joystick → vector              (T5)
  logic/camera.ts                  top-down offset, zoom steps, dead-zone follow, clamp                (T6)
  logic/{doors,hall}.ts            trigger test, latch, prefetch radius; generic hall layout            (T7)
  logic/{labels,proximity,fx,locomotion,fontSafe,visited}.ts   existing (labels + visited extended)
  kit/                             Room, Sign, Pedestals, ExhibitMarker, DoorFrames, ExitMat, instancing (T11)
  scene/                           Player, CameraRig, ReadySignal, SceneSwitcher, Lighting, Effects, FxGovernor, GlowPulse, Outline, materials, avatar/
  world/                           outdoor scene chunk: WorldScene.tsx, geometry.ts, massing.ts, signs.ts, parts  (T15)
  interiors/registry.ts            scene loaders (+ the one gym line)                                  (T2, T17)
  interiors/generic/               Exhibit Hall (Interior.tsx + geometry.ts)                           (T16)
  interiors/gym/                   restyled arena (moved scene/logic files) + geometry                 (T17)
  ui/                              Hud, Panel, MapDialog, Toast, Prompt, Joystick, InteractButton, Fade, focusTrap.ts (T13, T14, T19)
src/content/                       types, buildings, interests (replaces lockerRoom), mirrors, exhibits, collections, books, films, games, artists, teams (T2, T9)
src/routing/routes.ts              parseRoute / resolveScreen / needsStartScreen (T3); hash.ts removed (T19)
src/routing/routeWords.ts          ROUTE_WORDS (T2)
src/ui/{ExhibitContent,CollectionList,ContactContent}.tsx   shared by Panel and Box Score (T10)
src/boxscore/*, src/shell/StartScreen.tsx, src/App.tsx, src/shell/loadWorld.ts  (T18, T19)
scripts/check-dist.mjs, vite.config.ts                       chunk targets via Vite manifest (T12)
e2e/helpers.ts (T19), e2e/world.spec.ts (T20), e2e/world-perf.spec.ts, e2e/gym-look.spec.ts, e2e/boxscore.spec.ts (T21)
```

## Shared contracts (read by every task)

**Ids.** Buildings (`BuildingId`): `scouting-office` (overlay), `hall-of-fame`, `mailbox` (spot), `workshop`, `hq-tower`, `civic-center`, `campus-quad`, `gym`, `golf-clubhouse`, `library`, `cinema`, `record-store`, `playhouse`, `arcade`, `fan-shop` (interiors), `chess-park`, `park`, `running-loop` (spots). Building `golf-clubhouse` (not `golf`) because interest `golf` keeps its id. Route words: `world`, `b`, `box-score`, `arena`. Exhibits = 24 stations + 7 banners + 13 interests + `contact` = **45** (`EXHIBIT_COUNT`).

**Home buildings.** workshop: `tranquility-base dreams-come-true debate-mate zayi-ai-studio airbnb-classifier`; hq-tower: `zayi-fellow`(floor 4) `oculogica`(3) `ai-camp`(3) `code-ninjas`(2) `shah-sokoloff`(1); civic-center: `usacs hackru calc-ii-la honors-ambassador orientation-leader teaching-mentoring`; campus-quad: `rutgers-honors critics-choice ccm robotics advisory-council hackmcst nslc java-juniors`; hall-of-fame: all 7 banners; gym: `basketball` (pos `[3, 5]`); golf-clubhouse: `golf`; library: `books`; cinema: `movies`; record-store: `music karaoke`; playhouse: `stranger-things`; arcade: `rocket-league fifa games`; fan-shop: `teams`; chess-park: `chess`; park: `roundnet`; mailbox: `contact`. Mirrors (in this order): `oculogica`→workshop, `critics-choice`→cinema, `critics-choice`→hall-of-fame, `rising-star`→gym (pos `[-3, -7]`).

**Axes.** Ground plane x (east +) and z (south +); **north = −z**. `Pose.heading` keeps the Phase 2 convention (0 faces +x, avatar `rotation.y = −heading`), so `NORTH = −π/2`, `SOUTH = π/2`. Every door is on its building's south face.

**World wrapper DOM attributes** (`.world` div, set by T13/T19, read by e2e): `data-ready` (`"true"` one frame after a scene commit, `"false"` from `go()` until then), `data-scene` (`world` or the interior's building id), `data-draw-calls` (frame 30 of the current scene, `""` before), `data-transition` (`idle|fading-out|loading|fading-in`), `data-pose` (`"x,z"` 2 dp, every 6 frames), `data-fx`, `data-motion`, `data-avatar`, `data-world-focus`, `role="application"`.

**World layout** (Task 4 data; metres, rect = centre x,z + width w (x) × depth d (z); door = `(x, z + d/2)`):

| id | rect (x, z, w, d) | door / spot point |
|---|---|---|
| scouting-office | −8, −4, 6, 5 | door (−8, −1.5) |
| hall-of-fame | 8, −4, 7, 5 | door (8, −1.5) |
| mailbox | 3, 6, 0.8, 0.8 | spot (3, 6) |
| campus-quad | −30, −28, 12, 8 | door (−30, −24) |
| hq-tower | −12, −28, 8, 8 | door (−12, −24) |
| civic-center | 12, −28, 10, 8 | door (12, −24) |
| workshop | 30, −28, 10, 8 | door (30, −24) |
| library | −36, −12, 10, 7 | door (−36, −8.5) |
| playhouse | −20, −12, 8, 6 | door (−20, −9) |
| cinema | −38, 4, 10, 7 | door (−38, 7.5) |
| record-store | −34, 18, 8, 6 | door (−34, 21) |
| arcade | −24, 30, 10, 6 | door (−24, 33) |
| gym | 20, −12, 14, 10 | door (20, −7) |
| fan-shop | 38, −12, 8, 6 | door (38, −9) |
| chess-park | 22, 4, 1.2, 1.2 | spot (22, 4) |
| park | 36, 4, 1, 1 | spot (36, 4) |
| golf-clubhouse | 28, 22, 10, 6 | door (28, 25) |
| running-loop | 6, 34, 0.4, 0.4 | spot (6, 34) |

Map bounds x ∈ [−48, 48], z ∈ [−40, 40]; spawn `(0, 0, NORTH)`; fountain collider rect (0, 3.5, 3, 3); main road x ∈ [−2, 2] from z −8 to −22; running loop = path ring 3 m inside the map edge. The lane z ∈ [−1, 1] from x 0 to 20 is deliberately clear (e2e walks it to the Gym door). A builder may move a lot only if every Task 4 test still passes and this table is updated in the same commit.

**Draw-call budgets** (e2e enforces world ≤ 200, Gym and generic hall ≤ 150, full and `?fx=low`):
World ≈ 95: ground + paths 4 · massing ≤ 12 (4 districts × ≤ 3 materials, merged) · doors 1 + outline 1 · sign boards 1 (instanced) + sign text ≤ 18 · trees 2 · lamps 2 · fountain 2 · spot props ≤ 8 + outlines ≤ 4 · rings 3 + labels ≤ 3 · avatar ≤ 18 · blob shadow 1 · composer ≤ 15.
Generic hall ≈ 60: room 2 · pedestals 1 + hull 1 · rings ≤ 8 · labels ≤ 6 · sign 2 · exit mat 1 · avatar 18 · shadow 1 · composer 15.
Gym ≈ 110: Phase 3 arena (≈ 122) − 24 rings − station labels − south-end stands/wall + trusses 1 + wall grid 1 + key 2 + scorer's text 2 + 2 rings + ≤ 2 labels.

## Parallelism

Orchestrator first: `git switch -c world-stage-1 phase-3-look`. Each task runs in its own worktree off the branch tip of the previous wave; merge a wave only when all its tasks are green.

- **Wave 0:** Task 1 alone (mechanical rename touches everything).
- **Wave 1:** Task 2 alone (all shared contracts).
- **Wave 2 (10 in parallel):** Tasks 3, 4, 5, 6, 7, 8, 9, 10, 11, 12. Disjoint files: T3 `routing/routes.ts`; T4 `logic/layout.ts`; T5 `logic/{collide,movement,input}.ts` + Player call site; T6 `logic/camera.ts` + CameraRig call site; T7 `logic/{doors,hall}.ts`; T8 `store.ts`, `history.ts`, `logic/visited.ts` + WorldApp call site; T9 the five collection data files; T10 `src/ui/{ExhibitContent,CollectionList,ContactContent}.tsx`; T11 `kit/**`, `logic/labels.ts`, `scene/{Lighting,Effects}.tsx`; T12 `scripts/check-dist.mjs`, `vite.config.ts`.
- **Wave 3 (6 in parallel):** Tasks 13, 14, 15, 16, 17, 18. Disjoint: T13 Player/CameraRig/ReadySignal/keyboard/controls; T14 Hud/Panel/Map/Toast; T15 `src/world/world/**`; T16 `interiors/generic/**`; T17 `interiors/gym/**` + registry line + WorldApp import lines; T18 `src/boxscore/**`, `shell/StartScreen.tsx`, one App prop line. Wave-3 tasks keep existing component props backward compatible (new props optional); only T17 edits `WorldApp.tsx`; only T18 edits `App.tsx`.
- **Wave 4:** Task 19 alone (integration: App, WorldApp, SceneSwitcher, Fade, history wiring, dead-code removal, e2e helpers + smoke).
- **Wave 5 (2 in parallel):** Task 20 (`e2e/world.spec.ts`, deletes `e2e/arena.spec.ts`) ∥ Task 21 (`e2e/world-perf.spec.ts`, `e2e/gym-look.spec.ts` from `arena-look.spec.ts`, `e2e/boxscore.spec.ts`, README).

---

### Task 1: Rename arena → world (no behavior change)

**Files:** `git mv src/arena src/world`, `git mv tests/arena tests/world`; `git mv src/world/ArenaApp.tsx src/world/WorldApp.tsx`, `src/world/ui/arena-ui.css → world-ui.css`, `src/shell/loadArena.ts → src/shell/loadWorld.ts`, `src/shell/ArenaBoundary.tsx → src/shell/WorldBoundary.tsx`, `tests/ui/arena-*.test.tsx → tests/ui/world-*.test.tsx`. Modify every importer (`src/App.tsx`, `src/shell/TipOff.tsx`, tests, `scripts/check-dist.mjs` comment, README paths).

**Interfaces — Produces:** identifiers `WorldApp` (default export), `useWorld`, `createWorldStore`, `WorldState`, `loadWorld(): Promise<{ default: ComponentType<WorldAppProps> }>`, `WorldAppProps = { stationId: string | null; env: Env }` (Task 19 changes it), `WorldBoundary`. CSS class names (`arena-*`) and DOM data attributes stay as they are in this task.

- [ ] **Step 1:** Do the moves with `git mv` (history kept), then fix imports and identifiers.
- [ ] **Step 2:** `git grep -nE "src/arena|tests/arena|useArena|createArenaStore|ArenaApp|loadArena|ArenaBoundary|ArenaState" -- . ':!docs'` → no hits.
- [ ] **Step 3:** `npm test`, `npx tsc -b`, `npm run build`, `npm run e2e` all PASS with the same counts as before the rename (behavior unchanged).
- [ ] **Step 4:** Commit `refactor: move src/arena to src/world (Brayden's World stage 1)`.

### Task 2: Contracts — content model, world types, theme accents, registry, route words

**Files:** Modify `src/content/{types,stations,banners,index}.ts`, `src/world/look/theme.ts`, `src/world/logic/{court,proximity,visited}.ts` (type moves only), `src/world/scene/Player.tsx`, `src/world/WorldApp.tsx`, `src/world/store.ts` (shims below), `tests/content.test.ts`, `tests/world/theme.test.ts`. Create `src/content/{buildings,interests,mirrors,exhibits,collections,books,films,games,artists,teams}.ts`, `src/routing/routeWords.ts`, `src/world/types.ts`, `src/world/interiors/registry.ts`, `src/world/interiors/generic/Interior.tsx` (stub), `src/world/world/WorldScene.tsx` (stub), `tests/content-model.test.ts`, `tests/world/registry.test.ts`. Delete `src/content/lockerRoom.ts`, `src/world/logic/spawn.ts`, `tests/world/{spawn,placement}.test.ts`.

**Interfaces — Produces:**
```ts
// content/types.ts
export type BuildingId = 'scouting-office'|'hall-of-fame'|'mailbox'|'workshop'|'hq-tower'|'civic-center'|'campus-quad'|'gym'|'golf-clubhouse'|'library'|'cinema'|'record-store'|'playhouse'|'arcade'|'fan-shop'|'chess-park'|'park'|'running-loop';
export type District = 'square'|'career'|'culture'|'sports';
export type ThemeColorKey = 'scarlet'|'ink'|'offWhite'|'stone'|'grass'|'path'|'sky'|'water'|'slate'|'brick'|'mustard'|'cinemaRed'|'warmGlow'|'teal'|'gymRed'|'hardwood'|'fairway'|'rack';
export type Building = { id: BuildingId; name: string; sign: string; district: District; kind: 'interior'|'overlay'|'spot'; stage: 1|2|3; bespoke: boolean; accent: ThemeColorKey; blurb: string };
export type Station = { /* as today minus zone */ building: BuildingId; floor?: number; pos?: [number, number] };
export type Banner = { id; title; issuer; year; why; building: 'hall-of-fame'; pos?: [number, number] };
export type CollectionId = 'books'|'films'|'games'|'artists'|'teams';
export type Interest = { id: string; building: BuildingId; title: string; oneLiner: string; detail?: string; link?: Link; collection?: CollectionId; pos?: [number, number] };
export type Mirror = { exhibitId: string; building: BuildingId; pos?: [number, number]; floor?: number };
export type Book = { title: string; author: string; favorite?: boolean };
export type Film = { title: string; year: number; onDisplay?: boolean };
export type Game = { title: string; note?: string };
export type Team = { name: string; sport: 'football'|'basketball'|'baseball'|'hockey'|'soccer' };
// content/exhibits.ts
export const CONTACT_ID = 'contact';
export type Exhibit =
  | { type: 'station'; id: string; building: BuildingId; title: string; floor?: number; pos?: [number, number]; station: Station }
  | { type: 'banner'; id: string; building: BuildingId; title: string; pos?: [number, number]; banner: Banner }
  | { type: 'interest'; id: string; building: BuildingId; title: string; pos?: [number, number]; interest: Interest }
  | { type: 'contact'; id: 'contact'; building: 'mailbox'; title: 'Contact' };
export type Placement = { exhibit: Exhibit; mirror: boolean; pos?: [number, number]; floor?: number };
export const exhibits: Exhibit[];                       // stations, banners, interests, contact — in that order
export const EXHIBIT_COUNT: number;                     // 45
export function getExhibit(id: string): Exhibit | undefined;
export function homeBuilding(id: string): BuildingId | undefined;
export function exhibitsIn(b: BuildingId): Placement[]; // homes in `exhibits` order, then mirrors in mirrors.ts order
export function getBuilding(id: string): Building | undefined;
// content/buildings.ts
export const buildings: Building[];                     // order = Map/Box Score order: square, career, culture, sports
export const SIGN_ALLOW_LIST: readonly string[];        // exact sign strings below
// content/collections.ts
export function getCollection(id: CollectionId): readonly (Book|Film|Game|string|Team)[];
export const COLLECTION_LABEL: Record<CollectionId, string>;   // 'Books on the shelf', 'Films on the wall', 'Arcade cabinets', 'Top 12 artists', 'Teams I root for'
// routing/routeWords.ts
export const ROUTE_WORDS = ['world', 'b', 'box-score', 'arena'] as const;
export type Route =                                      // parsed by Task 3, consumed by Tasks 8, 18, 19
  | { view: 'auto' } | { view: 'boxscore' } | { view: 'world' }
  | { view: 'building'; id: BuildingId; legacy: boolean }
  | { view: 'exhibit'; id: string };
// world/types.ts
export type Pose = { x: number; z: number; heading: number };
export type Bounds = { minX: number; maxX: number; minZ: number; maxZ: number };
export type Rect = { x: number; z: number; w: number; d: number };
export const NORTH = -Math.PI / 2, SOUTH = Math.PI / 2;
export const SPAWN_POSE: Pose;                           // { x: 0, z: 0, heading: NORTH }
export type ZoomIndex = 0 | 1 | 2;
export function inFront(pos: [number, number]): Pose;    // (x, z + 1.5, NORTH) — "player in front of the exhibit"
export type Scene = { kind: 'world' } | { kind: 'interior'; id: BuildingId };   // extensible union
export type Target = { scene: Scene; pose: Pose | null; panelId: string | null }; // pose null → scene default
export type Trigger = { id: string; rect: Rect };        // doors: id = BuildingId; interior exits: id 'exit'
export type PlacedExhibit = { id: string; pos: [number, number] };
export type SceneGeometry = { bounds: Bounds; colliders: Rect[]; doors: Trigger[]; exits: Trigger[]; exhibits: PlacedExhibit[]; entrance: Pose; cameraDistance: number };
export type SceneProps = { buildingId: BuildingId | null; theme: Theme; reducedMotion: boolean; spawnAt: Pose | null; floor?: number };
export type SceneModule = { default: ComponentType<SceneProps>; sceneGeometry(id: BuildingId | null): SceneGeometry };
export type InteriorProps = SceneProps;                   // spec contract + buildingId (the generic hall needs it)
// world/interiors/registry.ts
export const interiorLoaders: Partial<Record<BuildingId, () => Promise<SceneModule>>>;  // {} here; Task 17 adds the gym line
export function loadScene(s: Scene): Promise<SceneModule>; // world → import('../world/WorldScene'); interior → interiorLoaders[id] ?? import('./generic/Interior'); memoised per key, a rejected promise is evicted
export function prefetchScene(s: Scene): void;            // loadScene(s).catch(() => {}) — never throws, never unhandled
// world/look/theme.ts additions
accents: Record<ThemeColorKey, string>;
districts: Record<District, { wall: ThemeColorKey; trim: ThemeColorKey; ground: ThemeColorKey }>;
daylight: { background: string; ambient: number; hemi: { sky: string; ground: string; intensity: number }; dir: { pos: [number, number, number]; intensity: number }; bloomThreshold: number };
```
Values. Accents: scarlet `#cc0033`, ink `#0a0a0a`, offWhite `#f4f0ea`, stone `#a29e97`, grass `#7d8f6a`, path `#c9bfae`, sky `#bcd3e0`, water `#7fa7b8`, slate `#3c3f46`, brick `#8e3b2e`, mustard `#d4a537`, cinemaRed `#d7262e`, warmGlow `#ffcf7a`, teal `#2fb5a8`, gymRed `#b3121f`, hardwood `#d2a06a`, fairway `#5f8f4e`, rack `#6e6a64`. Districts: square {offWhite, scarlet, stone}; career {offWhite, ink, path}; culture {brick, offWhite, path}; sports {offWhite, gymRed, grass}. Daylight: background `#bcd3e0`, ambient 0.9, hemi `#ffffff`/`#7d8f6a` 0.6, dir (−12, 24, 14) 1.1, bloomThreshold 0.9.
Buildings in this order (name / sign / district / kind / stage / accent; `bespoke: false` except Gym; kind `interior` unless stated): Scouting Office / `SCOUTING OFFICE` / square / **overlay** / 1 / scarlet · Hall of Fame / `HALL OF FAME` / square / 2 / scarlet · Press Desk (id `mailbox`) / `PRESS DESK` / square / **spot** / 1 / scarlet · The Workshop / `WORKSHOP` / career / 2 / ink · HQ Tower / `HQ TOWER` / career / 2 / ink · Civic Center / `CIVIC CENTER` / career / 2 / scarlet · Campus Quad / `CAMPUS QUAD` / career / 2 / scarlet · Library / `LIBRARY` / culture / 3 / mustard · Playhouse / `PLAYHOUSE` / culture / 3 / cinemaRed · Cinema / `CINEMA` / culture / 3 / cinemaRed · Record Store / `RECORDS` / culture / 3 / warmGlow · Arcade / `ARCADE` / culture / 3 / teal · Gym / `GYM` / sports / 1 / gymRed / **bespoke: true** · Fan Shop / `FAN SHOP` / sports / 3 / rack · Chess Park / `CHESS PARK` / sports / **spot** / 3 / ink · Park / `PARK` / sports / **spot** / 3 / fairway · Golf Clubhouse / `CLUBHOUSE` / sports / 3 / fairway · 5K Loop (id `running-loop`) / `5K LOOP` / sports / **spot** / 3 / scarlet. `SIGN_ALLOW_LIST` = exactly those 18 sign strings. Blurbs: one first-person sentence each, resume facts only.
Interests: the 12 `lockerRoom` items move to `interests.ts` with `building` per the contracts table and `shotCaption` dropped; `fifa-23` becomes `{ id: 'fifa', title: 'FIFA (series)', oneLiner: 'My favorite sports series to play with friends.' }`; `books.collection = 'books'`, `movies.collection = 'films'`, `music.collection = 'artists'`, `teams.collection = 'teams'`; new `{ id: 'games', building: 'arcade', title: 'Arcade cabinets', oneLiner: 'Every game I have put real hours into.', collection: 'games' }`. Stations: drop `zone` and `pos`, add `building` (+ `floor` on HQ) per contracts. Banners: add `building: 'hall-of-fame'`. Collection files are created empty (`[]` typed) here; Task 9 fills them.
`ALL_TEXT` collects profile, stations, banners, interests, buildings, mirrors and all five collections.
Moves: `Pose`, `Bounds` → `world/types.ts` (all importers updated; `court.ts` no longer exports them); `REACH_M` → `logic/proximity.ts`. Shims (removed by later tasks): store `spawnAt(stationId)` always spawns at `SPAWN_POSE`'s legacy equivalent `{x:0,z:0,heading:0}`; `Player` `placed` = `[]`; `WorldApp` renders no `StationMarker`s; `logic/visited.ts` caps at the size of `validIds` instead of 24.
Stubs: `generic/Interior.tsx` and `world/WorldScene.tsx` export `default () => null` and `sceneGeometry` returning `{ bounds: {minX:-8,maxX:8,minZ:-8,maxZ:0}, colliders: [], doors: [], exits: [], exhibits: [], entrance: SPAWN_POSE, cameraDistance: 12 }`.

- [ ] **Step 1: Failing tests**
  - `content-model.test.ts`: ids unique and kebab-case across exhibits ∪ buildings ∪ `ROUTE_WORDS`; `EXHIBIT_COUNT === 45`; every station's `building` per the contracts table (24 rows) and `kind === 'interior'`; every `homeBuilding(id)` exists; overlay buildings have 0 placements; every `interior` building has ≥ 1 placement; `exhibitsIn('workshop').map(p => p.exhibit.id)` = 5 homes then `oculogica` (mirror true); `exhibitsIn('hall-of-fame')` ends with `critics-choice` mirror; `homeBuilding('critics-choice') === 'campus-quad'`, `homeBuilding('rising-star') === 'hall-of-fame'`, `homeBuilding('chess') === 'chess-park'`, `homeBuilding('contact') === 'mailbox'`; every mirror's `exhibitId` exists and its building ≠ the home; `floor` set exactly on the 5 hq-tower stations with values 4/3/3/2/1; `pos` present on a placement iff its building is `bespoke` (gym: `basketball` [3,5], `rising-star` mirror [−3,−7]); every `sign` ∈ `SIGN_ALLOW_LIST` or matches `/^Brayden's /`; every building `accent` ∈ keys of `theme.accents`; buildings order districts square → career → culture → sports; interest `fifa` exists and `fifa-23` does not; ALL_TEXT has no phone match and no private term (`it.skipIf(terms.length === 0)`).
  - `content.test.ts`: TABLE drops the zone column; link https check uses `interests`.
  - `theme.test.ts`: every hex string anywhere in `theme` is in the palette, the accents' values, the existing allowed set, or neutral (max − min channel ≤ 0x20); `Object.keys(theme.accents)` equals the 18 `ThemeColorKey`s; `effectiveTheme` tests unchanged.
  - `registry.test.ts` (vi.mock the two dynamic modules): `loadScene({kind:'interior', id:'library'})` resolves the generic module; two calls return the same promise; when a loader rejects once, `prefetchScene` produces no unhandled rejection and the next `loadScene` calls the loader again.
- [ ] **Step 2:** Run `npm test` → FAIL. **Step 3:** Implement. **Step 4:** `npm test` and `npx tsc -b` PASS (Box Score still renders: in `BoxScore.tsx` replace the `ZONES` loop with a loop over career buildings — `buildings.filter(b => b.district === 'career')` — titled by `name`, and replace `lockerRoom` with `interests`; Task 18 finishes the Box Score).
- [ ] **Step 5:** Commit `feat: world content model, shared world types, theme accents, scene registry`.

### Task 3: Routes (Wave 2)

**Files:** Create `src/routing/routes.ts`, `tests/routes.test.ts`. (`hash.ts` stays until Task 19.)

**Interfaces — Consumes:** `Route` (Task 2, `routing/routeWords.ts`; re-export it from `routes.ts`), `getExhibit`, `getBuilding`, `Env`, `canRunArena`. **Produces:**
```ts
export type { Route } from './routeWords';
export function parseRoute(hash: string): Route;              // decodeURIComponent in try/catch; never throws
export function resolveScreen(r: Route, env: Env): 'boxscore' | 'world';
export function needsStartScreen(r: Route, started: boolean): boolean;
export function hashForRoute(r: Route): string;               // canonical: '#/', '#/box-score', '#/world', '#/b/<id>', '#<id>'
```

- [ ] **Step 1: Failing tests** (table-driven): `''`, `'#'`, `'#/'` → auto; `'#/world'` → world; `'#/box-score'` → boxscore; `'#/arena'` → `{building, 'gym', legacy: true}`; `'#/b/gym'` → legacy false; `'#/b/library'`, `'#/b/chess-park'` → building; `'#/b/scouting-office'` → boxscore; `'#/b/'`, `'#/b/nope'`, `'#/b/tranquility-base'`, `'#/arena/x'` → auto; `'#tranquility-base'`, `'#books'`, `'#contact'`, `'#rising-star'` → exhibit; `'#gym'`, `'#Tranquility-Base'`, `'#<script>'`, `'#%E0%A4%A'` → auto (no throw); `'#critics%2Dchoice'` → exhibit `critics-choice`. `resolveScreen` matrix for desktop / phone / no-WebGL / reduced-motion × every view: boxscore → boxscore; auto & exhibit → `canRunArena ? world : boxscore`; world & building → `webgl ? world : boxscore`. `needsStartScreen`: auto/world with `started=false` → true; building/exhibit/boxscore → false; anything with `started=true` → false. `hashForRoute(parseRoute(h))` round-trips each canonical hash.
- [ ] **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: world route parsing and screen resolution`.

### Task 4: World layout and reachability (Wave 2)

**Files:** Create `src/world/logic/layout.ts`, `tests/world/layout.test.ts`.

**Interfaces — Consumes:** `buildings`, `Rect`, `Bounds`, `Pose`, `Trigger`, `NORTH`, `SOUTH`, `SPAWN_POSE`. **Produces:**
```ts
export const MAP: Bounds;                                   // ±48 x, ±40 z
export type Lot = { id: BuildingId; rect: Rect; door: { x: number; z: number } | null; spot: { x: number; z: number } | null };
export const LOTS: Record<BuildingId, Lot>;                 // the contracts table
export const FOUNTAIN: Rect;                                // (0, 3.5, 3, 3)
export const DOOR_W = 2.4, DOOR_D = 0.9, DOOR_EXIT_OFFSET = 1.5, SPOT_APPROACH = 1.5;
export function doorTrigger(lot: Lot): Rect;                // centre (door.x, door.z + DOOR_D/2), w DOOR_W, d DOOR_D
export function exitPose(id: BuildingId): Pose;             // doors: (door.x, door.z + 1.5, SOUTH); spots: spotPose(id)
export function spotPose(id: BuildingId): Pose;             // (spot.x, spot.z + rect.d/2 + 1.5, NORTH)
export function worldColliders(): Rect[];                   // every lot rect + FOUNTAIN
export function worldDoors(): Trigger[];                    // interior + overlay lots, id = building id
export function reachable(from: { x: number; z: number }, targets: { x: number; z: number }[], colliders: readonly Rect[], bounds: Bounds, cell?: number, radius?: number): boolean[];
export const E2E_LANES: Rect[];   // kept clear of colliders, triggers, trees and lamps: (10, 0, 22, 3) spawn→Gym, (20, −3.5, 3, 7) up to the Gym door, (−4, 0, 10, 3) spawn→Scouting Office
```
Flood fill: grid with `cell` (default 0.5) over `bounds`; a cell is free when a circle of `radius` (default 0.4) at its centre is inside `bounds` and overlaps no collider; 4-neighbour BFS from the cell nearest `from`; a target is reached when the free cell nearest to it was visited.

- [ ] **Step 1: Failing tests:** `Object.keys(LOTS)` equals all 18 building ids; lots with kind interior/overlay have a door, spots have a spot and no door; every door lies on its rect's south face (`door.z === rect.z + rect.d/2`, `|door.x − rect.x| ≤ rect.w/2 − DOOR_W/2`); doors pairwise ≥ 8 m apart; no door within 6 m of spawn; farthest door ≤ 42 m from spawn; every lot rect inside `MAP` with ≥ 3 m margin; no two collider rects overlap and none overlaps a circle of r 1 at spawn; no `E2E_LANES` rect intersects a collider, and only the lanes' far ends touch the Gym / Scouting Office door triggers; **RF1:** every `exitPose(id)` is inside `MAP`, overlaps no collider (circle r 0.4) and lies in no door trigger; `reachable(SPAWN_POSE, [every door-trigger centre, every spotPose], worldColliders(), MAP)` is all true; a synthetic target fully walled in by 4 rects is unreachable.
- [ ] **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: world layout data, door/exit poses, reachability flood fill`.

### Task 5: Collision, 8-direction movement, input (Wave 2)

**Files:** Create `src/world/logic/collide.ts`, `tests/world/collide.test.ts`. Rewrite `src/world/logic/{movement,input}.ts`, `tests/world/{movement,input}.test.ts`. Modify `src/world/scene/Player.tsx` (call site only: `step(prev, input, dt, { bounds: <old PLAY_BOUNDS literal>, colliders: [] })`).

**Interfaces — Produces:**
```ts
// collide.ts
export const PLAYER_R = 0.4;
export function collide(p: { x: number; z: number }, r: number, boxes: readonly Rect[], b: Bounds): { x: number; z: number };
// movement.ts
export const SPEED = 6, MAX_DT = 0.05, TURN_SPEED = 12;   // rad/s
export type MoveInput = { x: number; y: number };          // screen-relative: x → east, y → north (−z); length ≤ 1
export const NO_INPUT: MoveInput;
export function step(p: Pose, input: MoveInput, dt: number, geo: { bounds: Bounds; colliders: readonly Rect[] }): Pose;
// input.ts (joystickVector unchanged)
export function keysToInput(pressed: ReadonlySet<string>): MoveInput;   // W/ArrowUp y+1, S/ArrowDown y−1, D/ArrowRight x+1, A/ArrowLeft x−1; diagonals normalised
export function joystickToInput(v: { x: number; y: number }): MoveInput;   // identity
export function combineInput(a: MoveInput, b: MoveInput): MoveInput;      // sum, then scale to length ≤ 1
```
`collide`: clamp centre to bounds inset by r; then 3 passes over boxes: closest point on the box; if distance < r push out along that normal to distance r; if the centre is inside the box push out along the axis of least penetration. NaN coordinates → return input unchanged. `step`: dt NaN → 0, clamp to `[0, MAX_DT]`; velocity = input (scaled to length ≤ 1) × SPEED, dx = v.x·d, dz = −v.y·d; heading rotates toward `atan2(dz, dx)` by at most `TURN_SPEED·d` along the shortest arc, unchanged when input is zero; result passed through `collide(PLAYER_R)`.

- [ ] **Step 1: Failing tests:** collide — free point unchanged; bounds clamp to `min + 0.4`; point 0.2 left of a box face → pushed to 0.4; centre inside box → exits through nearest face; corner push is radial; NaN unchanged. movement — 1 s of `{x:1,y:0}` at 60 fps from (0,0) → x ≈ 6, z = 0, heading ≈ 0; `{x:0,y:1}` → z ≈ −6, heading → −π/2; diagonal input speed = SPEED (not ×√2); no input keeps heading; heading change per frame ≤ 12/60 rad; sliding: walking diagonally into a wall keeps the tangential component; tunnelling: 2 s at full speed toward a 0.4 × 0.4 box never ends past it; `dt = NaN` → pose unchanged. input — W → `{0,1}`; W+D → `{√½, √½}` (±1e-9); W+S → `NO_INPUT`; arrows mirror letters; `combineInput({1,0},{0,1})` has length 1.
- [ ] **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: circle-vs-box collision and screen-relative 8-direction movement`.

### Task 6: Top-down camera math (Wave 2)

**Files:** Rewrite `src/world/logic/camera.ts`, `tests/world/camera.test.ts`. Modify `src/world/scene/CameraRig.tsx` (call site only: position = player + `cameraOffset(DIST_WORLD)`, lookAt player).

**Interfaces — Produces:**
```ts
export const FOV_DEG = 40, PITCH_DEG = 55, DIST_WORLD = 18, DIST_INTERIOR = 12, ZOOM_STEPS = [0.75, 1, 1.3] as const, DEAD_ZONE_M = 1;
// ZoomIndex comes from world/types.ts (Task 2)
export function cameraOffset(distance: number): [number, number, number];      // [0, d·sin55°, d·cos55°] (camera south of focus)
export function cameraDistance(base: number, zoom: ZoomIndex): number;         // base × ZOOM_STEPS[zoom]
export function zoomStep(i: ZoomIndex, delta: -1 | 1): ZoomIndex;              // clamped
export function viewHalfExtents(distance: number, aspect: number): { halfX: number; halfZ: number };  // halfX = d·tan(fov/2)·aspect, halfZ = d·tan(fov/2)/sin(pitch)
export function clampFocus(f: { x: number; z: number }, b: Bounds, half: { halfX: number; halfZ: number }): { x: number; z: number };  // per axis: span ≤ 2·half → centre; else clamp to [min+half, max−half]
export function followFocus(prev: { x: number; z: number }, player: { x: number; z: number }, dt: number, reducedMotion: boolean): { x: number; z: number };
export function smoothing(dt: number, reducedMotion: boolean): number;         // unchanged
```
`followFocus`: if the player is within `DEAD_ZONE_M` of prev → prev; else desired = player − unit(player − prev)·DEAD_ZONE_M; return prev + (desired − prev)·smoothing(min(dt, 0.05), reducedMotion).

- [ ] **Step 1: Failing tests:** `cameraOffset(18)` ≈ `[0, 14.745, 10.324]` (1e-3); `cameraDistance(18,1) === 18`, `(12,0) === 9`; `zoomStep(2,1) === 2`, `(0,-1) === 0`, `(1,1) === 2`; `viewHalfExtents(18, 16/9)` ≈ `{11.65, 8.00}` (1e-2); `clampFocus({x:-48,z:0}, MAP_LIKE ±48/±40, {12,8})` → `{-36, 0}`; bounds narrower than view → centre of bounds; `followFocus` with player 0.8 m away → prev; player 3 m east, reduced → `x = prev.x + 2`; full motion dt 1/60 → strictly between prev and desired; dt NaN → prev.
- [ ] **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: fixed-yaw top-down camera math with zoom, dead-zone follow, clamp`.

### Task 7: Door triggers and generic-hall layout (Wave 2)

**Files:** Create `src/world/logic/{doors,hall}.ts`, `tests/world/{doors,hall}.test.ts`.

**Interfaces — Produces:**
```ts
// doors.ts
export const PREFETCH_RADIUS = 10;
export function triggerAt(p: { x: number; z: number }, triggers: readonly Trigger[]): string | null;  // centre in rect, min inclusive, max exclusive; first match
export type DoorLatch = { update(id: string | null): string | null; reset(): void };
export function createDoorLatch(): DoorLatch;   // starts disarmed; arms after observing null; returns id only on null→id; reset() disarms
export function within(p: { x: number; z: number }, triggers: readonly Trigger[], radius?: number): string[];  // rect centres within radius, nearest first
// hall.ts
export const HALL = { cols: 4, colGap: 4, rowGap: 5, front: 4, back: 4, halfW: 8, pedestal: 1 } as const;
export type HallLayout = { slots: [number, number][]; bounds: Bounds; colliders: Rect[]; exit: Trigger; entrance: Pose; length: number };
export function hallLayout(n: number): HallLayout;     // uses inFront from world/types.ts (Task 2)
```
Hall: rows = max(1, ceil(n/4)); slot i at x = −6 + 4·(i mod 4), z = −(4 + 5·floor(i/4)); length = 4 + 5·(rows − 1) + 4; bounds x ±8, z ∈ [−length, 0]; colliders = 1 × 1 pedestal rects at slots; exit = `{ id: 'exit', rect: { x: 0, z: -0.45, w: 2.4, d: 0.9 } }`; entrance `(0, −2, NORTH)`. Authored `pos` is ignored by design.

- [ ] **Step 1: Failing tests:** triggerAt inside/outside/edge; **RF1** latch: `update('gym')` first → null; `update(null)`, `update('gym')` → `'gym'`; repeated `'gym'` → null; `null`, `'library'` → `'library'`; after `reset()` an immediate `'gym'` → null; `within` sorts nearest first and excludes > 10 m. hall: `hallLayout(1).length === 8`, `(4)` 8, `(5)` 13, `(8)` 13, `(9)` 18; slots of `(6)` = `[[-6,-4],[-2,-4],[2,-4],[6,-4],[-6,-9],[-2,-9]]`; bounds grow with n; entrance and every `inFront(slot)` are outside the exit trigger and every collider (circle r 0.4); `hallLayout(0)` has 0 slots and length 8.
- [ ] **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: door trigger latch, prefetch radius, generic hall auto-layout`.

### Task 8: World store and the history module (Wave 2)

**Files:** Rewrite `src/world/store.ts`, `tests/world/store.test.ts`. Create `src/world/history.ts`, `tests/world/history.test.ts`. Modify `src/world/logic/visited.ts` (+ test), `src/world/WorldApp.tsx` (call site: `s.spawnAt(SPAWN_POSE)`), `tests/ui/world-app.test.tsx` if it breaks.

**Interfaces — Consumes (all from Task 2, so this task is independent of the rest of Wave 2):** `Route` type, `Scene`, `Target`, `Pose`, `SceneGeometry`, `ZoomIndex`, `inFront`, `getExhibit`, `homeBuilding`, `getBuilding`, `exhibits`, `EXHIBIT_COUNT`. Tests construct `Route` literals and pass fake `parse`/`exitPose`/`spotPose` (the real ones arrive in Task 19). **Produces:**
```ts
// store.ts — kept: activeId, nearId, nearestId, visited, spawn {pose, seq}, fx, avatar, activate, openPanel, closePanel, setProximity, setFx, setAvatar
export type Phase = 'idle' | 'fading-out' | 'loading' | 'fading-in';
scene: Scene; worldPose: Pose; phase: Phase; pending: Target | null; geometry: SceneGeometry | null;
labelIds: string[]; mapOpen: boolean; toast: string | null; zoomIndex: ZoomIndex;
go(target: Target, opts?: { instant?: boolean }): void;   // pending = target; closes panel + map; phase: instant → 'loading'; idle → 'fading-out'; already non-idle → keeps phase ('fading-in' becomes 'fading-out')
beginLoad(): void;                                       // 'fading-out' → 'loading'
commit(scene: Scene, geometry: SceneGeometry, pose: Pose, panelId: string | null): void;  // scene, geometry, spawn {pose, seq+1}, pending null, phase 'fading-in', then openPanel(panelId) if set
settle(): void;                                          // 'fading-in' → 'idle'
spawnAt(pose: Pose): void;                               // spawn {pose, seq+1}
setWorldPose(p: Pose): void; setLabels(ids: string[]): void /* no set when equal */;
openMap(): void; closeMap(): void; setZoom(i: ZoomIndex): void; showToast(m: string): void; dismissToast(): void;
export type WorldStore = UseBoundStore<StoreApi<WorldState>>;
// openPanel(id) accepts any exhibit id (getExhibit), marks visited; visited capped at EXHIBIT_COUNT
// history.ts
export const WORLD_HASH = '#/world';
export function hashForScene(s: Scene): string;                 // '#/world' | '#/b/<id>'
export function hashFor(s: Scene, panelId: string | null): string;   // panel → '#<panelId>'
export function sameScene(a: Scene, b: Scene): boolean;
export type RouteCtx = { scene: Scene; activeId: string | null; worldPose: Pose; spotPose(id: BuildingId): Pose };
export function targetForRoute(r: Route, ctx: RouteCtx): Target | 'boxscore';
export type Plan = { kind: 'none' } | { kind: 'panel'; panelId: string | null } | { kind: 'go'; target: Target } | { kind: 'boxscore' };
export function planRoute(r: Route, ctx: RouteCtx): Plan;
export function spawnPoseFor(t: Target, g: SceneGeometry): Pose;    // t.pose ?? (panelId placed in g → inFront(pos)) ?? g.entrance
export type HistoryDeps = { win: Window; store: WorldStore; parse(hash: string): Route; exitPose(id: BuildingId): Pose; spotPose(id: BuildingId): Pose; toBoxScore(): void };
export function createHistorySync(d: HistoryDeps): { start(): void; travel(hash: string): void; restore(): void; dispose(): void };
```
`targetForRoute`: auto/world → `{world, ctx.worldPose, null}`; building interior X → `{interior X, null, null}`; building spot X → `{world, spotPose(X), null}`; boxscore or overlay → `'boxscore'`; exhibit E with home H: interior → `{interior H, null, E}`, spot → `{world, spotPose(H), E}` (mirrors never change H).
`planRoute`: `'boxscore'` → boxscore; same scene and target.pose is null or the scene is world with no pose change requested by an exhibit → `panel` when `panelId !== ctx.activeId`, else `none`; otherwise `go`. (World → world with a different spot pose is `go`.)
Adapter rules (**the only code that writes `history`**): `start()` → `go(targetForRoute(parse(location.hash)), {instant: true})`, never writes the URL; `'boxscore'` from `start()` calls `toBoxScore()`. Every applied target whose scene is interior X first calls `setWorldPose(exitPose(X))`. `travel(hash)` → plan; `go` → `pushState(hashFor(target.scene, target.panelId))` then apply; `panel` → `replaceState` then open/close; `boxscore` → `toBoxScore()` (no push); `none` → nothing. `popstate` and `hashchange` → plan from `location.hash` and apply without writing the URL; plan `boxscore` there is ignored (App owns that screen switch). A store subscription calls `replaceState(hashFor(scene, activeId))` when `activeId` changes while `phase === 'idle' && pending === null` and not inside an apply. `restore()` → `replaceState(hashFor(store.scene, store.activeId))`. `dispose()` removes listeners and the subscription.

- [ ] **Step 1: Failing tests**
  - store: `go` from idle → phase 'fading-out', pending set, `activeId` and `mapOpen` cleared; `go(..., {instant:true})` → 'loading'; `beginLoad`, `commit(interior gym, geo, pose, 'basketball')` → scene gym, `spawn.seq` +1, phase 'fading-in', activeId 'basketball', visited contains it; `settle` → idle; **RF3** `go` while 'loading' replaces pending and stays 'loading'; `go` while 'fading-in' → 'fading-out'; `openPanel('books')` works (non-station) and unknown id is ignored; visited loads up to 45 ids; `setLabels` with an equal array doesn't notify; `setZoom` / map / toast setters.
  - history pure: `hashFor` cases; `targetForRoute` table — world, `#/b/gym`, `#/b/chess-park` (spotPose), `#tranquility-base` → interior workshop + panel, `#chess` → world + spotPose('chess-park') + panel, **RF5** `#rising-star` → hall-of-fame, `#critics-choice` → campus-quad, `#contact` → world + spotPose('mailbox'), boxscore → 'boxscore'; `planRoute`: in workshop with panel `tranquility-base`, route `#/b/workshop` → `{panel, null}`; route `#debate-mate` → `{panel, 'debate-mate'}`; in world, route `#/world` → none; in world, `#/b/gym` → go; `spawnPoseFor`: explicit pose wins; placed panel → `inFront(pos)`; unplaced panel → entrance.
  - history adapter (jsdom, real `window.history`, fresh store per test): `start()` on `#/b/gym` → pending gym, phase loading, `worldPose` = `exitPose('gym')`, `history.length` unchanged; `travel('#/b/library')` from idle world → length +1, hash `#/b/library`, worldPose = exitPose('library'); after commit+settle, `openPanel('books')` → hash `#books`, length unchanged; `closePanel()` → `#/b/library`; `history.back()` (await popstate) → pending `{world, exitPose('library'), null}` and no new entry; **RF3** popstate while phase 'fading-out' replaces pending; `commit(..., panel)` during 'fading-in' writes nothing (spy on `replaceState`); `travel('#/b/scouting-office')` → `toBoxScore` called once, no push; popstate to `#/box-score` → `toBoxScore` not called; `restore()` rewrites the hash to the current scene; `dispose()` stops listening.
  - visited: cap = `validIds.size` (45 accepted, 46th dropped).
- [ ] **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** PASS (`npm test`, `npx tsc -b`).
- [ ] **Step 5:** Commit `feat: world store scenes/transitions and the single history-sync module`.

### Task 9: Collections content (Wave 2)

**Files:** Fill `src/content/{books,films,games,artists,teams}.ts`. Create `tests/collections.test.ts`.

**Data** (source: `_source/docs/library-and-theater.md` for books/films; existing public `interests` text for the rest — copy titles/authors only, nothing else from private notes):
- `films` (owner order, `onDisplay: true` on all 12): Star Wars: Episode VI – Return of the Jedi 1983, Avengers: Endgame 2019, Cars 2006, The Dark Knight 2008, The Shawshank Redemption 1994, The Matrix 1999, Caddyshack 1980, Talladega Nights: The Ballad of Ricky Bobby 2006, Raiders of the Lost Ark 1981, Inception 2010, Fight Club 1999, The Prestige 2006.
- `books`: the 75 rows of the source table, title and author exactly as written there (series rows keep their `(#1–12)` style suffix); `favorite: true` on The Invisible Life of Addie LaRue, Feed, 1984, Pride and Prejudice. None of the "Removed" items.
- `games` (spec §5.6 order): Rocket League (`note: 'Champion rank'`), FIFA (`note: 'the series'`), Fortnite, LEGO Star Wars: The Complete Saga, Ultimate Chicken Horse, Lovers in a Dangerous Spacetime, Heave Ho, Astro Bears, Forza Horizon, Kinect Sports, Just Dance, Halo, Apex Legends, Call of Duty: Warzone, Splitgate, Star Wars Battlefront, NBA 2K, Madden.
- `artists` (order): Drake, Don Toliver, Kendrick Lamar, J. Cole, Kanye West, Travis Scott, Future, Playboi Carti, Tyler the Creator, J Balvin, Lil Uzi Vert, Tame Impala.
- `teams`: Giants football, Knicks basketball, Yankees baseball, Rangers hockey, Manchester City, Barcelona, Bayern Munich, Juventus, NY Red Bulls, NYCFC — soccer.

- [ ] **Step 1: Failing tests:** films length 12, first title contains "Return of the Jedi", last "The Prestige", years integers 1900–2030; books length 75, titles unique, exactly 4 favorites with the titles above, no title contains "Modest Proposal", "Tintern", "Gettysburg", "Book o' Fun" or "Complete Works"; games length 18 with first 'Rocket League', no "FIFA 23"; artists length 12 starting Drake, ending Tame Impala; teams length 10, 6 soccer; every string passes the phone and private-term scans; `ALL_TEXT` contains "Project Hail Mary".
- [ ] **Step 2:** FAIL. **Step 3:** Fill the data. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: library, cinema, arcade, record and fan-shop collections`.

### Task 10: Shared exhibit content UI (Wave 2)

**Files:** Create `src/ui/{ExhibitContent,CollectionList,ContactContent}.tsx`, `src/ui/exhibit.css`, `tests/ui/exhibit-content.test.tsx`.

**Interfaces — Consumes:** `Exhibit`, `getCollection`, `COLLECTION_LABEL`, `profile`, `StationContent`. **Produces:**
```tsx
export function ExhibitContent(p: { exhibit: Exhibit; headingLevel: 2 | 3 }): JSX.Element;  // station → StationContent; banner → title, `${issuer} · ${year}`, why; interest → title, oneLiner, detail, link (target _blank, rel noopener noreferrer), CollectionList; contact → ContactContent
export function CollectionList(p: { id: CollectionId; items?: readonly unknown[] }): JSX.Element;  // items override for tests
export function ContactContent(): JSX.Element;   // mailto email, profile.links, profile.targets
export function sortBooks(list: readonly Book[]): Book[];   // favorites first (source order), then rest by title, case-insensitive, ignoring a leading "The " / "A " / "An "
export function filterBooks(list: readonly Book[], q: string): Book[];   // case-insensitive substring of title or author; trims q
```
Books render an `<input type="search" aria-label="Filter books">` and a live count `"{n} of {total}"` (`role="status"`); films an `<ol>` "Title (year)"; games `<ul>` "Title — note"; artists `<ol>`; teams grouped by sport with `<h4>`s. Never an `<img>` for collections.

- [ ] **Step 1: Failing tests:** `sortBooks` puts the 4 favorites first in source order and sorts "The Odyssey" under O; `filterBooks(books, 'orwell')` → 1984 and Animal Farm; `filterBooks(b, '  ')` → all; rendering interest `books` shows the filter input, typing "zzz" shows "0 of 75"; **RF4** typing "m", "e", "w" into the filter changes only the input value (key events reach the input and `stopPropagation` is not required — assert `document.activeElement` stays the input); films list has 12 `li` in owner order; contact shows the email `mailto:` link and 3 profile links; banner shows "NASA Space Apps NYC · 2026"; station renders the existing StationContent heading; no `img` inside any collection.
- [ ] **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: shared exhibit, collection and contact content components`.

### Task 11: 3D kit, nearest labels, lighting presets (Wave 2)

**Files:** Create `src/world/kit/{Room,Sign,Pedestals,ExhibitMarker,DoorFrames,ExitMat,instancing}.tsx|ts`, `tests/world/kit.test.ts`. Modify `src/world/logic/labels.ts` (+ `tests/world/labels.test.ts`), `src/world/scene/{Lighting,Effects}.tsx` (backward compatible).

**Interfaces — Consumes:** `materials`, `gradientMap`, `Outline`, `theme`, `toFontSafe`, `Rect`, `Trigger`, `PlacedExhibit`. Kit components never read the store (Task 8 runs in parallel); scene components in Wave 3 pass `hot`/`showLabel` from `useWorld`. **Produces:**
```ts
export function instanceMatrices(items: readonly { x: number; y: number; z: number; sx?: number; sy?: number; sz?: number; rotY?: number }[]): Float32Array;  // 16 floats per item, column-major
export function nearestIds(p: { x: number; z: number }, placed: readonly PlacedExhibit[], n?: number): string[];  // default 6; by distance, ties by id
export function Room(p: { width: number; length: number; wallHeight?: number; southWall?: number; floor: ThemeColorKey; wall: ThemeColorKey }): JSX.Element;  // origin = south-centre; spans x ±width/2, z ∈ [−length, 0]; south wall height 0.6 default; floor 1 mesh, walls merged 1 mesh
export function Sign(p: { text: string; position: [number, number, number]; rotationY?: number; board: ThemeColorKey; color?: string; size?: number }): JSX.Element;  // board box + one troika Text(toFontSafe(text))
export function Pedestals(p: { positions: readonly [number, number][]; color?: ThemeColorKey }): JSX.Element;  // 1 InstancedMesh + 1 hull InstancedMesh; computeBoundingSphere after matrices
export function ExhibitMarker(p: { title: string; pos: [number, number]; hot: boolean; showLabel: boolean; reducedMotion: boolean }): JSX.Element;  // ring accent/accentHot by `hot`; Text label only when showLabel
export function useMarkerState(id: string): { hot: boolean; showLabel: boolean };  // NOT in kit — each Wave-3 scene reads useWorld: hot = nearId === id, showLabel = labelIds.includes(id)
export function DoorFrames(p: { doors: readonly Trigger[] }): JSX.Element;  // one instanced door mesh + Outline
export function ExitMat(p: { rect: Rect }): JSX.Element;                   // flat arrow plane, no text
// Lighting / Effects (existing call sites keep working)
export function Lighting(p: { theme: Theme; preset?: 'arena' | 'daylight' }): JSX.Element;  // daylight uses theme.daylight, no spot light
export function Effects(p: { theme: Theme; threshold?: number }): JSX.Element;              // threshold overrides theme.bloom.threshold
```

- [ ] **Step 1: Failing tests:** `instanceMatrices([{x:1,y:2,z:3}])` translation at indices 12–14 = 1,2,3 and scale 1; `rotY: π/2` matrix maps (1,0,0) → (0,0,−1); `nearestIds` returns ≤ 6 ids sorted by distance, ties broken by id, `[]` for empty; old `labelVisible` tests removed with it (delete `labelVisible`).
- [ ] **Step 2:** FAIL. **Step 3:** Implement components (no unit tests for JSX; they are exercised by Tasks 15–17 and e2e).
- [ ] **Step 4:** `npm test`, `npx tsc -b` PASS.
- [ ] **Step 5:** Commit `feat: shared 3D kit (room, signs, pedestals, markers, doors) and daylight preset`.

### Task 12: Chunk targets in check-dist (Wave 2)

**Files:** Modify `vite.config.ts` (`build.manifest: true`), `scripts/check-dist.mjs`, `tests/check-dist.test.ts`.

**Interfaces — Produces:**
```js
export const CHUNK_TARGETS = { engine: 400 * 1024, 'world-scene': 150 * 1024, 'interior-gym': 150 * 1024, interior: 120 * 1024 };
export const SCENE_ENTRIES = { engine: 'src/world/WorldApp.tsx', 'world-scene': 'src/world/world/WorldScene.tsx', interiorGlob: /^src\/world\/interiors\/([^/]+)\/Interior\.tsx$/ };
export function chunkGroups(manifest /* Vite manifest object */) /* → { name: string, files: string[] }[] */;
// checkDist(...) now also returns warnings: string[] and groups: { name, gzipBytes }[]
```
Grouping from `dist/.vite/manifest.json`: initial = the `isEntry` chunk + its static `imports` closure; engine = WorldApp entry + static closure − initial; `world-scene` and each `interior-<id>` = that entry + static closure − initial − engine. Each group's gzip JS bytes vs its target (`interior-gym` explicit, other interiors use `interior`) → `warn: chunk <name> <kb> KB gzip over target <t> KB`; warnings never fail. Main prints every group's size, then warnings, then errors. Hard checks unchanged. Missing manifest → one warning `no manifest; chunk targets skipped`.

- [ ] **Step 1: Failing tests:** synthetic manifest fixture (index entry importing `vendor-react`; WorldApp dynamic entry importing `engine-a`; generic + gym Interior dynamic entries both importing `kit-b`) → groups engine = {WorldApp, engine-a}, interior-generic and interior-gym each contain kit-b; a fixture whose gym group exceeds `150 KB` (opts override `chunkTargets`) → warning containing `interior-gym`, `errors` empty; initial over budget still errors; existing tests pass.
- [ ] **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** PASS; `npm run build` prints group sizes.
- [ ] **Step 5:** Commit `build: per-scene chunk targets from the Vite manifest (warnings)`.

### Task 13: Player, camera rig, controls, ready signal (Wave 3)

**Files:** Rewrite `src/world/scene/{Player,CameraRig,ReadySignal}.tsx`, `src/world/useKeyboard.ts`, `src/world/ui/Prompt.tsx`. Modify `src/world/liveInput.ts` (+ `zoomRequest`), `src/world/ui/Joystick.tsx`. Create `src/world/ui/InteractButton.tsx`, `src/world/ui/controls.css`, `src/world/useZoomInput.ts`, `tests/ui/{world-keyboard,interact-button,world-prompt}.test.tsx`, `tests/world/player-frame.test.ts`.

**Interfaces — Consumes:** `step`, `keysToInput`, `joystickToInput`, `combineInput`, `collide`; camera module; `triggerAt`, `createDoorLatch`, `within`, `PREFETCH_RADIUS`; `nearest`, `inReach`; `nearestIds`; store fields; `prefetchScene`; `LOTS`/`MAP` fallback; `getExhibit`. **Produces:**
```ts
export const playerPose: Pose;                                                   // live pose (unchanged name)
export function playerFrame(prev: Pose, input: MoveInput, dt: number, geo: SceneGeometry): { pose: Pose; door: string | null; exit: boolean; nearestId: string | null; nearId: string | null; labels: string[]; prefetch: string[] };  // pure, used by Player
export function Player(p: { reducedMotion?: boolean; onDoor?(id: BuildingId): void; onExit?(): void }): JSX.Element;
export function CameraRig(p: { env: Env }): null;          // distance from scene kind × zoom; follow + clamp to geometry.bounds; snap on spawn.seq change
export function ReadySignal(p: { target: RefObject<HTMLElement>; sceneKey: string }): null;  // resets on sceneKey change: data-ready false, data-draw-calls ''; frame 1 → data-ready true + data-scene=sceneKey; frame 30 → draw calls; data-pose every 6 frames
export function useKeyboard(store?: WorldStore): void;
export function useZoomInput(ref: RefObject<HTMLElement>, store?: WorldStore): void;  // wheel (one step per 150 ms; deltaY > 0 → farther), '+'/'=' closer, '-' farther, two-finger pinch
export function InteractButton(p: { store?: WorldStore }): JSX.Element | null;       // round button bottom-right, only when nearId && !activeId; aria-label `Open ${title}`
```
Player per frame: frozen (input = `NO_INPUT`) when `activeId`, `mapOpen` or `phase !== 'idle'`; geometry null → render only; on `spawn.seq` change: pose = spawn pose, latches `reset()`, speed 0. Door latch over `geometry.doors` → `onDoor(id)`; exit latch over `geometry.exits` → `onExit()`. Every 15 frames call `prefetchScene({kind:'interior', id})` for `within(p, doors, 10)` ids whose building kind is interior. `setProximity`, `setLabels`. Blob shadow: one dark transparent circle (r 0.5) under the avatar.
Keyboard: ignore when typing (input/textarea/select/contenteditable), when Ctrl/Meta/Alt, when `phase !== 'idle'`, and when Panel or Map is open (they own their keys). `worldFocus` = `document.activeElement` is `[data-world-focus]` or `body`. Arrows: move unless typing. WASD: move only with worldFocus. E: interact (`activate(nearId)`) with worldFocus, not on repeat. Enter/Space: interact only with worldFocus (a focused button keeps its native click). M: `openMap()` with worldFocus. `+`/`-`: zoom with worldFocus.

- [ ] **Step 1: Failing tests**
  - `player-frame.test.ts`: from the generic-hall geometry of 6 exhibits, walking north 0.5 s reaches the first row prompt (`nearId` set when ≤ 2 m); walking south from the entrance for 1 s reports `exit: true` exactly once across frames when fed through `createDoorLatch`; door detection from `worldColliders`/`worldDoors` geometry at `(20, −5)` walking north; labels ≤ 6; `prefetch` contains `gym` at (20, 0) and nothing at (0, 0) beyond 10 m doors.
  - `world-keyboard.test.tsx` (**RF4**): wrapper focused: `KeyW` adds to `liveInput.pressed`, `KeyE` with `nearId` opens panel, `KeyM` opens map, `Space` interacts; focus on a `<button>`: `KeyW` and `Space` do nothing to the world (no activate, no pressed key); focus in `<input>`: `KeyM`/`KeyE`/`KeyW`/ArrowUp do nothing; ArrowUp with focus on a button still moves; phase 'loading' → nothing; Ctrl+W → nothing.
  - `interact-button.test.tsx`: hidden without `nearId`; shows "Open Tranquility Base" with `nearId`; click → `activeId` set; hidden while panel open.
  - `world-prompt.test.tsx`: Prompt shows `Press E — Books` for `nearId: 'books'`; `data-exhibit="books"`.
- [ ] **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: 8-direction player with collision, door/exit triggers, prefetch; top-down camera rig; world keys`.

### Task 14: HUD, Panel, Map dialog, Toast (Wave 3)

**Files:** Rewrite `src/world/ui/{Hud,Panel}.tsx`. Create `src/world/ui/{MapDialog,Toast}.tsx`, `src/world/ui/focusTrap.ts`. Modify `src/world/ui/world-ui.css`. Tests `tests/ui/{world-hud,world-panel,map-dialog,toast}.test.tsx`.

**Interfaces — Consumes:** store, `getExhibit`, `getBuilding`, `buildings`, `exhibitsIn`, `EXHIBIT_COUNT`, `ExhibitContent`. **Produces:**
```ts
export function useFocusTrap(ref: RefObject<HTMLElement>, active: boolean, onClose: () => void, initial?: RefObject<HTMLElement>): void;  // Tab wrap, Esc → onClose, focus initial on open, return focus to [data-world-focus] on close
export function Hud(p: { store?: WorldStore; onScoutingOffice?(): void; onMap?(): void }): JSX.Element;
export function Panel(p: { store?: WorldStore }): JSX.Element | null;   // existing behavior (scroll keys, backdrop close) + ExhibitContent; aria-label = exhibit title
export function MapDialog(p: { onTravel(hash: string): void; store?: WorldStore }): JSX.Element | null;
export function Toast(p: { store?: WorldStore }): JSX.Element | null;  // role="status"; auto-dismiss after 4000 ms
```
HUD DOM order: link "Skip to box score" (`href="#/box-score"`), button "Scouting Office" (`onScoutingOffice ?? → location.hash = '#/box-score'`), button "Map" (`onMap ?? store.openMap`), then status text: scene name (world → "Brayden's World", interior → building `name`) and `Exhibits visited ${n}/${EXHIBIT_COUNT}`. Map: `role="dialog"`, `aria-modal`, heading "Map"; one `<section>` per district (headings Town Square, Career District, Culture Row, Sports Side) listing buildings in `buildings` order, each a button with the building name (hash `#/b/<id>`, overlay → `#/box-score`) and a nested list of its **home** exhibits as buttons (hash `#<id>`); choosing calls `closeMap()` then `onTravel(hash)`.

- [ ] **Step 1: Failing tests:** HUD tab order = skip link, Scouting Office, Map; text `Exhibits visited 0/45`; in interior workshop shows "The Workshop"; Scouting button calls the prop. Panel: `activeId 'books'` renders the filter input; Esc closes and focus returns to the wrapper; `'tranquility-base'` renders its heading. Map: opens when `mapOpen`; 4 district sections; 18 building buttons; "The Workshop" lists 5 exhibits (no `oculogica` mirror); clicking "Library" → `onTravel('#/b/library')` and map closed; clicking "Scouting Office" → `'#/box-score'`; clicking exhibit "Chess" → `'#chess'`; Tab wraps inside; Esc closes; **RF4** pressing `m` inside the map does not reopen/close it. Toast: shows message, gone after 4 s (fake timers).
- [ ] **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: world HUD, exhibit panel, map fast-travel dialog, toast`.

### Task 15: Outdoor world scene (Wave 3)

**Files:** Replace stub `src/world/world/WorldScene.tsx`. Create `src/world/world/{geometry,massing,signs}.ts`, `src/world/world/{Ground,Massing,Props,Spots,Signs}.tsx`, `tests/world/world-scene.test.ts`.

**Interfaces — Consumes:** layout (`LOTS`, `MAP`, `FOUNTAIN`, `worldColliders`, `worldDoors`, `spotPose`, `SPAWN_POSE`), kit, `theme` (accents, districts, daylight), `buildings`, `exhibitsIn`. **Produces:**
```ts
export default function WorldScene(p: SceneProps): JSX.Element;
export function sceneGeometry(): SceneGeometry;     // bounds MAP, colliders worldColliders(), doors worldDoors(), exits [], exhibits = spot placements at their spot points, entrance SPAWN_POSE, cameraDistance DIST_WORLD
export type MassBox = { x: number; y: number; z: number; w: number; h: number; d: number; color: ThemeColorKey };
export function massingFor(id: BuildingId): MassBox[];   // body + roof + ≤ 2 accent pieces, all inside the lot rect; silhouettes: Hall of Fame columns, HQ Tower tall (h 14), Library flat roof + canopy, Cinema arch + red band, Arcade columns + teal band, Gym tall barrel, Clubhouse low + green awning
export function worldSigns(): { id: BuildingId; text: string; pos: [number, number, number] }[];   // one per building, text = building.sign, above the door / beside the spot
```
Scene: `<Lighting preset="daylight">`, flat sky background, no fog; ground (grass), plaza (stone), main road + loop ring (path) — 4 meshes; massing merged per district per colour via `mergeGeometries`; `DoorFrames` for all doors; `Sign` × 18; instanced trees (≈ 40, seeded with `mulberry32(29)` positions not overlapping colliders, door triggers or the e2e lane) and lamps (≈ 16); fountain (2 meshes); spot props (mailbox box, chess table + 2 stools, roundnet ring, loop marker post) with `Outline`; `ExhibitMarker` for `contact`, `chess`, `roundnet`.

- [ ] **Step 1: Failing tests:** `sceneGeometry().doors` has 14 ids (13 interiors + scouting-office); exhibits = `contact`, `chess`, `roundnet` at their spot points; `worldSigns()` length 18, each `isFontSafe`, each ∈ `SIGN_ALLOW_LIST`; every `massingFor` box lies inside its lot rect (± 0.01) and has h > 0; total MassBox count ≤ 18 × 4; no tree or lamp position (circle r 0.6) overlaps a collider, a door trigger, or any `E2E_LANES` rect.
- [ ] **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** PASS.
- [ ] **Step 5:** Visual check via `npm run dev` `#/world` (after Task 19, or temporarily mount in a scratch page — do not commit it): readable signs from the default camera, every door visible, no building occludes the player.
- [ ] **Step 6:** Commit `feat: outdoor world scene — districts, massing, signs, doors, spots`.

### Task 16: Generic Exhibit Hall (Wave 3)

**Files:** Replace stub `src/world/interiors/generic/Interior.tsx`. Create `src/world/interiors/generic/geometry.ts`, `tests/world/generic-hall.test.ts`.

**Interfaces — Consumes:** `hallLayout`, `inFront`, `exhibitsIn`, `getBuilding`, kit, `reachable`, `DIST_INTERIOR`. **Produces:**
```ts
export default function Interior(p: InteriorProps): JSX.Element;        // Room(width 16, length) in building accent, Pedestals, ExhibitMarker per placement, building Sign on the north wall, ExitMat, Lighting daylight preset
export function sceneGeometry(id: BuildingId | null): SceneGeometry;   // from hallLayout(exhibitsIn(id).length): placement i ↔ slot i; exits [layout.exit]; doors []; cameraDistance DIST_INTERIOR
```

- [ ] **Step 1: Failing tests:** for every interior building except `gym`: exhibit ids = `exhibitsIn(id)` ids in order; one exit at the south edge; every exhibit slot and the exit centre reachable from the entrance (`reachable` with hall colliders/bounds); HQ Tower shows all 5 exhibits on one floor; Hall of Fame has 8 (7 banners + `critics-choice` mirror); `spawnPoseFor({…, panelId: 'tranquility-base'}, sceneGeometry('workshop'))` equals `inFront` of slot 0.
- [ ] **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: generic exhibit hall interior with auto-laid-out pedestals`.

### Task 17: The Gym — first bespoke interior (Wave 3)

**Files:** `git mv` into `src/world/interiors/gym/`: `scene/{Court,Hoop,Furniture,Stands,Crowd,Banners}.tsx`, `scene/Arena.tsx → GymDressing.tsx`, `scene/Jumbotron.tsx → Scoreboard.tsx`, `logic/court.ts`, `logic/dressing.ts`, `logic/jumbotron.ts → scoreboard.ts`; tests `tests/world/{dressing,jumbotron,court-look}.test.ts → tests/world/gym/{dressing,scoreboard,court-look}.test.ts`. Create `src/world/interiors/gym/{Interior.tsx,geometry.ts,gymLook.ts,transform.ts}`, `tests/world/gym/geometry.test.ts`. Modify `src/world/interiors/registry.ts` (one line: `gym: () => import('./gym/Interior')`), `src/world/WorldApp.tsx` (import paths only), `tests/ui/world-app.test.tsx` (mock paths). Do not move `logic/season.ts` (Task 19 deletes it).

**Interfaces — Consumes:** kit `ExhibitMarker`, `materials`, `gradientMap`, `Outline`, `theme.accents`, `exhibitsIn('gym')`, `toFontSafe`, `profile`. **Produces:**
```ts
export default function Interior(p: InteriorProps): JSX.Element;   // <group rotation-y={π/2}> around the Phase 3 dressing; exhibit markers in scene space
export function sceneGeometry(): SceneGeometry;
export function gymToScene(p: [number, number]): [number, number];   // local (x, z) → scene (z, −x) — equals Object3D rotation.y = π/2
export const GYM_BOUNDS: Bounds;           // x ±9.5, z ∈ [−15, 17]
export const GYM_EXIT: Trigger;            // { id: 'exit', rect: { x: 0, z: 16.55, w: 2.4, d: 0.9 } }
export const GYM_ENTRANCE: Pose;           // (0, 15.6, NORTH)
export const GYM_BANNERS: readonly string[];   // ['VARSITY\n2023–24', 'VARSITY\n2024–25', 'RISING STAR\n2023', '112\nCAREER POINTS', '12\nCAREER HIGH']
export const SCORER_TEXT: readonly [string, string];   // ['WELCOME', 'HOME OF #29']
export function scoreboardLines(stations: readonly Station[]): string[];   // ['CAREER\n112 PTS / 26 GAMES', '2024–25\n84 PTS / 20 GAMES', '2023–24\n28 PTS / 6 GAMES', 'CAREER HIGH\n12 PTS', ...jumbotronLines(stations)]
```
Restyle (look values in `gymLook.ts`, colours only from `theme.accents`): court hardwood `#d2a06a` with two red-painted keys (gymRed planes, 5.8 × 4.9, y 0.02), all lines `materials.line` (white toon, **no neon**), wordmark kept (no logo); apron slate; side walls offWhite with one `LineSegments` block grid (0.4 × 0.2 m) per wall; 6 red trusses (one InstancedMesh, y 10, spanning x); bleachers = existing stand rows, row colour alternating gymRed / ink via `setColorAt`, **no stands or end wall on the local −x end** (scene south, dollhouse), south wall ≤ 0.6 m; crowd `CROWD_OCCUPANCY = 0.1`, `CROWD_MAX = 120`; jumbotron → red Scoreboard (gymRed body, same rotation logic, `scoreboardLines`); rafter banners = `GYM_BANNERS` in `bannerSlots(5)`, alternating gymRed/ink with offWhite text; scorer's table shows `SCORER_TEXT`; both hoops kept; bloom off for gym pieces (no emissive). Colliders (scene space, via `gymToScene` with w/d swapped): every stand block, scorer's table, bench, both hoop poles (0.4 × 0.4). Exhibits: `basketball` and `rising-star` at their authored `pos` (already scene space).

- [ ] **Step 1: Failing tests** (`geometry.test.ts`): `gymToScene([12.425, 0])` → `[0, −12.425]` and matches `new Vector3(x,0,z).applyAxisAngle(Y, π/2)` for 5 points; exits = `[GYM_EXIT]` and its rect lies south of every collider; `GYM_ENTRANCE` is outside the exit trigger and every collider (r 0.4); exhibits = basketball [3,5], rising-star [−3,−7]; both plus the exit reachable from the entrance; no stand collider has scene z > 15; `cameraDistance === 12`. Moved tests: dressing crowd count ≤ 120 and occupancy fraction ∈ [0.05, 0.15]; `bannerSlots(5)` 5 slots; scoreboard first line `'CAREER\n112 PTS / 26 GAMES'`; every string in `GYM_BANNERS`, `SCORER_TEXT`, `scoreboardLines(stations)` is `isFontSafe`, and the set of gym strings equals the explicit list in this task (review guard for the nickname rule).
- [ ] **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** PASS, `npx tsc -b` clean.
- [ ] **Step 5:** Commit `feat: gym interior — restyled high-school gym with scoreboard, red key, trusses`.

### Task 18: Box Score sections and start screen (Wave 3)

**Files:** Modify `src/boxscore/{BoxScore,StationCard}.tsx`, `src/boxscore/boxscore.css`, `src/shell/shell.css`, `src/App.tsx` (only the BoxScore prop name), `tests/ui/{boxscore,app-routing}.test.tsx`. Create `src/shell/StartScreen.tsx`, `tests/ui/start-screen.test.tsx`.

**Interfaces — Consumes:** `parseRoute`, `buildings`, `exhibitsIn`, `banners`, `interests`, `getExhibit`, `ExhibitContent`, `CollectionList`, `ContactContent`, `COLLECTION_LABEL`, `getCollection`, `profile`, `loadWorld`. **Produces:**
```tsx
export function BoxScore(p: { onExplore?: () => void; notice?: string }): JSX.Element;
export function StartScreen(p: { onExplore: () => void; touch?: boolean }): JSX.Element;
```
Box Score order: header (button "Explore Brayden's World" when `onExplore`), Filters, one section per career building (`id="section-<building>"`, title = building name) with its stations as cards (category filter applies here only), **Hall of Fame** (banners as `li id=<id> data-exhibit`), **Off the clock** (one `h3` per building with interests, in `buildings` order, each interest `li id data-exhibit` using `ExhibitContent` minus the collection, the collection in `<details><summary>{COLLECTION_LABEL} ({count})</summary><CollectionList/></details>`), **Contact** (`section id="contact" data-exhibit="contact"` with `ContactContent`). `StationCard` adds `data-exhibit`. Deep link: `parseRoute` exhibit id → if station reset the filter as today; scroll the element with that id into view and focus its first heading. StartScreen: `h1` "Brayden's World", name, tagline, targets, button **Explore** (autoFocus) → `onExplore`, button **Scouting Report** → `location.hash = '#/box-score'`, controls hint (touch: "Drag the pad to move · tap Interact to open"; else "W A S D / arrows to move · E to open · M for the map"); preloads `loadWorld()` on mount (errors swallowed).

- [ ] **Step 1: Failing tests:** Box Score renders exactly 45 `[data-exhibit]` with unique ids equal to the exhibit id set; 24 `[data-station]`; sections Hall of Fame, Off the clock, Contact present and "Locker Room"/"Rafters"/"Press Table" absent; the books `<details>` summary reads "Books on the shelf (75)"; `#books` hash scrolls to `#books` (spy `scrollIntoView`); filter "project" still shows Hall of Fame; button "Explore Brayden's World" calls `onExplore`. StartScreen: heading "Brayden's World", Explore focused, Scouting Report sets the hash. `app-routing.test.tsx` text expectations updated ("Explore Brayden's World").
- [ ] **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: box score hall of fame, off the clock, contact; Brayden's World start screen`.

### Task 19: Integration — App, WorldApp, scene switching, history wiring (Wave 4)

**Files:** Rewrite `src/App.tsx`, `src/world/WorldApp.tsx`, `src/shell/loadWorld.ts`. Create `src/world/scene/SceneSwitcher.tsx`, `src/world/ui/Fade.tsx`, `e2e/helpers.ts`, `e2e/world-smoke.spec.ts`. Delete `src/routing/hash.ts`, `tests/hash.test.ts`, `src/shell/TipOff.tsx`, `src/world/scene/StationMarker.tsx`, `src/world/logic/season.ts` (+ tests), any other now-unreferenced file (`npx tsc -b` + `git grep` prove it). Rewrite `tests/ui/{app-routing,world-app}.test.tsx`; create `tests/ui/scene-switcher.test.tsx`.

**Interfaces — Consumes:** everything above. **Produces:**
```ts
export type WorldAppProps = { env: Env };                  // WorldApp reads the URL through createHistorySync, not props
export const STARTED_KEY = 'world.started';                // sessionStorage, try/catch
export function SceneSwitcher(p: { theme: Theme; reducedMotion: boolean; onLoadFailed(): void }): JSX.Element | null;
export function Fade(p: { reducedMotion: boolean; store?: WorldStore }): JSX.Element;   // black overlay + "Loading…" while 'loading'
export const FADE_MS = 250;
```
App: `route = parseRoute(location.hash)` on mount, on `hashchange` and on `popstate`; legacy → `history.replaceState(null, '', '#/b/gym')` before first render; `screen = resolveScreen(route, env)`; boxscore → `<BoxScore onExplore={env.webgl ? () => { markStarted(); location.hash = '#/world'; } : undefined}/>`; `needsStartScreen(route, started)` → `<StartScreen>` whose Explore marks started; else `<WorldBoundary fallback={<BoxScore notice="Brayden's World couldn't start on this device — here's the box score."/>}><Suspense fallback={<p role="status">Loading Brayden's World…</p>}><World env/></Suspense></WorldBoundary>`; mark started whenever the world screen renders. WorldApp stays mounted while the screen stays `world`.
WorldApp: wrapper per the DOM contract (`aria-label`: desktop "Brayden's World. W A S D or arrows to move, E to open an exhibit, M for the map." / touch "Brayden's World. Drag the pad to move, tap Interact to open an exhibit."); children order: `Hud` (first, so the skip link is first in tab order), `Canvas` (`camera={{ fov: 40, near: 0.1, far: 200 }}`, `dpr` per Global Constraints), `Prompt` (fine pointer) or `Joystick` + `InteractButton` (coarse), `Panel`, `MapDialog`, `Toast`, `Fade`. Canvas: `FxGovernor`, `GlowPulse`, `SceneSwitcher`, `Player` (with `onDoor`/`onExit`), `CameraRig`, `ReadySignal sceneKey={scene.kind === 'world' ? 'world' : scene.id}`, `Effects` when fx full (threshold `theme.daylight.bloomThreshold` outside the gym). History: `createHistorySync({ win: window, store: useWorld, parse: parseRoute, exitPose, spotPose, toBoxScore })` → `start()` on mount, `dispose()` on unmount. `toBoxScore` = if scene is world `setWorldPose({...playerPose})`; `location.hash = '#/box-score'`. `onDoor(id)`: overlay → `setWorldPose(exitPose(id))` then `location.hash = '#/box-score'`; interior → `sync.travel('#/b/' + id)`. `onExit()` → `sync.travel('#/world')`. Map `onTravel` → `sync.travel`. HUD Scouting Office → `toBoxScore`. Unmount: if scene is world, `setWorldPose({...playerPose})`.
SceneSwitcher: when phase becomes 'loading' with `pending`, increment a token, render nothing, `loadScene(pending.scene)`; on resolve (token current) → `geometry = mod.sceneGeometry(id)`, `commit(pending.scene, geometry, spawnPoseFor(pending, geometry), pending.panelId)`, render `mod.default` with `SceneProps`. On reject → `showToast("Couldn't open this building")`, reload the current `store.scene` and commit it with pose `exitPose(failedId)` when the current scene is world (else its entrance), call `onLoadFailed()` (→ `sync.restore()`); stale tokens are ignored. Fade: opacity 1 for 'fading-out'/'loading'; `setTimeout(FADE_MS)` → `beginLoad()` / `settle()`; reduced motion → 0 ms and no CSS transition.

- [ ] **Step 1: Failing tests**
  - app-routing (mock `loadWorld` with a stub): desktop `''` → StartScreen; Explore → world stub; `#/world` with started → world, no StartScreen; `#tranquility-base` on desktop → world (no StartScreen); phone `''` → Box Score with 45 cards; phone `#books` → Box Score; `#/arena` → `location.hash === '#/b/gym'` and `history.length` unchanged; loader rejection → Box Score with the failure notice; `#/b/scouting-office` → Box Score.
  - scene-switcher (mock `loadScene`): pending interior → commit with `spawnPoseFor`; **RF2** rejection → toast "Couldn't open this building", scene stays world, `spawn.pose` equals `exitPose('gym')`, `onLoadFailed` called once, no unhandled rejection (`process.on('unhandledRejection')` spy); a second `go` while the first load is pending → only the second commits.
  - world-app (mock Canvas/R3F as today): wrapper has `role="application"`, `data-transition="idle"` after settle, first focusable element is the "Skip to box score" link; `start()` on `#tranquility-base` puts `pending.panelId = 'tranquility-base'`.
- [ ] **Step 2:** FAIL. **Step 3:** Implement; delete dead files.
- [ ] **Step 4:** `npm test`, `npx tsc -b`, `npm run build` PASS (initial ≤ 200 KB, no three in initial; record group sizes).
- [ ] **Step 5:** `e2e/helpers.ts`: `trackErrors`, `trackExternal` (from `e2e/arena.spec.ts`), `ready(page, scene)` (waits `[data-ready="true"][data-scene="<scene>"]`, 30 s), `pose(page)` → `{x, z}` from `data-pose`, `holdUntil(page, key, predicate, timeout)` (keydown, poll `data-pose` on raf, keyup), `drawCalls(page)` (polls until non-empty). `world-smoke.spec.ts` (desktop): `/` → Explore → `ready(page,'world')`, no errors, no external requests.
- [ ] **Step 6:** `npx playwright test e2e/world-smoke.spec.ts` PASS. Commit `feat: integrate world shell — scene switcher, fades, history sync, start screen routing`.

### Task 20: Navigation e2e (Wave 5, parallel with 21)

**Files:** Create `e2e/world.spec.ts`. Delete `e2e/arena.spec.ts`.

- [ ] **Step 1: Write e2e (desktop project; each test tracks errors and asserts none at the end):**
  - Walk to a door: `/` → Explore → ready world; `holdUntil(ArrowRight, x ≥ 19.6)`; `holdUntil(ArrowUp, scene changes)` → `ready(page,'gym')`; hash `#/b/gym`; `holdUntil(ArrowDown, …)` → `ready(page,'world')`; pose within 0.1 of (20, −5.5); hash `#/world`. **RF1:** wait 1.5 s → still `data-scene="world"`.
  - Deep link: `/#tranquility-base` → `ready(page,'workshop')`, dialog heading "Tranquility Base", HUD "Exhibits visited 1/45"; Esc → hash `#/b/workshop`, `history.length` unchanged. **RF5:** `/#critics-choice` → `ready(page,'campus-quad')`; `/#chess` → `ready(page,'world')` with dialog "Chess"; `/#/b/` → StartScreen.
  - Cold `#/b/<id>`: `/#/b/library` → `ready(page,'library')`, no dialog, pose ≈ (0, −2).
  - Legacy: `/#/arena` → hash `#/b/gym`, `ready(page,'gym')`; `history.length` read right after `goto` equals the value after ready (the redirect used `replaceState`).
  - Scouting Office: in world click HUD "Scouting Office" → 45 `[data-exhibit]`, hash `#/box-score`; Back → `ready(page,'world')`, no StartScreen, pose equal to the pose before the click (± 0.1). Also walking into the Scouting Office door (`holdUntil(ArrowLeft, x ≤ −7.9)` then ArrowUp) → Box Score; Back → world at (−8, 0) ± 0.1.
  - Map fast travel: `m` → dialog "Map"; click "Library" → `ready(page,'library')`, hash `#/b/library`; Back → `ready(page,'world')` pose ≈ (−36, −7) facing south; Forward → `ready(page,'library')`.
  - **RF3** Back mid-fade: in world press Map → "Gym", immediately `page.goBack()` → final `data-scene="world"`, hash `#/world`, `data-transition` returns to `idle` within 3 s.
  - **RF2** chunk failure: `page.route('**/assets/Interior-*.js', r => r.abort())` (both interior chunks), walk to the Gym door → toast "Couldn't open this building", `ready(page,'world')`, pose ≈ (20, −5.5), hash `#/world`; `page.unroute(...)`, walk back in → `ready(page,'gym')`. Console errors limited to `/Failed to load resource|net::ERR_FAILED|Interior-/`.
  - Panel/visited: open `#books` → type "orwell" in "Filter books" → 2 items; the player did not move (pose unchanged).
- [ ] **Step 2:** `npx playwright test e2e/world.spec.ts --project=desktop`; fix failures in the owning task's files.
- [ ] **Step 3:** PASS 3 consecutive runs. Commit `test: world navigation e2e (doors, deep links, history, map, failure)`.

### Task 21: Budgets, mobile, reduced motion, gym look e2e, README (Wave 5, parallel with 20)

**Files:** Create `e2e/world-perf.spec.ts`. `git mv e2e/arena-look.spec.ts e2e/gym-look.spec.ts` and adapt. Modify `e2e/boxscore.spec.ts`, `README.md`.

- [ ] **Step 1: Write e2e:**
  - Draw calls (desktop): world ≤ 200 and > 1; `/#/b/gym` ≤ 150; `/#/b/workshop` (generic) ≤ 150; repeat each with `/?fx=low#…` (`data-fx="low"`).
  - No cross-origin: tour world → gym → `#books` panel → `#movies` panel → `#critics-choice` panel; external requests = []; then click the video play button → the only external origins are `youtube-nocookie.com` / `ytimg.com` / `google`-video hosts.
  - Reduced motion (`test.use({ reducedMotion: 'reduce' })`, desktop): `/` → Box Score with 45 `[data-exhibit]` and "Explore Brayden's World"; click it → `ready(page,'world')`, `data-motion="reduced"`; two canvas screenshots 1 s apart differ ≤ 0.5 % pixels (Phase 3 method); travel to the gym via Map → `data-transition` never observed as `fading-out` (poll on raf during travel).
  - Mobile (Pixel 7): `/` → Box Score, 45 `[data-exhibit]`, 24 `[data-station]`; "Explore Brayden's World" → `ready(page,'world')`, joystick visible, no Prompt; `/#books` → Box Score scrolled with `#books` in viewport.
  - Tablet (`test.use({ viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true })`, mobile project): `/` → StartScreen; Explore → world ready with joystick; Interact button hidden at spawn.
  - Gym look (`gym-look.spec.ts`, from the Phase 3 spec): `/#/b/gym` replaces `/#/arena`; scarlet-neon pixel check replaced by red-key pixels (r > 140, g < 60, b < 70 ≥ 200 px); model-failure, slow-model, low-power and reduced-motion cases kept with `ready(page,'gym')`; prompt case walks toward `basketball` (ArrowUp from entrance then ArrowRight) instead of `tranquility-base`.
  - `boxscore.spec.ts`: counts 45 `[data-exhibit]` / 24 `[data-station]`; "Enter the arena" → "Explore Brayden's World".
- [ ] **Step 2:** `npm run e2e` (both projects); fix in owning tasks' files.
- [ ] **Step 3:** PASS 3 consecutive runs. `npm run build` passes; record initial JS, engine / world-scene / gym / generic gzip sizes, total, draw calls (world, gym, generic; full/low) in the commit body. Any chunk-target warning is listed in the commit body with a one-line reason.
- [ ] **Step 4:** README: Brayden's World overview, controls (WASD/arrows, E/Enter/Space, M, +/−, wheel/pinch), routes table (§6), how to add an interest (append a `Building`, its `Interest` rows, optional collection file, a `LOTS` entry — it appears in the generic hall, Map and Box Score), how to add a bespoke interior (folder + one `registry.ts` line), budgets and `?fx=low`.
- [ ] **Step 5:** Commit `test: world budgets, mobile, tablet, reduced-motion and gym look e2e; readme`.

## Executor notes

- `pushState`/`replaceState` never fire `hashchange`/`popstate`; that is why only `history.ts` writes the URL and why App listens to both events. Never call `location.hash =` from world code except the two Box Score exits in Task 19.
- A Back between entries whose fragments differ fires `popstate` then `hashchange`; `planRoute` is idempotent, so applying twice is a no-op. Keep it that way.
- Keep `useGLTF(PLAYER_GLB_URL, false)`, never preload; the one Canvas means the avatar loads once across scenes — do not key the Canvas or Player by scene.
- `gl.info.autoReset = false` stays (ReadySignal) or composer passes zero the count.
- InstancedMesh: `computeBoundingSphere()` after writing matrices.
- Every new 3D string (signs, scoreboard, banners, labels) goes through `toFontSafe`; troika fetches unknown glyphs from a CDN otherwise.
- Gym rotation: `rotation.y = π/2` maps local (x, z) → scene (z, −x); collider rects swap w and d.
