# Arena Look (Phase 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Phase 2 graybox into the finished "Broadcast" look: toon shading + ink outlines, scarlet neon court lines and station rings with bloom, stands with an instanced crowd, rafter banners, an end-wall jumbotron, a center-court wordmark, and the CC0 Quaternius avatar (idle/jog blend) in a scarlet #29 jersey, with a capsule fallback.

**Architecture:** Every look value lives in one object, `src/arena/look/theme.ts`; components read it, and `effectiveTheme()` applies reduced-motion / low-power cuts. Layout, text, fx-detection and animation-blend math are pure modules in `src/arena/logic/` with unit tests. `materials.ts` keeps its shape (one exported object), now toon/neon. Repeated geometry (stands, crowd, pennants, LED strips) is instanced. The avatar GLB is produced by a reproducible `scripts/build-models.mjs` from private `_source/models/` downloads, loaded with `useGLTF` behind Suspense + an error boundary that falls back to the capsule.

**Tech Stack:** Phase 2 stack + `@react-three/postprocessing@^2` (React-18 line; pulls `postprocessing@^6`). DevDeps: `@gltf-transform/core@^4`, `@gltf-transform/extensions@^4`, `@gltf-transform/functions@^4`, `meshoptimizer`.

**Spec:** `docs/superpowers/specs/2026-11-21-arena-portfolio-design.md` (Phase 3). Builds on `docs/superpowers/plans/2026-11-22-arena-graybox.md`. Inputs: `docs/research/2026-11-22-cc0-assets.md`, avatar spike (`<scratchpad>/avatar-spike/tools/build.mjs`, `prep.py`), look spike worktree `C:/Users/brant/OneDrive/Documents/Projects/portfolio-look-spike` (`src/arena/scene/{lookConfig.ts,Look.tsx,materials.ts}`, throwaway reference only).

## Global Constraints

- Phase 1–2 constraints hold: palette scarlet `#CC0033` / ink `#0A0A0A` / white (`#f4f0ea` line white, `#b0002a` neon emissive); **no organization logos** (Rutgers/NASA/NBA etc. text only); never publish a phone number or private terms (`_source/private-terms.txt` via `loadPrivateTerms`/`findPrivateTerm`); no roles the owner chose to omit.
- Out of scope: Phase 4 (shot meter/arc, audio, confetti, unlock counter, banners *dropping in* on unlock — Phase 3 banners are static), Phase 5 (locker-room interior). `CLIP_SHOOT` is shipped in the GLB but unused.
- Versions: R3F 8 / drei 9 / three 0.187. Only new runtime dep: `@react-three/postprocessing@^2`. gltf/meshopt tooling is devDependencies only. Never R3F 9 / drei 10 / postprocessing-react 3.
- Initial JS ≤ 200 KB gzip; three/R3F/postprocessing reachable only via `src/shell/loadArena.ts`. Arena total (gzip of `dist/assets/**` **+ `dist/models/**`**) < 5 MB.
- Perf: 60 fps mid laptop; `dpr={[1, 1.75]}` (low-power: `1`); no shadow maps; **draw calls ≤ 150** counted across the whole frame (composer passes included). Budget table below.
- No cross-origin requests: fonts are the local Barlow Condensed woff; `useGLTF(url, false)` (no Draco → no gstatic decoder; meshopt decoder is bundled); every 3D string passes `isFontSafe` (troika fetches missing glyphs from jsDelivr otherwise).
- `prefers-reduced-motion`: no crowd sway, no neon pulse, no jumbotron rotation, idle clip paused while standing, bloom × 0.6. Low-power (`?fx=low`, `VITE_ARENA_FX=low`, or detected < 40 fps): no EffectComposer, dpr 1, no sway.
- No same-name-different-case files (Windows): never `look.ts` beside `Look.tsx`.
- Branch `phase-3-look` cut from local `phase-2-arena`. Never push dev branches; publish to `main` by squash after review. Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- `_source/` stays private/gitignored; only `public/models/player.glb` is committed. Download + unzip steps are documented in README, not automated.

## Review Focus

1. `player.glb` 404 / aborted / slow → capsule renders, arena still ready, player walks, no `pageerror`; model swaps in when a slow load completes. (Task 8 unit, Task 9 e2e)
2. Text containing a glyph outside the Barlow latin subset (e.g. `→` in `15 → 60 fps`) → troika silently fetches `cdn.jsdelivr.net`. Every 3D string goes through `toFontSafe` and a test proves all content strings are safe. (Task 2, Task 9 no-cross-origin)
3. Bloom on a weak GPU → fps collapses; detector latches low-power and drops the composer; tab-switch dt spikes must NOT trigger it. (Task 3 unit, Task 9 `?fx=low` e2e)
4. Draw-call blowup (per-seat meshes, Outlines on everything, composer resetting the counter so `data-draw-calls` reads 1) → instancing + budget table + whole-frame counting. (Task 5 ReadySignal, Task 9 ≤ 150 in full and low fx)
5. Reduced-motion visitor who clicks "Enter the arena" → nothing moves on its own (two screenshots 1 s apart identical). (Task 3 unit, Task 9 e2e)

---

## File Structure

```
src/arena/look/theme.ts                 the single theme object + effectiveTheme + gradientData
src/arena/logic/fontSafe.ts             glyph-range check + replacement for 3D text
src/arena/logic/dressing.ts             stands, crowd seats, banner slots, jumbotron/banner constants
src/arena/logic/jumbotron.ts            header, stat lines, rotation index, wordmark
src/arena/logic/fx.ts                   fx mode from URL/env, fps monitor, neon pulse level
src/arena/logic/locomotion.ts           idle/run weights + timeScale from speed
src/arena/scene/materials.ts            (rewrite) toon/neon materials + gradientMap
src/arena/scene/{Lighting,Effects,GlowPulse,FxGovernor,Outline}.tsx   look core
src/arena/scene/Arena.tsx               ArenaDressing: stands, crowd, banners, jumbotron, walls
src/arena/scene/{Stands,Crowd,Banners,Jumbotron}.tsx
src/arena/scene/avatar/{avatarConfig.ts,toonify.ts,AvatarBody.tsx,CapsuleBody.tsx,AvatarBoundary.tsx,Gear.tsx}
src/arena/scene/{Court,Hoop,StationMarker,Furniture,Player,ReadySignal}.tsx   modified
src/arena/{store.ts,ArenaApp.tsx}       modified (fx, avatar state, wiring, data attrs)
scripts/build-models.mjs                _source/models → public/models/player.glb
scripts/check-dist.mjs                  + dist/models in total, GLB budget, GLB JSON privacy scan
public/models/player.glb                committed output
tests/arena/{theme,fontSafe,dressing,jumbotron,fx,locomotion,materials,toonify,player-glb}.test.ts
tests/build-models.test.ts, tests/check-dist.test.ts, tests/arena/store.test.ts, tests/ui/arena-app.test.tsx
e2e/arena-look.spec.ts, README.md, package.json
```

