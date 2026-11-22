# Arena Graybox (Phase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a lazy-loaded graybox 3D arena: desktop visitors go Tip-off → walk a third-person player on a college-first court → open station panels; phones, reduced-motion and no-WebGL visitors keep the Box Score with an "Enter the arena" button.

**Architecture:** `App.tsx` resolves hash + device capability into a view (`boxscore` | tip-off | arena). The arena (R3F scene, Zustand store, HTML overlays) is one `React.lazy` chunk; nothing from three/R3F/Zustand is reachable from the initial bundle. Non-render logic (movement, input, camera target, proximity, season, spawn, visited) lives in pure `src/arena/logic/*.ts` with full unit tests; R3F components only wire it to `useFrame`. The panel reuses `StationContent`. Station activation goes through one store action `activate(id)` — the seam Phase 4 replaces with the shot.

**Tech Stack:** Phase 1 stack + `three@0.187`, `@types/three@0.187`, `@react-three/fiber@^8.18`, `@react-three/drei@^9.122`, `zustand@^5` (versions verified by spike to peer-resolve with React 18).

**Spec:** `docs/superpowers/specs/2026-11-21-arena-portfolio-design.md` (Phase 2). Builds on `docs/superpowers/plans/2026-11-22-box-score-mvp.md`.

## Global Constraints

- Phase 1 constraints hold: palette `#CC0033` / `#0A0A0A` / `#FFFFFF` (graybox neutrals only from tokens `--ink --line --muted --paper`); no organization logos; never publish a phone number or private terms (`_source/private-terms.txt` via `loadPrivateTerms`/`findPrivateTerm`); no PDF in dist; never mention roles the owner chose to omit.
- Out of scope: Phase 3 (toon shading, outlines, bloom, crowd, CC0 avatar), Phase 4 (shot meter/arc, audio, confetti, unlocks, mute), Phase 5 (locker-room interior). Seams only.
- Versions: R3F **8.x**, drei **9.x** (React 18). Never install R3F 9 / drei 10.
- No physics engine, no nipplejs, no runtime deps beyond the five above (+ their transitive deps).
- Initial JS ≤ 200 KB gzip; three/`@react-three/*`/zustand reachable only via the dynamic import in `src/shell/loadArena.ts`.
- Arena total (gzip of everything in `dist/assets/`) < 5 MB.
- Perf: target 60 fps on a mid laptop; no shadow maps; `dpr={[1, 1.75]}`; ≤ 150 draw calls.
- No cross-origin requests from the arena. drei `<Text>` gets a local font: `@fontsource/barlow-condensed/files/barlow-condensed-latin-800-normal.woff?url`.
- Units/axes: metres, Y up. x along the court: +x = Rutgers end, −x = throwback end; +z = player's right when facing +x. Heading `h` in XZ, 0 = +x, forward = `(cos h, sin h)`; mesh `rotation.y = -h`.
- Exact visible text: `Tip-off` · `Skip to box score` · `Enter the arena` · `Stations visited N/24` · `Season YYYY–YY` (en dash) · `Press E — <title>` (desktop) / `Tap to open — <title>` (touch) · failure notice `The arena couldn't start on this device — here's the box score.`
- Storage key `arena.visited.v1`; every storage access in try/catch.
- Branch `phase-2-arena` cut from the Phase 1 tip. Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Don't push without owner confirmation.

## Review Focus

1. Arena chunk fails to load, or WebGL context creation throws despite detection passing → Box Score with the failure notice, never blank. (Task 4)
2. Tab away while holding a key / long frame → player doesn't keep walking, doesn't teleport, never leaves bounds. (Tasks 2, 5)
3. Keys while a panel is open (WASD, arrows, E, Tab) → player still; E doesn't re-open; arrows scroll the panel; Tab trapped; Esc closes and returns focus to the arena. (Task 5)
4. localStorage unavailable/corrupt/stale → counter always correct 0–24, no crash, no console errors. (Task 3)
5. Hash changes while the arena is live (Skip then Back, pasted `#other-id`, unknown id) → right view; Back after Tip-off returns to arena without Tip-off; new id respawns + opens panel without remounting the canvas; unknown id → centre court, no panel. (Tasks 4, 7)

---

## File Structure

```
src/arena/logic/{court,movement,input,camera,proximity,season,spawn,visited}.ts   pure logic
src/arena/store.ts           Zustand store factory + app instance
src/arena/liveInput.ts       mutable per-frame input (keys, joystick), no React state
src/arena/useKeyboard.ts     window key listeners → liveInput / store
src/arena/ui/{Panel,Hud,Prompt,Joystick}.tsx, arena-ui.css     HTML overlays
src/arena/scene/{materials.ts,Court,Hoop,Furniture,StationMarker,Player,CameraRig,ReadySignal}.tsx
src/arena/ArenaApp.tsx       default export: Canvas + overlays (lazy chunk entry)
src/routing/hash.ts          parseHash gains 'auto' | 'arena'; resolveView()
src/routing/capability.ts    hasWebGL, readEnv, canRunArena (main bundle, no three)
src/shell/{TipOff.tsx,ArenaBoundary.tsx,loadArena.ts,shell.css}
src/App.tsx, src/boxscore/BoxScore.tsx (Enter button + notice), src/content/stations.ts (pos)
scripts/check-dist.mjs       + three-in-initial guard, + 5 MB arena total
tests/arena/*.test.ts, tests/ui/arena-*.test.tsx, tests/ui/app-routing.test.tsx, tests/capability.test.ts
e2e/arena.spec.ts, e2e/boxscore.spec.ts, playwright.config.ts, README.md
```

## Court

- Court 28 × 15 m: x ∈ [−14, 14], z ∈ [−7.5, 7.5]. Play bounds (player clamp): x ∈ [−15, 15], z ∈ [−9.5, 9.5].
- Spawn (0, 0), heading 0 (facing the Rutgers end). Rims at (±12.425, 3.05, 0). 3-pt radius 6.75, key 5.8 × 4.9, centre circle r 1.8.
- Scorer's table centre (4.2, −9.2), 8.5 m long. Bench centre (4.0, 9.2), 6 m long. Locker doorway placeholder (−6, 10), visual only.

## Station placement (college-first; ≥ 3 m apart; none within 2.5 m of spawn)

| id | x | z | spot |
|---|---|---|---|
| tranquility-base | 5.7 | 0 | top of Rutgers arc (dead ahead of spawn) |
| dreams-come-true | 6.9 | 3.9 | right wing |
| debate-mate | 6.9 | −3.9 | left wing |
| zayi-ai-studio | 10.1 | 6.3 | right corner |
| airbnb-classifier | 10.1 | −6.3 | left corner |
| zayi-fellow | 9.2 | 0 | free-throw line |
| usacs | 11.5 | 2.6 | right block |
| hackru | 11.5 | −2.6 | left block |
| calc-ii-la | 1.0 | −8.6 | scorer's table |
| honors-ambassador | 4.2 | −8.6 | scorer's table |
| orientation-leader | 7.4 | −8.6 | scorer's table |
| rutgers-honors | 2.5 | 2.5 | half court, Rutgers side |
| critics-choice | 2.5 | −2.5 | half court, Rutgers side |
| code-ninjas | −2.5 | 3.5 | half court, bridge side |
| shah-sokoloff | −2.5 | −3.5 | half court, bridge side |
| ccm | −3.0 | 0 | half court, bridge side |
| teaching-mentoring | 4.0 | 8.6 | bench |
| oculogica | −6.4 | 0 | top of throwback arc |
| robotics | −7.2 | 3.0 | throwback |
| ai-camp | −7.2 | −3.0 | throwback |
| hackmcst | −9.4 | 5.2 | throwback |
| nslc | −9.4 | −5.2 | throwback |
| advisory-council | −12.4 | 6.0 | throwback baseline |
| java-juniors | −12.4 | −6.0 | throwback baseline |

## Parallelism

Task 1 alone (owns `package.json`). Then Tasks 2, 3, 4 in parallel (disjoint files). Task 5 after 2+3 (parallel with 4). Task 6 after 4+5. Task 7 last.

---

### Task 1: Arena deps, court constants, station placement

**Files:** Modify `package.json`, `package-lock.json`, `src/content/stations.ts` (only `pos`). Create `src/arena/logic/court.ts`, `tests/arena/placement.test.ts`.