## Placement (metres; Phase 2 axes: +x = Rutgers end, spawn camera at (−6, 3.2, 0) facing +x; top of view ≈ `3.2 + 0.24·d` at distance d)

| Thing | Value |
|---|---|
| Floor / court | floor 34 × 24 (`#2a2a2e`), court 28 × 15 (`#8a5a34`) |
| Stands | 6 rows, row depth 0.9, rise 0.55. Sidelines: z from ±12.5 outward, x ∈ [−15, 15], **+z side split by a tunnel gap x ∈ [−7.6, −4.4]** (locker door). Ends: \|x\| from 17.5, z ∈ [−9, 9]. → 30 row boxes, one InstancedMesh + one inverted-hull InstancedMesh (scale +0.08, BackSide, ink) |
| Crowd | seat gap 0.6 m, occupancy 0.4, seed 29, cap 450; capsule (0.22, 0.4, 2, 6); shirts `#2a2a2a #8a8a8a #cc0033 #f4f0ea` weights 0.4/0.25/0.25/0.1 (darker than spike's mix) |
| Jumbotron | Rutgers end wall, centre (23.2, 5.4, 0), 7 w × 3 h × 0.6 d, single face toward −x. Clears the backboard sight-line from spawn |
| Banners | 7 pennants 2.2 × 2.2 in a row above the jumbotron: x 22.9, top y 9.4, z spacing 2.6 (z = −7.8 … 7.8), alternating scarlet/white, face −x. Visible from spawn |
| End walls / rafters | dark walls at x = ±23.8 (24 × 12 high), one rafter truss box per end at y 10 |
| Wordmark | `UGLIONE '29`, flat at centre circle (0, 0.03, 0), fontSize 1.0, reads from −x, colour `#f4f0ea` |
| Neon | all court lines scarlet neon (width 0.06), station rings neon; LED ribbon along each stand front (5 instances) |

## Draw-call budget (e2e enforces total ≤ 150; spike measured 74 for the base look)

Court 18 (floor, court, ~15 lines, wordmark) · Hoops 14 (2 × pole/board/arm/rim/net + outlines on board & pole) · Furniture 9 · Stations 24 rings + ≤ 3 visible labels · Avatar ≤ 18 (≤ 7 prims + outlines, 2 sneakers, headband, number) · Stands 2 + LED 1 + crowd 1 + walls/rafters 4 · Banners 1 + 7 text · Jumbotron 5 · Bloom/composer ≤ 15 → ≈ 122.

## Parallelism

Orchestrator first: `git switch -c phase-3-look phase-2-arena`. **Wave 1:** Tasks 1, 2, 3 in parallel (Task 1 alone owns `package.json`/lock; 2 and 3 are pure files). **Wave 2:** Task 4 (after 1) ∥ Task 5 (after 1, 3) — disjoint (4: scripts, check-dist, `public/models`, `scene/avatar/avatarConfig.ts`; 5: materials, store, ArenaApp, look-core scene files). **Wave 3:** Tasks 6 (after 2, 5), 7 (after 2, 5), 8 (after 3, 4, 5) in parallel — disjoint (6: Court/Hoop/StationMarker/Furniture; 7: Arena.tsx + Stands/Crowd/Banners/Jumbotron; 8: Player.tsx + `scene/avatar/*` except avatarConfig). **Task 9** last.

---

### Task 1: Deps and the theme

**Files:** Modify `package.json`, `package-lock.json`. Create `src/arena/look/theme.ts`, `tests/arena/theme.test.ts`.

**Interfaces — Produces:**
```ts
export const theme: Theme;   // values below, `as const`-style readonly
export type Theme = {
  palette: { scarlet: string; ink: string; line: string; neon: string };
  colors: { court: string; floor: string; stand: string; background: string; prop: string; dark: string };
  fog: { color: string; near: number; far: number } | null;
  gradient: number[];                                  // toon ramp texels 0–255, ascending, 2–5 steps
  outline: { color: string; thickness: number; hullScale: number };
  bloom: { intensity: number; threshold: number; smoothing: number; radius: number; multisampling: number };
  neon: { line: number; ring: number; ringIdle: number; ringHot: number };   // emissiveIntensity; ring × idle/hot
  pulse: { amp: number; hz: number };
  lights: {
    ambient: number;
    hemi: { sky: string; ground: string; intensity: number };
    dir: { pos: [number, number, number]; intensity: number };
    spot: { pos: [number, number, number]; intensity: number; angle: number; penumbra: number; distance: number; decay: number; color: string };
  };
  crowd: { colors: string[]; weights: number[]; sway: number; swayHz: number };
  reducedBloomScale: number;
};
export function effectiveTheme(t: Theme, o: { reducedMotion: boolean; lowPower: boolean }): Theme;  // pure copy
export function gradientData(texels: readonly number[]): Uint8Array;  // throws if not ascending ints in [0,255] or length ∉ [2,5]
```
Values (owner decision: Look C "Broadcast" + B's neon): palette `#cc0033 #0a0a0a #f4f0ea #b0002a`; colors court `#8a5a34`, floor `#2a2a2e`, stand `#444449`, background `#1b1c22`, prop `#8a8a8a`, dark `#0a0a0a`; fog `null`; gradient `[70, 160, 255]`; outline `#0a0a0a`, 0.015, hullScale 0.08; bloom intensity 0.5, threshold 0.5, smoothing 0.1, radius 0.4, multisampling 4; neon line 3.5, ring 3.5, ringIdle 0.7, ringHot 1.4; pulse amp 0.06, hz 0.4; lights ambient 0.9, hemi `#ffffff`/`#555566` 0.8, dir (0,14,3) 0.7, spot (0,16,0) 900 / 0.75 / 0.5 / 40 / 2 / `#fff6e8` (**no cone mesh**); crowd colours/weights per Placement, sway 0.04, swayHz 0.6; reducedBloomScale 0.6.
`effectiveTheme`: reducedMotion → pulse.amp 0, crowd.sway 0, bloom.intensity × reducedBloomScale; lowPower → bloom.intensity 0, crowd.sway 0. Never mutates input.

- [ ] **Step 1:** `npm i @react-three/postprocessing@^2` and `npm i -D @gltf-transform/core@^4 @gltf-transform/extensions@^4 @gltf-transform/functions@^4 meshoptimizer`; add script `"models": "node scripts/build-models.mjs"`. `npm ls react three` → one React 18, `@react-three/fiber@8`.
- [ ] **Step 2: Failing tests** `theme.test.ts`: `gradientData([70,160,255])` equals `Uint8Array [70,160,255]`; `[255,70]`, `[70]`, `[70,300]`, `[1.5,2]` throw. Every hex string in `theme` except `colors.court` is one of `#cc0033 #0a0a0a #f4f0ea #ffffff #b0002a #fff6e8` or neutral (max − min channel ≤ 0x20). `crowd.weights` sum to 1 ± 1e-9 and length = colors length; crowd colors include `#cc0033`. `effectiveTheme(theme,{reducedMotion:true,lowPower:false})` → pulse.amp 0, sway 0, bloom 0.3; lowPower → bloom 0, sway 0; neither → deep-equal to `theme`; input object unchanged (deep-equal snapshot before/after).
- [ ] **Step 3:** FAIL. **Step 4:** implement. **Step 5:** `npm test` PASS.
- [ ] **Step 6:** Commit `feat: look deps and broadcast theme`.

### Task 2: Font-safe text, dressing layout, jumbotron copy (parallel with 1, 3)

**Files:** Create `src/arena/logic/{fontSafe,dressing,jumbotron}.ts`, `tests/arena/{fontSafe,dressing,jumbotron}.test.ts`.

**Interfaces — Consumes:** `stations`, `banners`, `profile` (`src/content`), `Banner`, `Station`, `Profile` types. **Produces:**
```ts
// fontSafe.ts
export const FONT_RANGES: ReadonlyArray<readonly [number, number]>;  // copied from @fontsource/barlow-condensed/latin-800.css unicode-range
export function isFontSafe(s: string): boolean;                     // '\n' allowed
export function toFontSafe(s: string): string;                      // '→' → 'to', collapse double spaces; drops any other unsafe char
// dressing.ts
export type Box = { x: number; y: number; z: number; w: number; h: number; d: number };  // centre + size
export type Seat = { x: number; y: number; z: number; rotY: number; tint: number; phase: number };
export type Slot = { x: number; y: number; z: number; rotY: number };
export const STAND = { rows: 6, rowDepth: 0.9, rise: 0.55, seatGap: 0.6, sideZ0: 12.5, sideHalfX: 15, endX0: 17.5, endHalfZ: 9, gap: [-7.6, -4.4] } as const;
export const CROWD_SEED = 29, CROWD_OCCUPANCY = 0.4, CROWD_MAX = 450;
export const BANNER = { w: 2.2, h: 2.2, spacing: 2.6, x: 22.9, topY: 9.4 } as const;
export const JUMBOTRON = { x: 23.2, y: 5.4, z: 0, w: 7, h: 3, d: 0.6 } as const;
export const END_WALL_X = 23.8;
export function mulberry32(seed: number): () => number;
export function standBlocks(): Box[];                                // 30 boxes
export function standFronts(): Box[];                                // 5 LED strips, row-0 front faces
export function crowdLayout(seed?: number, occupancy?: number, weights?: readonly number[]): Seat[];
export function bannerSlots(n: number): Slot[];
export function bannerText(b: Banner): string;                       // `${year}\n${TITLE}\n${issuer}`, toFontSafe
// jumbotron.ts
export const JUMBO_STAT_IDS = ['tranquility-base', 'zayi-ai-studio', 'airbnb-classifier', 'dreams-come-true'] as const;
export const JUMBO_PERIOD_S = 6;
export function jumbotronHeader(p: Profile): string;                 // 'BRAYDEN UGLIONE #29'
export function jumbotronLines(list: readonly Station[], ids?: readonly string[]): string[];  // `${TITLE}\n${toFontSafe(value)} ${label}`; skips null stat / unknown id
export function jumbotronIndex(t: number, n: number, period?: number): number;  // floor(t/period) mod n; n 0 → −1; NaN/neg t → 0
export function wordmark(p: Profile): string;                       // last name upper + " '" + jersey 2-digit
```
Crowd: one seat every `seatGap` along each row of every stand block, seat y = row top; keep with probability `occupancy` from `mulberry32(seed)`; `tint` = weighted pick; `phase` ∈ [0, 2π); `rotY` faces the court (+z side faces −z, −z side +z, +x end −x, −x end +x); truncate to `CROWD_MAX`. Banner slot `rotY = -Math.PI / 2` (faces −x), centre y = `topY − h/2`, z centred on 0.

- [ ] **Step 1: Failing tests:**
  - fontSafe: `FONT_RANGES` equals the ranges parsed from `node_modules/@fontsource/barlow-condensed/latin-800.css`; `isFontSafe('15 → 60 fps')` false; `toFontSafe('15 → 60 fps') === '15 to 60 fps'`; `toFontSafe('2026–27') === '2026–27'`; **RF2:** every 3D string — all station titles, `bannerText` of all 7 banners, `jumbotronHeader(profile)`, every `jumbotronLines(stations)` entry, `wordmark(profile)`, `'LOCKER ROOM'`, `String(profile.jersey)` — satisfies `isFontSafe`, and `toFontSafe(s)` differs from `s` only where `s` contains `→`.
  - dressing: `standBlocks()` length 30; none intersects rect x ∈ [−17, 17] × z ∈ [−12, 12]; none on +z side overlaps x ∈ (−7.6, −4.4). `crowdLayout()` deep-equals a second call; `crowdLayout(30)` differs; length ≤ 450 and within [0.3, 0.5] × total seat count; every seat outside the floor rect and the tunnel gap; facing `(cos(-rotY), sin(-rotY))`·(−x, −z) > 0; tint 2 (scarlet) fraction ∈ [0.15, 0.35]; phase ∈ [0, 2π). `bannerSlots(7)`: 7 slots, z = [−7.8, −5.2, …, 7.8] (±1e-9), all y = 8.3, rotY −π/2, all \|z\| ≤ 9; slot top 9.4 ≤ 3.2 + 0.24 × (22.9 + 6) (visible from spawn). `bannerText(banners[1]) === '2026\nBEST USE OF CODE & TECHNOLOGY\nNASA Space Apps NYC'`. Jumbotron bottom `y − h/2` ≥ 3.3 + 0.5 (clears top row).
  - jumbotron: header `'BRAYDEN UGLIONE #29'`; `jumbotronLines(stations)` length 4, first `'TRANQUILITY BASE\n15 to 60 fps after baking Sun shadows on the GPU'`; unknown id / `debate-mate` (stat null) skipped; `jumbotronIndex(0,4)` 0, `(6,4)` 1, `(25,4)` 0, `(5,0)` −1, `(NaN,4)` 0; `wordmark(profile) === "UGLIONE '29"`.
- [ ] **Step 2:** FAIL. **Step 3:** implement. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: font-safe 3D text, arena dressing layout, jumbotron copy`.

### Task 3: Fx mode, fps monitor, pulse, locomotion blend (parallel with 1, 2)

**Files:** Create `src/arena/logic/{fx,locomotion}.ts`, `tests/arena/{fx,locomotion}.test.ts`.

**Interfaces — Produces:**
```ts
// fx.ts
export type FxMode = 'full' | 'low';
export function forcedFx(search: string, envFlag?: string): FxMode | null;  // '?fx=low' | env 'low' → 'low'; '?fx=full' → 'full'; else null (auto). URL wins over env.
export const FPS_WARMUP_S = 3, FPS_WINDOW_S = 2, FPS_LOW = 40, FPS_STRIKES = 2, FPS_MAX_DT = 0.25;
export type FpsMonitor = { sample(dt: number): FxMode; readonly mode: FxMode };
export function createFpsMonitor(): FpsMonitor;
export function neonLevel(t: number, base: number, pulse: { amp: number; hz: number }): number;  // base·(1 + amp·sin(2π·hz·t)); amp 0 → base exactly
// locomotion.ts
export const MOVE_EPS = 0.05, RUN_FULL_AT = 2.0, RUN_REF_SPEED = 4.0;   // RUN_REF_SPEED: m/s at timeScale 1 — tune visually for no foot-slide
export function locomotion(speed: number): { idle: number; run: number; timeScale: number };
export function smoothSpeed(prev: number, raw: number, dt: number): number;  // exp smoothing k = 1 − e^(−10·dt); NaN → prev
```
Monitor: dt NaN, ≤ 0 or > FPS_MAX_DT is ignored (tab switch). Time accumulates only from valid dts; after FPS_WARMUP_S, each FPS_WINDOW_S window computes frames/time; < FPS_LOW → strike, else strikes = 0; strikes ≥ FPS_STRIKES → mode 'low', latched forever.
Locomotion: `run = smoothstep(MOVE_EPS, RUN_FULL_AT, speed)`, `idle = 1 − run`, `timeScale = clamp(speed / RUN_REF_SPEED, 0.8, 1.6)` when run > 0 else 1; NaN/negative speed → `{1, 0, 1}`.

- [ ] **Step 1: Failing tests:**
  - fx: `forcedFx('?fx=low')` 'low'; `('', 'low')` 'low'; `('?fx=full','low')` 'full'; `('?a=1')` null. Monitor: 600 × 1/60 → 'full'; 30 fps for 8 s → 'low' and first 'low' after ≥ 7 s simulated; 30 fps for 3 s then 60 fps for 10 s → 'full'; one slow window then fast → 'full'; **RF3:** 60 fps with a 5 s dt every 100 frames for 20 s → 'full'; after 'low', 60 fps for 30 s stays 'low'. `neonLevel(1.25, 3.5, {amp:0,hz:0.4}) === 3.5`; amp 0.06 stays within [3.29, 3.71].
  - locomotion: speed 0 → `{idle:1, run:0, timeScale:1}`; 6 → run 1, timeScale 1.5; weights sum 1 for 0…6 step 0.1 and run monotonic; NaN → idle 1; `smoothSpeed(0, 6, 1/60)` ∈ (0, 6); `smoothSpeed(2, NaN, 0.016) === 2`.
- [ ] **Step 2:** FAIL. **Step 3:** implement. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: fx mode detection, neon pulse, locomotion blend`.

### Task 4: Avatar model pipeline and dist guards (after 1; parallel with 5)

**Files:** Create `scripts/build-models.mjs`, `public/models/player.glb`, `src/arena/scene/avatar/avatarConfig.ts`, `tests/build-models.test.ts`, `tests/arena/player-glb.test.ts`. Modify `scripts/check-dist.mjs`, `tests/check-dist.test.ts`.

**Inputs (owner downloads, private, gitignored):** itch zips of Quaternius *Universal Base Characters [Standard]* and *Universal Animation Library [Standard]* (CC0) saved to `_source/models/`, unzipped to `_source/models/ubc/` and `_source/models/ual/`. Script reads
`SRC_BODY = 'ubc/Universal Base Characters[Standard]/Base Characters/Godot - UE/Superhero_Male_FullBody.gltf'` (+ its `.bin`) and
`SRC_ANIMS = 'ual/Universal Animation Library[Standard]/Unreal-Godot/UAL1_Standard.glb'`; missing file → exit 1 naming the path.

**Interfaces — Produces:**
```ts
// avatarConfig.ts
export const PLAYER_GLB_URL = '/models/player.glb';
export const PLAYER_GLB_MAX_BYTES = 400_000;          // spike: 285 KB raw / 120 KB gzip
export const CLIP_IDLE = 'Idle_Loop', CLIP_RUN = 'Jog_Fwd_Loop', CLIP_SHOOT = 'Spell_Simple_Shoot';
export const KEEP_CLIPS = ['Idle_Loop','Walk_Loop','Jog_Fwd_Loop','Sprint_Loop','Jump_Start','Jump_Loop','Jump_Land','Spell_Simple_Shoot'] as const;
export type AvatarRole = 'jersey' | 'shorts' | 'keep';
export const MATERIAL_ROLES: Record<'Skin'|'Jersey'|'Shorts'|'Hair'|'Eyes', AvatarRole> = { Skin: 'keep', Jersey: 'jersey', Shorts: 'shorts', Hair: 'keep', Eyes: 'keep' };
export const BONE_HEAD = 'Head', BONE_CHEST = 'spine_03', BONE_FOOT_L = 'foot_l', BONE_FOOT_R = 'foot_r';
export const AVATAR_HEIGHT_M = 1.85, AVATAR_YAW_OFFSET = Math.PI / 2;   // verify facing +x at heading 0 in Task 8
```
```js
// build-models.mjs (exports for tests; main guarded like check-dist.mjs)
export const KEEP_CLIPS;                                           // same list (test asserts equal to avatarConfig)
export function stripTextures(json) /* → json without images/textures/samplers/texture refs (port of spike prep.py) */;
export function classifyTriangle(t /* { rel: number, xAbsRel: number, joint: string } */) /* → 'Skin'|'Jersey'|'Shorts' */;
export function smoothLabels(labels /* string[] */, adjacency /* number[][] */, passes /* number */) /* → string[] */;
export function pickClips(available /* string[] */, keep /* string[] */) /* → string[]; throws listing available if one is missing */;
```
Pipeline (port of spike `tools/build.mjs`): readJSON with stripped textures → flat named materials `Skin Jersey Shorts Hair Eyes` (Jersey `#CC0033`, Shorts near-black, linear factors) → split body primitive into Skin/Jersey/Shorts **per triangle** (fixes the spike's jagged per-vertex edges): classify each triangle by its centroid's relative height, |x|/H and dominant joint using the spike's rules (`spine_01–03` & rel > 0.52 → Jersey; `clavicle_*` & |x| < 0.11·H → Jersey; `pelvis|thigh_[lr]` & 0.40 < rel < 0.56 → Shorts; `spine_01` & 0.40 < rel ≤ 0.52 → Shorts; any `upperarm|lowerarm|hand` → Skin), then 2 passes of `smoothLabels` (a triangle flips to the majority label of its edge-neighbours when ≥ 2 of 3 agree) → copy `KEEP_CLIPS` from UAL by joint name (rotation all bones; translation `root`/`pelvis` only; drop scale) → try `join()` to merge the three Skin primitives (keep if it succeeds) → `prune, dedup, weld, resample({tolerance:1e-4}), prune, meshopt({encoder, level:'high'})`, EXT_meshopt_compression required → write; print size, tris, clips, primitive count; exit 1 if > `PLAYER_GLB_MAX_BYTES`.
check-dist: export `glbJson(buf: Buffer): string | null` (magic `glTF`, chunk 0 type `JSON`); `.glb` files get the phone + private-term scan on their JSON chunk; error `model over budget: <rel>` if a `.glb` > `PLAYER_GLB_MAX_BYTES` (opts `modelBudget`); `totalGzipBytes` also sums `dist/models/**`.

- [ ] **Step 1: Failing tests:**
  - build-models: `pickClips(['Idle_Loop','X'], ['Idle_Loop'])` → `['Idle_Loop']`; missing clip throws with message containing `X`; `KEEP_CLIPS` deep-equals avatarConfig's; `stripTextures` on a fixture with `normalTexture`/`baseColorTexture` removes `images`, `textures`, `samplers` and both refs; `classifyTriangle({rel:0.6,xAbsRel:0.05,joint:'spine_02'})` 'Jersey', `({rel:0.45,…,joint:'pelvis'})` 'Shorts', `({rel:0.6,…,joint:'upperarm_l'})` 'Skin', `({rel:0.2,…,joint:'calf_l'})` 'Skin'; `smoothLabels` flips a lone Jersey triangle surrounded by 3 Skin neighbours and keeps a boundary triangle with 1–1–1 neighbours.
  - player-glb (reads committed file with NodeIO + `MeshoptDecoder`): size ≤ `PLAYER_GLB_MAX_BYTES`; animation names ⊇ `KEEP_CLIPS`; `extensionsUsed` has `EXT_meshopt_compression`, lacks `KHR_draco_mesh_compression` and `KHR_texture_basisu`; 0 images/textures; no buffer `uri`; exactly 1 skin; material names = {Skin, Jersey, Shorts, Hair, Eyes}; nodes named `Head`, `spine_03`, `foot_l`, `foot_r` exist; JSON chunk has no phone match / private term.
  - check-dist: synthetic GLB whose JSON contains `"555-123-4567"` → phone error; `modelBudget: 10` → `model over budget`; a `dist/models/x.glb` raises `totalGzipBytes`; `glbJson(Buffer.from('nope'))` null.
- [ ] **Step 2:** FAIL. **Step 3:** implement script + guards.
- [ ] **Step 4:** `npm run models` → writes `public/models/player.glb`, prints size ≤ 400 KB and 8 clips. Open in the spike viewer or Task 8 and confirm jersey/shorts edges are visibly cleaner than spike `shots/player.png`; if still jagged, report (don't hand-edit the GLB).
- [ ] **Step 5:** `npm test` PASS; `npm run build` prints arena total including models.
- [ ] **Step 6:** Commit `feat: reproducible avatar build (meshopt GLB) and model dist guards` (body: GLB size, tris, primitive count).

### Task 5: Look core — toon materials, lights, bloom, fx plumbing, draw-call count (after 1, 3; parallel with 4)

**Files:** Rewrite `src/arena/scene/materials.ts`, `src/arena/scene/ReadySignal.tsx`. Create `src/arena/scene/{Lighting,Effects,GlowPulse,FxGovernor,Outline}.tsx`, `src/arena/scene/Arena.tsx` (stub `export function ArenaDressing(_: { theme: Theme }) { return null }`; Task 7 replaces), `tests/arena/materials.test.ts`. Modify `src/arena/store.ts`, `src/arena/ArenaApp.tsx`, `tests/arena/store.test.ts`, `tests/ui/arena-app.test.tsx`.

**Interfaces — Consumes:** `theme`, `effectiveTheme`, `gradientData`, `Theme`; `FxMode`, `forcedFx`, `createFpsMonitor`, `neonLevel`. **Produces:**
```ts
// materials.ts — keys kept from Phase 2 + new
export type MaterialKey = 'floor'|'court'|'line'|'prop'|'dark'|'accent'|'accentHot'|'neon'|'net'|'jersey'|'shorts'|'stand'|'hull'|'crowd'|'banner'|'bannerAlt'|'screen';
export const gradientMap: DataTexture;                     // RedFormat, NearestFilter min/mag, from gradientData(theme.gradient)
export function createMaterials(t: Theme): Record<MaterialKey, Material>;
export const materials: Record<MaterialKey, Material>;     // createMaterials(theme)
export const NEON_BASE: { neon: number; accent: number; accentHot: number };  // base emissiveIntensity values GlowPulse modulates
// store additions
fx: FxMode; setFx(m: FxMode): void;                         // no set() when unchanged
avatar: 'loading' | 'model' | 'capsule'; setAvatar(s: 'loading' | 'model' | 'capsule'): void;
// components
export function Lighting(props: { theme: Theme }): JSX.Element;    // background, optional fog, ambient, hemi, dir, spotLight (no cone mesh)
export function Effects(props: { theme: Theme }): JSX.Element;     // <EffectComposer multisampling><Bloom mipmapBlur …/></EffectComposer>
export function GlowPulse(props: { theme: Theme }): null;          // per frame: neon/accent/accentHot emissiveIntensity = neonLevel(t, NEON_BASE.x, theme.pulse); no-op when amp 0
export function FxGovernor(props: { enabled: boolean }): null;     // createFpsMonitor(); on 'low' → setFx('low')
export function Outline(): JSX.Element;                            // drei <Outlines color={theme.outline.color} thickness={theme.outline.thickness} />
```
Materials: toon (`MeshToonMaterial`, `gradientMap`) for floor `#2a2a2e`, court `#8a5a34`, line `#f4f0ea`, prop `#8a8a8a`, dark, stand `#444449`, jersey `#cc0033`, shorts `#0a0a0a`, banner `#cc0033`, bannerAlt `#f4f0ea`, crowd (white base, instance colours); neon/accent/accentHot = toon `color #cc0033`, `emissive #b0002a`, `toneMapped: false`, emissiveIntensity = neon.line / ring×ringIdle / ring×ringHot; net = `MeshBasicMaterial` `#f4f0ea` wireframe; hull = `MeshBasicMaterial` ink `side: BackSide`; screen = toon `#0a0a0a` emissive `#1b1c22` intensity 0.6.
ReadySignal (**spike finding**): on mount `gl.info.autoReset = false` (restore on unmount); one `useFrame(cb, -1000)`: if `frames === 30` write `gl.info.render.calls` (= whole previous frame incl. composer) to `data-draw-calls`, then `gl.info.reset()`; frame 1 → `data-arena-ready="true"` as before.
ArenaApp: `forced = forcedFx(location.search, import.meta.env.VITE_ARENA_FX)`; mount → `setFx(forced ?? 'full')`, `setAvatar('loading')`; `t = effectiveTheme(theme, { reducedMotion: env.reducedMotion, lowPower: fx === 'low' })`; Canvas `dpr={fx === 'low' ? 1 : [1, 1.75]}`; children add `<Lighting theme={t}/>`, `<ArenaDressing theme={t}/>`, `<GlowPulse theme={t}/>`, `<FxGovernor enabled={forced === null && fx === 'full'}/>`, `{fx === 'full' && <Effects theme={t}/>}`; drop the Phase 2 ambient/directional lights. Wrapper gains `data-fx={fx}`, `data-motion={env.reducedMotion ? 'reduced' : 'full'}`, `data-avatar={avatar}`.

- [ ] **Step 1: Failing tests:**
  - materials (node, no WebGL): every key exists; toon keys are `MeshToonMaterial` sharing the same `gradientMap` instance with `magFilter === NearestFilter`; `gradientMap.image.data` equals `[70,160,255]`; neon/accent/accentHot `toneMapped === false`, `emissiveIntensity` 3.5 / 2.45 / 4.9, emissive hex `0xb0002a`; hull `side === BackSide`.
  - store: `setFx('low')` → fx 'low'; unchanged `setFx` doesn't notify; `setAvatar('capsule')` → avatar 'capsule'.
  - arena-app (add mocks: `@react-three/postprocessing` → nulls; `useThree` stub; `Arena`, `Lighting`, `Effects`, `GlowPulse`, `FxGovernor` → null): wrapper has `data-fx="full"`, `data-motion="full"`, `data-avatar="loading"`; env reducedMotion → `data-motion="reduced"`; with `location.search = '?fx=low'` → `data-fx="low"`; existing three tests still pass.
- [ ] **Step 2:** FAIL. **Step 3:** implement. **Step 4:** `npm test` PASS.
- [ ] **Step 5:** `npm run build`: initial ≤ 200 KB, no `three.js in initial bundle`, arena total < 5 MB (record in commit body).
- [ ] **Step 6:** Commit `feat: toon materials, broadcast lighting, bloom, fx mode, whole-frame draw-call count`.

### Task 6: Court, hoops, stations, furniture look (after 2, 5; parallel with 7, 8)

**Files:** Modify `src/arena/scene/{Court,Hoop,StationMarker,Furniture}.tsx`.

**Interfaces — Consumes:** `materials`, `Outline`, `theme`, `wordmark`, `toFontSafe`, `profile`. **Produces:** none new (same exports).

- Court: floor/court use toon materials; **all** line strips/arcs → `materials.neon`, width 0.06, y 0.025; wordmark drei `<Text font={labelFont}>{wordmark(profile)}</Text>` at (0, 0.03, 0), flat (`rotation [-π/2, 0, -π/2]` so its up = +x, readable from the spawn camera), fontSize 1.0, colour `#f4f0ea`.
- Hoop: board/pole/arm toon + `<Outline/>` on board and pole; rim `materials.accent`; net = open cylinder (top r 0.23, bottom r 0.15, h 0.45, 12 radial, `openEnded`) `materials.net` under the rim.
- StationMarker: ring `materials.accent` / `materials.accentHot` (near); label text `toFontSafe(title)`; outline colour stays ink / scarlet.
- Furniture: toon materials; `<Outline/>` on scorer's table and bench; scorer's-table front LED strip (`materials.neon`, 8.5 × 0.12 box face); sign text `toFontSafe('LOCKER ROOM')`.

- [ ] **Step 1:** Implement; `npm test` green; TS strict.
- [ ] **Step 2:** `npm run dev` (or Playwright screenshot script without a display) at 1280×800: neon lines bloom, wordmark readable after walking forward 2 m, no grey spotlight cone; record draw calls from `data-draw-calls`.
- [ ] **Step 3:** Commit `feat: neon court lines, wordmark, toon hoops and props`.

### Task 7: Stands, crowd, banners, jumbotron (after 2, 5; parallel with 6, 8)

**Files:** Replace `src/arena/scene/Arena.tsx`. Create `src/arena/scene/{Stands,Crowd,Banners,Jumbotron}.tsx`.

**Interfaces — Consumes:** `standBlocks`, `standFronts`, `crowdLayout`, `bannerSlots`, `bannerText`, `BANNER`, `JUMBOTRON`, `END_WALL_X`, `jumbotronHeader`, `jumbotronLines`, `jumbotronIndex`, `JUMBO_PERIOD_S`, `Theme`, `materials`, `banners`, `stations`, `profile`. **Produces:** `export function ArenaDressing({ theme }: { theme: Theme }): JSX.Element` (signature fixed by Task 5).

- Stands: one `InstancedMesh` (unit box, `materials.stand`, matrices from `standBlocks()`) + one hull `InstancedMesh` (same matrices × (1 + hullScale) scale, `materials.hull`) + one LED `InstancedMesh` (`standFronts()`, `materials.neon`); two end walls + two rafter trusses (`materials.dark`).
- Crowd: one `InstancedMesh` of `CapsuleGeometry(0.22, 0.4, 2, 6)`, `materials.crowd` (cloned for the shader), `setColorAt` from `theme.crowd.colors[tint]`, `computeBoundingSphere()` after matrices; sway in the vertex shader (`onBeforeCompile`, uniforms `uTime`, `uSway`, `uHz`, per-instance `aPhase` `InstancedBufferAttribute`): `transformed.x += uSway * sin(6.2832*uHz*uTime + aPhase)`. `uSway = theme.crowd.sway` (0 under reduced motion / low power → `uTime` not updated).
- Banners: one `InstancedMesh` pennant (`ShapeGeometry`: rectangle 2.2 × 1.7 + bottom triangle to 2.2 tall), even index `materials.banner` text `#f4f0ea`, odd `materials.bannerAlt` text `#cc0033` (two InstancedMeshes, 4 + 3); per slot drei `<Text>` `bannerText(b)`, fontSize 0.2, `maxWidth 1.9`, centred, 0.01 in front.
- Jumbotron: body box `materials.dark` + `<Outline/>`; screen plane `materials.screen` on the −x face; neon frame (thin box ring, `materials.neon`); `<Text>` header fontSize 0.5 `#f4f0ea` at top third; stat `<Text>` fontSize 0.3, `maxWidth 6.4`, `#f4f0ea`; index from `jumbotronIndex(clock.elapsedTime, lines.length)` in `useFrame`, React state set only when it changes; reduced motion → index 0, no updates.

- [ ] **Step 1:** Implement; `npm test` green.
- [ ] **Step 2:** Screenshot from spawn at 1280×800: jumbotron header + 7 banners visible above the Rutgers end; crowd not busy (darker mix); total draw calls ≤ 150 (record). Turn 180°: stands + tunnel gap at the locker door.
- [ ] **Step 3:** Commit `feat: instanced stands and crowd, rafter banners, end-wall jumbotron`.

### Task 8: Avatar with idle/run blend and capsule fallback (after 3, 4, 5; parallel with 6, 7)

**Files:** Create `src/arena/scene/avatar/{toonify.ts,AvatarBody.tsx,CapsuleBody.tsx,AvatarBoundary.tsx,Gear.tsx}`, `tests/arena/toonify.test.ts`. Modify `src/arena/scene/Player.tsx`.

**Interfaces — Consumes:** avatarConfig constants; `locomotion`, `smoothSpeed`, `MOVE_EPS`; `materials`, `gradientMap`, `Outline`; store `setAvatar`; `profile.jersey`. **Produces:**
```ts
export function toonify(root: Object3D, m: typeof materials): void;   // swaps each mesh material by MATERIAL_ROLES[name]: jersey→m.jersey, shorts→m.shorts, keep→new MeshToonMaterial({ color: orig.color, gradientMap }); unknown name → keep
export const playerMotion: { speed: number };                        // Player.tsx, smoothed m/s
export function CapsuleBody(): JSX.Element;                           // Phase 2 capsule + nose, materials.jersey / line
export class AvatarBoundary extends Component<{ fallback: ReactNode; children: ReactNode }> // componentDidCatch → setAvatar('capsule')
export function AvatarBody(props: { reducedMotion: boolean }): JSX.Element;
export function Gear(props: { scene: Object3D }): JSX.Element;      // sneakers + headband + back number, portalled onto bones
```
- Player: `PlayerBody` becomes `<AvatarBoundary fallback={<CapsuleBody/>}><Suspense fallback={<CapsuleBody/>}><AvatarBody reducedMotion={…}/></Suspense></AvatarBoundary>`; speed = `hypot(dx, dz) / dt` → `smoothSpeed`, set to 0 on spawn-seq change, clamped to `SPEED`. Player receives `reducedMotion` from ArenaApp's existing `env` (add prop `reducedMotion` to `<Player/>` — the only ArenaApp line this task touches; Task 5 is already merged, and 6/7 don't touch ArenaApp).
- AvatarBody: `useGLTF(PLAYER_GLB_URL, false)` (**no Draco**; never `useGLTF.preload` — a rejected preload is an unhandled rejection); `toonify` once in `useMemo`; scale so bbox height = `AVATAR_HEIGHT_M`, `rotation.y = AVATAR_YAW_OFFSET`; `<Outline/>` on body meshes; `useAnimations`: play `CLIP_IDLE` and `CLIP_RUN` looping, each frame `setEffectiveWeight` from `locomotion(playerMotion.speed)` and run `timeScale`; reducedMotion && speed < MOVE_EPS → idle `paused = true`; missing clip → skip that action (no throw); mount → `setAvatar('model')`.
- Gear (fixes barefoot/bald): sneakers = `BoxGeometry(0.12, 0.08, 0.28)` `materials.line` + `<Outline/>` under `foot_l`/`foot_r`; headband = `TorusGeometry(0.11, 0.025, 6, 16)` `materials.jersey` under `Head`; back number = `<Text>` `String(profile.jersey)` `#f4f0ea` under `spine_03` facing −forward. Offsets in bone space tuned visually; missing bone → skip that piece.

- [ ] **Step 1: Failing tests** `toonify.test.ts` (node): a `Group` with meshes whose materials are named `Jersey`, `Shorts`, `Skin` (`color #c88a5c`), `Mystery` → Jersey mesh `material === materials.jersey`; Shorts → `materials.shorts`; Skin → `MeshToonMaterial` with colour `#c88a5c` and `gradientMap === gradientMap`; Mystery → MeshToonMaterial (no throw); SkinnedMesh keeps its skeleton.
- [ ] **Step 2:** FAIL. **Step 3:** implement. **Step 4:** `npm test` PASS.
- [ ] **Step 5:** Visual check: player faces +x at spawn, idle at rest, jog when walking without foot-slide (adjust `RUN_REF_SPEED` in `locomotion.ts` only); route-block the GLB in a quick Playwright script → capsule, walking works.
- [ ] **Step 6:** Commit `feat: CC0 avatar with idle/run blend, gear, capsule fallback`.

### Task 9: Look e2e, perf check, README (after all)

**Files:** Create `e2e/arena-look.spec.ts`. Modify `README.md`.

Helpers: reuse `trackErrors`, `trackExternal`, `ready` from `e2e/arena.spec.ts` (copy; no shared module change). `canvasPixels(page)` = `sharp(await page.locator('canvas').screenshot()).raw()` → RGBA buffer. `modelNoise = /player\.glb|Failed to load resource|net::ERR_FAILED|above error occurred/`.

- [ ] **Step 1: Write e2e (desktop only):**
  - Look smoke: `/#/arena` → ready; `data-fx="full"`; `data-draw-calls` ∈ (1, 150] (**RF4**: > 1 proves whole-frame counting); no errors; **RF2:** no external requests (jsDelivr/gstatic included); screenshot: luminance std-dev > 10 (non-blank) and ≥ 200 pixels with r > 150, g < 60, b < 100 (scarlet neon present); `data-avatar` becomes `model` within 15 s.
  - **RF3** low-power: `/?fx=low#/arena` → ready, `data-fx="low"`, draw calls ≤ 150, scarlet pixels still present, no errors.
  - **RF1** model failure: `page.route('**/models/player.glb', r => r.abort())` → ready; `data-avatar="capsule"` within 10 s; hold ArrowUp → prompt `tranquility-base` appears; no `pageerror`; console errors all match `modelNoise`.
  - **RF1** slow model: route delays 4 s then `continue()` → ready while `data-avatar="loading"`; then `model` within 20 s; no errors.
  - **RF5** reduced motion: `test.use({ reducedMotion: 'reduce' })`, `/#/arena` → ready, `data-motion="reduced"`, wait for `data-avatar` ≠ loading + 1 s; two canvas screenshots 1 s apart differ in ≤ 0.5 % of pixels (channel delta > 8).
  - Existing `e2e/arena.spec.ts` and `e2e/boxscore.spec.ts` unchanged and passing.
- [ ] **Step 2:** `npm run e2e`; fix failures in the owning task's files.
- [ ] **Step 3:** `npm run e2e` PASS in both projects, 3 consecutive runs. `npm run build` passes; record initial JS, arena total, GLB size, draw calls (full / low) in the commit body.
- [ ] **Step 4:** README: look tuning lives in `src/arena/look/theme.ts`; `?fx=low` / `VITE_ARENA_FX=low`; avatar rebuild — download both Quaternius [Standard] zips from itch into `_source/models/`, unzip to `ubc/` and `ual/`, `npm run models`; credits: Quaternius Universal Base Characters + Universal Animation Library (CC0).
- [ ] **Step 5:** Commit `test: arena look e2e (smoke, low-power, model fallback, reduced motion) and readme`.

## Executor notes

- `@react-three/postprocessing@2` only; v3 needs R3F 9. The spike measured arena chunk ≈ 304 KB gzip with it.
- With an EffectComposer the last pass resets `gl.info` — that is why ReadySignal counts with `autoReset = false`. Don't "fix" a reading of 1 any other way.
- Scarlet neon with `toneMapped:false` drifts pink above ~4; the deeper `#b0002a` emissive keeps `ringHot` (4.9) red. Tune `theme.neon`, not materials.
- Troika renders each `<Text>` as its own draw call and builds SDFs in a blob worker (same-origin, fine). Any new 3D string must go through `toFontSafe` and into the fontSafe test list.
- InstancedMesh frustum culling uses the base geometry's bounds — call `computeBoundingSphere()` on the instanced mesh after writing matrices or the crowd pops out at screen edges.
- The look-spike worktree is reference only; don't merge from it.