**Interfaces — Produces (`court.ts`, no three imports):**
```ts
export type Pose = { x: number; z: number; heading: number };
export type Bounds = { minX: number; maxX: number; minZ: number; maxZ: number };
export const COURT_HALF_X = 14, COURT_HALF_Z = 7.5;
export const PLAY_BOUNDS: Bounds = { minX: -15, maxX: 15, minZ: -9.5, maxZ: 9.5 };
export const HOOP_X = 12.425, RIM_HEIGHT = 3.05, THREE_PT_R = 6.75, KEY_LENGTH = 5.8, KEY_WIDTH = 4.9, CENTER_CIRCLE_R = 1.8;
export const SPAWN: Pose = { x: 0, z: 0, heading: 0 };
export const REACH_M = 2, MIN_STATION_GAP = 3, SPAWN_OFFSET_M = 1.5;
export const SCORER_TABLE = { x: 4.2, z: -9.2, length: 8.5 }, BENCH = { x: 4.0, z: 9.2, length: 6 }, LOCKER_DOOR = { x: -6, z: 10 };
```

- [ ] **Step 1:** `npm i three@0.187 @react-three/fiber@^8.18 @react-three/drei@^9.122 zustand@^5` and `npm i -D @types/three@0.187`. `npm ls react` shows one React 18.
- [ ] **Step 2: Failing tests** `placement.test.ts`: every station inside PLAY_BOUNDS with 0.5 m margin; pairwise ≥ MIN_STATION_GAP (message names the pair); none within REACH_M + 0.5 of SPAWN; college-first: `projects` x > 5, `now` x > 0, `rutgers` 0 < x < 5, `bridge` −5 < x < 0, `throwback` x < −5, `bench` z > 7.5.
- [ ] **Step 3:** `npm test -- tests/arena/placement.test.ts` → FAIL (pos all `[0,0]`).
- [ ] **Step 4:** Create `court.ts`; set each `pos` exactly per the placement table.
- [ ] **Step 5:** `npm test` → all PASS (Phase 1 tests included).
- [ ] **Step 6:** Commit `feat: arena deps, court constants, college-first station placement`.

### Task 2: Movement, input mapping, camera math (parallel with 3, 4)

**Files:** Create `src/arena/logic/{movement,input,camera}.ts`, `tests/arena/{movement,input,camera}.test.ts`.

**Interfaces — Consumes:** `Pose`, `Bounds`, `PLAY_BOUNDS`. **Produces:**
```ts
// movement.ts
export const SPEED = 6, TURN_RATE = 2.6, MAX_DT = 0.05;
export type MoveInput = { forward: number; turn: number };  // [-1,1]; turn +1 = right (toward +z when facing +x)
export const NO_INPUT: MoveInput;
export function step(p: Pose, input: MoveInput, dt: number, b?: Bounds): Pose;  // b defaults to PLAY_BOUNDS
// input.ts
export function keysToInput(pressed: ReadonlySet<string>): MoveInput;   // KeyboardEvent.code values
export function joystickVector(dx: number, dy: number, radius: number): { x: number; y: number };
export function joystickToInput(v: { x: number; y: number }): MoveInput; // forward = v.y, turn = v.x
export function combineInput(a: MoveInput, b: MoveInput): MoveInput;      // component sum clamped to [-1,1]
// camera.ts
export const CAM_BACK = 6, CAM_HEIGHT = 3.2, CAM_LOOK_AHEAD = 2, CAM_LOOK_HEIGHT = 1.2;
export function cameraTarget(p: Pose): { position: [number, number, number]; lookAt: [number, number, number] };
export function smoothing(dt: number, reducedMotion: boolean): number;  // 1 if reduced, else 1 - exp(-6*dt)
```
`step` order: clamp dt to [0, MAX_DT] (NaN/negative → 0); `heading += turn*TURN_RATE*dt`, normalise to (−π, π]; move `forward*SPEED*dt` along `(cos h, sin h)`; clamp x/z to bounds. Joystick: screen-up = forward; dead zone 0.15 (of radius); clamp to unit circle. Tank controls: W/S ↑/↓ forward/back, A/D ←/→ turn.

- [ ] **Step 1: Failing tests:**
  - movement: 20 × dt 0.05 forward at h 0 → x ≈ 6, z ≈ 0; h π/2 forward moves +z; turn +1 for 0.05 s → heading +0.13; start (14.9, 9.4) h π/4, 100 steps → x 15, z 9.5; **RF2:** dt 5 s moves ≤ SPEED*MAX_DT, NaN dt and negative dt → pose unchanged; heading stays in (−π, π] after 200 turn steps.
  - input: KeyW → forward 1; ArrowDown → −1; KeyA → turn −1; ArrowRight → turn 1; KeyW+KeyS → forward 0; empty → NO_INPUT; `joystickVector(0,-100,50)` → {x:0,y:1}; `(5,0,50)` → {0,0}; `(30,-40,50)` has length 1; `combineInput({1,0},{1,1})` → {1,1}.
  - camera: `cameraTarget({0,0,0})` → position `[-6,3.2,0]`, lookAt `[2,1.2,0]`; at h π/2 position z = −6; `smoothing(0.016,true) === 1`; `0 < smoothing(0.016,false) < 1`.
- [ ] **Step 2:** `npm test -- tests/arena` → FAIL. **Step 3:** implement. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: arena movement, input mapping, camera math`.

### Task 3: Proximity, season, spawn, visited persistence (parallel with 2, 4)

**Files:** Create `src/arena/logic/{proximity,season,spawn,visited}.ts`, `tests/arena/{proximity,season,spawn,visited}.test.ts`.

**Interfaces — Consumes:** `REACH_M`, `SPAWN`, `SPAWN_OFFSET_M`, `Pose`; `stations`. **Produces:**
```ts
export type Placed = { id: string; pos: [number, number] };
export function nearest(p: { x: number; z: number }, list: readonly Placed[]): { id: string; dist: number } | null;
export function inReach(dist: number): boolean;      // dist <= REACH_M
export function seasonLabel(start: string): string;  // 'YYYY-MM' → 'YYYY–YY'; month >= 8 starts a season
export function spawnFor(station: Placed | null): Pose;  // null → SPAWN
export const VISITED_KEY = 'arena.visited.v1';
export function safeLocalStorage(): Storage | null;
export function loadVisited(storage: Storage | null, validIds: ReadonlySet<string>): string[];
export function saveVisited(storage: Storage | null, ids: readonly string[]): void;  // never throws
```
`spawnFor`: SPAWN_OFFSET_M from the station along the station→origin line, heading facing the station; if the station is within 0.01 m of origin use `(x − 1.5, z)`.

- [ ] **Step 1: Failing tests:**
  - proximity: closest `{id, dist}`; `[]` → null; `inReach(2)` true, `inReach(2.01)` false; walk path: at (3.6, 0) nothing in reach, at (3.8, 0) nearest is `tranquility-base` and in reach.
  - season: `'2026-11'` → `'2026–27'`; `'2026-05'` → `'2025–26'`; `'2025-08'` → `'2025–26'`; `'1999-09'` → `'1999–00'`.
  - spawn: `spawnFor(null)` equals SPAWN; for every station: in PLAY_BOUNDS, distance 1.5 ± 1e-9, `nearest(spawn).id === station.id`, `(cos h, sin h)` points at it.
  - visited (**RF4**, in-memory Storage fake): round-trip `['robotics']`; missing key → []; `'{'` → []; non-array JSON → []; unknown + duplicate ids dropped (≤ 24); null storage → [] and save no-op; throwing getItem/setItem → [] and save doesn't throw.
- [ ] **Step 2:** FAIL. **Step 3:** implement. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: arena proximity, season label, spawn, visited persistence`.

### Task 4: Routing, capability, app shell, Tip-off, bundle guards (parallel with 2, 3, 5)

**Files:** Modify `src/routing/hash.ts`, `src/App.tsx`, `src/boxscore/BoxScore.tsx` (+ css), `scripts/check-dist.mjs`, `tests/hash.test.ts`, `tests/app.test.tsx`, `tests/check-dist.test.ts`, `playwright.config.ts`, `e2e/boxscore.spec.ts`. Create `src/routing/capability.ts`, `src/shell/{TipOff.tsx,ArenaBoundary.tsx,loadArena.ts,shell.css}`, `src/arena/ArenaApp.tsx` (temporary stub; Task 6 replaces), `tests/capability.test.ts`, `tests/ui/app-routing.test.tsx`.

**Interfaces — Produces:**
```ts
// hash.ts
export type Route = { view: 'auto' | 'boxscore' | 'arena'; stationId: string | null };
export function parseHash(hash: string): Route;  // ''|'#'|'#/' → auto; '#/box-score' → boxscore; '#/arena' → arena; '#<valid id>' → auto+id; else auto,null
export function resolveView(r: Route, env: Env): 'boxscore' | 'arena';  // boxscore→boxscore; arena→env.webgl?arena:boxscore; auto→canRunArena(env)?arena:boxscore
// capability.ts
export type Env = { webgl: boolean; reducedMotion: boolean; coarsePointer: boolean; shortSide: number; deviceMemory?: number };
export function hasWebGL(doc?: Document): boolean;  // getContext('webgl2')||('webgl'); try/catch → false
export function readEnv(win?: Window): Env;         // guards missing matchMedia/screen; shortSide = min(screen.width, screen.height)
export function canRunArena(e: Env): boolean;      // webgl && !reducedMotion && !(coarsePointer && shortSide < 768) && !(deviceMemory !== undefined && deviceMemory < 4)
// shell
export type ArenaAppProps = { stationId: string | null; env: Env };  // in loadArena.ts (type-only import elsewhere)
export const loadArena: () => Promise<{ default: ComponentType<ArenaAppProps> }>;  // () => import('../arena/ArenaApp')
export function TipOff(props: { onStart: () => void }): JSX.Element;
export function ArenaBoundary(props: { fallback: ReactNode; children: ReactNode }): JSX.Element;  // class error boundary
export default function App(props?: { env?: Env }): JSX.Element;  // env defaults to readEnv()
export function BoxScore(props?: { onEnterArena?: () => void; notice?: string }): JSX.Element;
export function checkDist(dist: string, terms?: string[], opts?: { jsBudget?: number; totalBudget?: number }): { errors: string[]; jsGzipBytes: number; totalGzipBytes: number };
```
- **App:** route state updated on `hashchange`; `tipped` state (starts false, survives view changes). View `boxscore` → `<BoxScore onEnterArena={env.webgl ? () => { location.hash = '#/arena' } : undefined} />`. View `arena` with route `{auto, null}` and not tipped → `<TipOff onStart={() => setTipped(true)} />`. Otherwise `<ArenaBoundary fallback={<BoxScore notice="…failure notice…" />}><Suspense fallback={<p role="status">Loading arena…</p>}><Arena stationId env /></Suspense></ArenaBoundary>` with `Arena = lazy(loadArena)`.
- **TipOff:** h1 profile name, tagline, targets, autofocused `Tip-off` button, hint `W A S D / arrows to move · E to open a station`, link `Skip to box score` (`#/box-score`); calls `loadArena()` on mount to preload.
- **BoxScore:** scarlet `Enter the arena` header button only when `onEnterArena` given; `notice` rendered as `role="status"` above the header.
- **Stub ArenaApp:** `<div data-testid="arena-stub" data-station={stationId ?? ''}><a href="#/box-score">Skip to box score</a></div>`.
- **check-dist:** error `three.js in initial bundle` if any initial JS contains `WebGLRenderer`; `totalGzipBytes` = gzip sum of `dist/assets/**`, error `arena total over budget` if > totalBudget (default 5 MB); print both sizes.
- **Playwright:** `use: { channel: 'chromium' }` (full Chromium; spike: renders WebGL at ~120 fps headless; headless-shell default fails). Fallback documented in README: `launchOptions.args: ['--use-gl=swiftshader']`. `e2e/boxscore.spec.ts`: open `/#/box-score` instead of `/` in both projects; deep-link/`#nope`/hashchange tests become mobile-only (`test.skip(info.project.name !== 'mobile')`) because desktop now resolves those to the arena.

- [ ] **Step 1: Failing tests:**
  - `hash.test.ts` (replaces old): `''`, `'#'`, `'#/'` → `{auto,null}`; `'#/box-score'` → boxscore; `'#/arena'` → arena; `'#tranquility-base'` → `{auto,'tranquility-base'}`; `'#tranqility-base'`, `'#<script>'`, `'#/arena/x'` → `{auto,null}`; `resolveView` across desktop / phone / no-WebGL envs × 3 views (9 cases); `toHash` unchanged.
  - `capability.test.ts`: `hasWebGL` fake doc: getContext null → false, `'webgl2'` → `{}` → true, throws → false; `readEnv` without matchMedia → reducedMotion/coarsePointer false, no throw; `canRunArena`: desktop true; phone (coarse, 412) false; tablet (coarse, 820) true; reduced motion false; no WebGL false; deviceMemory 2 false, 4 true.
  - `app-routing.test.tsx` (mock `src/shell/loadArena` → stub rendering `data-testid="arena"` + `data-station`): desktop `''` → `Tip-off` + h1 `Brayden Uglione`, click → arena; desktop `#tranquility-base` → arena with `data-station="tranquility-base"`; desktop `#/box-score` → 24 cards AND `Enter the arena` present; no-WebGL env `#/box-score` → no `Enter the arena`; phone `''` → Box Score + `Enter the arena`, click → hash `#/arena` → arena; no-WebGL `#/arena` → Box Score; **RF1:** loader rejects / component throws → failure notice text + 24 cards; **RF5:** desktop tip off → arena, hash `#/box-score` → cards, hash `''` → arena without Tip-off, `#robotics` while in arena → same DOM node with `data-station="robotics"`.
  - `app.test.tsx`: `<App env={phoneEnv} />` keeps the h1 assertion.
  - `check-dist.test.ts`: initial JS containing `WebGLRenderer` → 1 error; non-initial `assets/arena.js` containing it → no error; `totalBudget: 10` → error containing `arena total`; `totalGzipBytes > 0`.
- [ ] **Step 2:** FAIL. **Step 3:** implement. **Step 4:** `npm test` PASS.
- [ ] **Step 5:** `npm run build` prints initial JS ≤ 200 KB and arena total; passes.
- [ ] **Step 6:** `npm run e2e -- e2e/boxscore.spec.ts` PASS (desktop + mobile).
- [ ] **Step 7:** Commit `feat: arena routing, capability detection, tip-off shell, bundle guards`.

### Task 5: Arena store and HTML overlays (after 2, 3; parallel with 4)

**Files:** Create `src/arena/{store.ts,liveInput.ts,useKeyboard.ts}`, `src/arena/ui/{Panel,Hud,Prompt,Joystick}.tsx`, `src/arena/ui/arena-ui.css`, `tests/arena/store.test.ts`, `tests/ui/arena-{panel,hud,keyboard}.test.tsx`.

**Interfaces — Consumes:** `spawnFor`, `loadVisited`, `saveVisited`, `safeLocalStorage`, `seasonLabel`, `joystickVector`, `StationContent`, `getStation`, `stations`. **Produces:**
```ts
export type ArenaState = {
  activeId: string | null; nearId: string | null; nearestId: string | null; visited: string[];
  spawn: { pose: Pose; seq: number };       // Player teleports when seq changes
  activate(id: string): void;               // SEAM: Phase 2 = openPanel(id); Phase 4 = shot → openPanel
  openPanel(id: string): void;              // ignores unknown ids; adds to visited once; saves
  closePanel(): void;
  setProximity(nearestId: string | null, nearId: string | null): void;  // no set() when unchanged
  spawnAt(stationId: string | null): void;  // pose = spawnFor(station|null); seq++
};
export function createArenaStore(storage: Storage | null): UseBoundStore<StoreApi<ArenaState>>;
export const useArena: ReturnType<typeof createArenaStore>;   // createArenaStore(safeLocalStorage())
export const liveInput: { pressed: Set<string>; joy: { x: number; y: number } };
export function resetLiveInput(): void;
export function useKeyboard(store?: typeof useArena): void;
export function Panel(props?: { store?: typeof useArena }): JSX.Element | null;
export function Hud(props?: { store?: typeof useArena }): JSX.Element;
export function Prompt(props: { touch: boolean; store?: typeof useArena }): JSX.Element | null;
export function Joystick(): JSX.Element;
```
- **Panel:** `role="dialog" aria-modal="true" aria-label={title}`; `Close` button (`aria-label="Close panel"`) then `<StationContent headingLevel={2} />` in a scrollable body; focus → Close on open; Tab/Shift+Tab wrap; Esc or backdrop click → `closePanel`; on close focus returns to `[data-arena-focus]`. Width `min(720px, 100vw - 32px)`, `max-height: 85vh`, `--ink` at 92% opacity, `--paper` text, scarlet accents.
- **Hud:** top-left `Season {seasonLabel(nearest.start)}` (omitted with no nearest); top-right `Stations visited {visited.length}/24` + `<a href="#/box-score">Skip to box score</a>`.
- **Prompt:** button `Press E — {title}` / `Tap to open — {title}`, `data-testid="prompt"`, `data-station={id}`; click → `activate`; hidden when `nearId` null or a panel is open.
- **Joystick:** bottom-left pad radius 50 px, `data-testid="joystick"`, `aria-hidden="true"`, pointer events + `setPointerCapture` write `joystickVector` into `liveInput.joy`; pointerup/cancel reset; `touch-action: none`.
- **useKeyboard (window):** keydown ignores inputs/textareas/contenteditable; panel open → return without `preventDefault`; movement codes → add to `pressed` + `preventDefault`; `KeyE` (not `repeat`) with `nearId` → `activate(nearId)`. keyup → delete. Window `blur`, `visibilitychange` hidden, and panel open → clear `pressed` + reset `joy`.

- [ ] **Step 1: Failing tests:**
  - store (fake storage): initial visited loaded, stale ids dropped; `activate('tranquility-base')` → activeId, visited `['tranquility-base']`, storage has it; twice → length 1; `openPanel('nope')` no change; `closePanel` → null; unchanged `setProximity` doesn't notify a subscriber; `spawnAt('robotics')` → seq+1 and pose = `spawnFor(robotics)`; `spawnAt(null)` → SPAWN; throwing storage still activates.
  - panel: activeId `tranquility-base` → dialog with h2 `Tranquility Base`, Close focused; **RF3:** Esc → activeId null; Tab from last focusable → Close; Shift+Tab from Close → last link; after close focus is on `[data-arena-focus]`.
  - hud: visited 3 + nearest `tranquility-base` → `Season 2026–27`, `Stations visited 3/24`; skip href `#/box-score`; prompt `Press E — Tranquility Base` / `Tap to open — Tranquility Base`; hidden while panel open; click opens panel.
  - keyboard (`renderHook`, fresh store): KeyW → pressed has KeyW; **RF2:** window blur → pressed empty; ArrowUp no panel → defaultPrevented; **RF3:** panel open → KeyW not added, ArrowDown not defaultPrevented, KeyE doesn't change activeId; nearId set + KeyE → opens; KeyE `repeat: true` → no-op.
- [ ] **Step 2:** FAIL. **Step 3:** implement. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: arena store, panel, hud, prompt, joystick, keyboard input`.

### Task 6: Graybox scene and ArenaApp assembly (after 4, 5)

**Files:** Create `src/arena/scene/{materials.ts,Court,Hoop,Furniture,StationMarker,Player,CameraRig,ReadySignal}.tsx`. Replace `src/arena/ArenaApp.tsx`.

**Interfaces — Produces:** `export default function ArenaApp({ stationId, env }: ArenaAppProps)` rendering a wrapper `div.arena` (`data-arena-ready`, `data-draw-calls`, `data-arena-focus`, `tabIndex={-1}`, `aria-label="3D arena. W A S D or arrows to move, E to open a station."`, visually-hidden `<h1>Brayden Uglione — Arena</h1>`), `Hud`, `Prompt touch={env.coarsePointer}`, `Joystick` (only if `env.coarsePointer`), `Panel`, and `<Canvas dpr={[1, 1.75]} camera={{ fov: 55, near: 0.1, far: 120 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>`.

Seams: Phase 3 swaps `materials.ts` (one exported object of `MeshStandardMaterial`s: floor `--ink`, court `--line`, lines `--paper`, accent `--scarlet` emissive) and `<PlayerBody />` inside Player; Phase 4 replaces `store.activate`.

Scene: ambient 0.6 + one directional 1.0, no shadows. Floor 34 × 24; court plane 28 × 15; flat white line strips 0.05 m (boundary, half line, centre ring, both arcs, both keys) from `court.ts`. Hoop ×2: pole, backboard, rim torus at RIM_HEIGHT. StationMarker: scarlet emissive ring r 0.9 at y 0.01, brighter + scale 1.1 when `nearId === id`; drei `<Billboard><Text font={labelFont}>` title at y 2.2 (local woff via `?url`). Furniture: scorer's table + bench boxes; locker doorway dark frame with `LOCKER ROOM` sign (no prompt). Player: scarlet capsule (r 0.35, len 1.1) + white nose box; pose in a ref; `useFrame`: `step(pose, activeId ? NO_INPUT : combineInput(keysToInput(pressed), joystickToInput(joy)), dt)`, write to mesh and module-level `playerPose`, compute `nearest` over stations → `setProximity`; teleport on `spawn.seq` change. CameraRig: lerp toward `cameraTarget(playerPose)` by `smoothing(dt, env.reducedMotion)`, then `lookAt`. ReadySignal: first frame → `data-arena-ready="true"`; after 30 frames → `gl.info.render.calls` into `data-draw-calls`.

ArenaApp effects: mount → `resetLiveInput()`, `useKeyboard()`, `spawnAt(stationId)`, `openPanel(stationId)` if set; `stationId` change → `spawnAt` + `openPanel` again, no remount (RF5); unmount → `closePanel()`. Effects must be idempotent (StrictMode double-mount).

- [ ] **Step 1:** Implement; TS strict; `npm test` stays green.
- [ ] **Step 2:** `npm run build`: initial ≤ 200 KB, no `three.js in initial bundle`, arena total < 5 MB; record both in the commit body.
- [ ] **Step 3:** `npm run dev` at 1280×800: Tip-off → court; ↑ walks to Tranquility Base and the prompt shows; E opens, Esc closes; walk to throwback end and bench; ~60 fps; no cross-origin requests. (Agents without a display: substitute a Playwright screenshot script and report.)
- [ ] **Step 4:** Commit `feat: arena graybox scene, player, camera, stations`.

### Task 7: Arena e2e and README (after 6)

**Files:** Create `e2e/arena.spec.ts`. Modify `README.md`.

Helpers: `trackErrors(page)` (as boxscore.spec), `trackExternal(page)` (requests whose http(s) origin ≠ baseURL), `ready(page)` = `expect(page.locator('[data-arena-ready="true"]')).toBeVisible({ timeout: 30_000 })`. Assert on `console.error` + `pageerror` only (three logs harmless warnings).

- [ ] **Step 1: Write e2e.** Desktop: Tip-off → ready, canvas visible, `Stations visited 0/24`, `data-draw-calls` ≤ 150, no errors, no external requests. `/#tranquility-base` → dialog heading `Tranquility Base`, `Stations visited 1/24`; Escape hides; `e` reopens. Walk: `/#/arena` → ready → `keyboard.down('ArrowUp')` → `waitForFunction(prompt data-station === 'tranquility-base', { polling: 'raf', timeout: 20_000 })` → `keyboard.up` → `e` → dialog. **RF5:** `/#/arena` → `Skip to box score` → 24 cards, hash `#/box-score`; `goBack()` → ready, no Tip-off. `/#nope` → Tip-off; after tip-off no dialog. Visited persists: `/#robotics` → Escape → goto `/#/arena` → `Stations visited 1/24`. `test.use({ reducedMotion: 'reduce' })`: `/` → 24 cards + `Enter the arena`. Mobile: `/` → 24 cards + `Enter the arena`; click → hash `#/arena`, ready, joystick + `Skip to box score` visible; no errors.
- [ ] **Step 2:** `npm run e2e`; fix failures in the owning task's files.
- [ ] **Step 3:** If `ready` times out, first check `page.evaluate(() => !!document.createElement('canvas').getContext('webgl2'))` and fix Playwright launch config before app code.
- [ ] **Step 4:** `npm run e2e` PASS in both projects, 3 consecutive runs.
- [ ] **Step 5:** README: arena controls; routes `#/box-score`, `#/arena`, `#<id>`; station `pos` edits + placement test; e2e browser config.
- [ ] **Step 6:** Commit `test: arena e2e (tip-off, walk, deep link, skip, mobile) and readme`.

## Executor notes

- Phone-regex false positive in vendor code (three/troika): never loosen the regex; report the match; approved fix is a named exact-string allowlist in `check-dist.mjs` with a test.
- Any static import of `src/arena/**` from the main graph hoists three into the initial bundle — the `WebGLRenderer` guard catches it. Only `import()` in `loadArena.ts`.
- SwiftShader fallback can run < 20 fps; `MAX_DT` then slows movement — the walk test polls per frame instead of timing.
- drei pulls a second `three` copy via stats-gl (spike); acceptable, but watch the arena total.
