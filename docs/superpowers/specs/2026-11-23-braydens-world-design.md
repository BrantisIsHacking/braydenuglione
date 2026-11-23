# Brayden's World — Design

Status: approved direction, ready for planning. Supersedes the *arena-only* parts of `2026-11-21-arena-portfolio-design.md` (court layout, locker room, phases 4–6). That spec **stays binding** for the site-wide rules: Box Score fast path, mobile/reduced-motion default to 2D, palette, budgets, privacy, hosting, stack.

Items marked **(my call)** were decided by the spec author, not the owner. Items marked **(my call (controller))** answer a builder check and were decided by the controller. A builder may follow either kind as written; changing one needs a sentence of justification in the plan.

---

## 1. Intent

The site today is a 2D Box Score (the recruiter link) plus a lazy-loaded 3D basketball arena. The arena is one room, and one room can't hold everything Brayden is: projects, internships, leadership, school, and many interests (books, films, games, music, sports).

**Brayden's World** turns the 3D part into a small open world, seen from a fixed three-quarter top-down camera (the readability of a classic 16-bit adventure game, but an original world, not a copy of any game or existing portfolio site). Visitors walk a little town. Each thing he loves gets its own building, career content sits in themed gallery-like buildings, and a **Scouting Office** at spawn gives recruiters the clean overlay of everything (the existing Box Score) in one click.

Why: it's memorable and it scales. A new interest is a new building in data, not a re-layout of a court. The Box Score keeps the recruiter path fast and accessible.

## 2. Goals, non-goals, anti-goals

**Goals**
1. A recruiter reaches every fact in **one click** from any 3D screen (Scouting Office button), and on phones sees the Box Score first, as today.
2. A curious visitor can find every exhibit by walking, and none is more than ~10 s of walking from spawn (plus a fast-travel map).
3. Every existing deep link (`#<station-id>`, `#/box-score`, `#/arena`) keeps working.
4. Interiors can be built **in parallel** by separate builders without touching shared files beyond one registry line.
5. Adding an interest later is **data-only** (it appears in a generic hall until someone builds a bespoke interior).
6. Simple graphics: low-poly primitives, toon shading, stable 60 fps on a mid laptop.

**Non-goals (for Stages 1–3)**
- Audio, the shot-meter mini-game, quests, NPC dialogue, day/night cycle, physics engine, multiplayer, save slots.
- Camera rotation, free zoom beyond 3 steps, click-to-move.
- Bespoke 3D models beyond the existing CC0 avatar GLB (everything else is code geometry).

**Anti-goals (never)**
- Any real business name or logo as signage, any school logo. Never write the high-school team nickname on its own, in text or image. The robotics team's full name, "Tech Devils", is allowed. **(my call (controller))**
- Copyrighted art: no box art, film posters, album covers, team crests. Team, game, film, and artist names are plain text only.
- Phone numbers, private-term content, health information, omitted roles. Same rules and scanners as today.
- Gating facts behind gameplay. Every exhibit's content is also in the Box Score.
- Raw reference photos in the repo or build. They are for style only.

## 3. Constraints (carried from the binding spec and the Phase 2/3 plans)

- Stack unchanged: React 18 + TS + Vite, R3F 8 + drei 9, `@react-three/postprocessing@2`, Zustand, Vitest, Playwright, Cloudflare Pages.
- **Initial JS ≤ 200 KB gzip.** three/R3F/zustand reachable only through dynamic imports (`check-dist` guard stays).
- **Total 3D payload (gzip of `dist/assets/**` + `dist/models/**`) < 5 MB.** Unchanged. These two size limits are the only hard walls; per-chunk numbers in §8 are targets.
- 60 fps on a mid laptop; `dpr [1, 1.75]` (low-power `1`; coarse pointer capped at 1.5); no shadow maps. Draw calls: **world ≤ 200, each interior ≤ 150**, counted across the whole frame (existing ReadySignal method) **(my call (controller))**.
- `canRunArena` rules unchanged: phones (coarse + short side < 768), `prefers-reduced-motion`, no WebGL, deviceMemory < 4 → Box Score by default with an "Explore Brayden's World" button.
- All look values live in the theme system (`src/arena/look/theme.ts` → moved, see §10); `effectiveTheme()` applies reduced-motion / low-power cuts.
- All 3D strings go through `toFontSafe`. Troika `<Text>` costs one draw call each, so cap it (§8).
- Content facts come from the resume and existing public content. Nothing from the private notes enters the repo unless it already appears in public content or the owner supplies it for publication.

## 4. Approaches

**A. Outdoor map + door-to-interior scenes (CHOSEN by owner).** One outdoor world scene. Walking into a door fades to black, unmounts the world, lazy-loads that building's interior chunk, fades in. Walking out reverses it and puts you at the door. Pros: each interior is an isolated chunk and an isolated folder, so builders work in parallel and the payload grows per visit, not up front. Draw-call budget applies per scene, so each interior can be rich. The current arena drops in as the Gym interior almost as-is. Cons: a load/fade at each door, and two camera framings to tune.

**B. One seamless world, buildings with cut-away roofs.** Everything in one scene and one chunk, and you see inside a building when you walk in. Why not: every interior's geometry and text is in memory and in the draw-call budget at once (17 buildings won't fit 150 draw calls), the chunk can't be split, and parallel builders collide in one scene file.

**C. Hub menu / diorama selector.** A 3D town you click on, and each building opens a separate 3D page; no walking. Why not: it loses the "explore to learn about him" intent, and it's barely different from the Box Score.

## 5. The world

### 5.1 Camera **(my call)**
- Perspective, FOV 40°, **fixed yaw looking north** (screen-up = north), pitch 55° below horizontal. No rotation.
- Outdoors: camera distance 18 m from player. Interiors: 12 m. Three zoom steps (×0.75, ×1, ×1.3) via mouse wheel, `+`/`-`, and pinch, clamped.
- Follow: exponential lerp toward the player with a 1 m dead-zone, using the existing `smoothing(dt, reducedMotion)` (reduced = snap). Clamped so the view never shows past the map edge.
- Occlusion: **every door faces south** (toward the camera), so exteriors never hide the player. Interiors are dollhouse rooms, with the south wall at ≤ 0.6 m high (or omitted).

### 5.2 Controls **(my call)**
- Keyboard: WASD / arrows = **screen-relative 8-direction movement** (replaces Phase 2 tank steering). The avatar turns smoothly to face its move direction. Speed stays `SPEED = 6` m/s.
- Interact: **E**, Enter, or Space when the prompt shows (proximity ≤ 2 m, existing logic). Doors need no key; walking into the door trigger enters.
- Esc closes a panel or menu. **M** opens the Map (fast travel). Single-letter keys only work while the 3D canvas wrapper has focus (WCAG 2.1.4).
- Touch (tablets, or phones that chose "Explore"): the existing joystick bottom-left, plus a round **Interact** button bottom-right that shows only when a prompt is active. Pinch zooms between the 3 steps.
- **Tablets (my call (controller)):** coarse pointer with short side ≥ 768 gets 3D by default, with the joystick and Interact button. `dpr` is capped at 1.5 for coarse pointers. The existing FPS monitor auto-switches to low power. Touch laptops are classified by the pointer media query, so they count as fine-pointer when a mouse is present.
- Collision: circle (player r 0.4) vs axis-aligned boxes from layout data. A pure `collide()` in `logic/`, unit-tested. No physics engine.

### 5.3 Map size and layout **(my call)**
- Playable area **96 m (x) × 80 m (z)**. Spawn at the Town Square center, facing north. Farthest door is ≤ 42 m away (~7 s at 6 m/s).
- Career District is north, straight up the main road from spawn, because recruiters come first. Culture Row is west, Sports Side is east. A running loop path circles the whole map.

```
                                   N ↑
 +--------------------------------------------------------------------------------+
 | ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  RUNNING LOOP ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  |
 | ·   [CAMPUS QUAD]   [HQ TOWER]  ║  [CIVIC CENTER]   [THE WORKSHOP]            · |
 | ·        \_____________\________║________/_______________/   CAREER DISTRICT  · |
 | ·                               ║ main road                                    · |
 | ·  [LIBRARY]   [PLAYHOUSE]      ║                [GYM]          [FAN SHOP]     · |
 | ·                  +------------╨-------------+                                · |
 | ·  [CINEMA]        | [SCOUTING]   ★   [HALL   |   (CHESS PARK)   (PARK:        · |
 | ·                  | [ OFFICE ] fountain [OF FAME] |   table         roundnet)  · |
 | ·  [RECORD STORE]  |       (MAILBOX/PRESS)    |                                · |
 | ·                  +------------╥-------------+        [GOLF CLUBHOUSE]        · |
 | ·  [ARCADE]   CULTURE ROW       ║ south gate            SPORTS SIDE            · |
 | ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  · |
 +--------------------------------------------------------------------------------+
 [ ] = enterable interior   ( ) = outdoor spot in the world scene   ★ = spawn
```
Exact coordinates belong to the builder, in `src/world/logic/layout.ts` as data. Rules: doors ≥ 8 m apart, every door reachable from spawn (tested with a flood fill), and no door within 6 m of spawn.

### 5.4 Building kinds **(my call)**
| Kind | Behavior | Members |
|---|---|---|
| `interior` | Door → fade → lazy interior chunk | Hall of Fame, Workshop, HQ Tower, Civic Center, Campus Quad, Gym, Golf (clubhouse door → mini 9-hole course scene), Library, Cinema, Record Store, Playhouse, Arcade, Fan Shop |
| `overlay` | Door navigates to `#/box-score` (no 3D load) | Scouting Office |
| `spot` | Outdoor prop in the world scene, interact → panel | Mailbox/Press Desk, Chess Park, Park (roundnet), running-loop marker |

### 5.5 Door → interior system
- Trigger: player center enters the door box → store `enter(buildingId)` → 250 ms fade to black → world unmounts → interior chunk loads behind a "Loading…" sign on black → interior mounts, ReadySignal fires → 250 ms fade in. Reduced motion: hard cuts, no fades.
- **Prefetch (my call):** when the player is within 10 m of a door, call that building's `import()` (no render) so most entries are instant.
- Exit: walk into the interior's exit trigger (always at the south edge, center) → reverse → world remounts with the player 1.5 m south of that door, facing south. The world pose is kept in the store, so Back/Forward and the Box Score round-trip restore it.
- If a chunk fails to load, show an in-scene toast "Couldn't open this building", put the player back at the door, and leave the rest of the world working. An `ArenaBoundary` failure of the world itself falls back to the Box Score with a notice (as today).
- One 3D `<Canvas>` for the whole session. Scenes swap inside it, so the WebGL context and the avatar GLB load once.

### 5.6 Buildings and contents (owner-decided; station mapping is my call)
Every exhibit has an id, a **home building**, and (only in bespoke interiors) an interior-local position. Some exhibits also appear as **mirrors** in other buildings (same id, and the panel is the same). A deep link always goes to the home building.

**Town Square**
- **Scouting Office** (`overlay`): Box Score. An always-visible HUD button does the same.
- **Hall of Fame** (`interior`): all `banners.ts` entries as hanging banners and trophy pedestals: Critic's Choice Prize, NASA Space Apps NYC Best Use of Code & Technology, Best Use of Gemini, Bloodiest Game (NSLC at UCLA), Academy Scholar, Rising Star, honor societies. Mirror: `critics-choice` (documentary screen).
- **Mailbox / Press Desk** (`spot`): `profile` email, GitHub, LinkedIn, Devpost, the Summer 2027 SWE / DS / ML internship line. Opens a Contact panel.

**Career District** (home buildings for all 24 stations)
| Building | Exhibits (station ids) | Exhibit prop (science-museum / gallery style) |
|---|---|---|
| The Workshop | `tranquility-base`, `dreams-come-true`, `debate-mate`, `zayi-ai-studio`, `airbnb-classifier`; mirror `oculogica` | moon globe on a plinth; giant open storybook; pair of debate podiums; server rack + results board; mini city blocks + bar chart; eye-tracking exhibit (giant eye + trace screen) |
| HQ Tower (one floor per internship, elevator pad switches floors) | F4 `zayi-fellow` (Zayi / Break Through Tech + Cornell AI lab); F3 `oculogica`, `ai-camp` (med-ML); F2 `code-ninjas` (dojo classroom); F1 `shah-sokoloff` (IT server room) | floor-themed rooms |
| Civic Center | `usacs` (lecture hall + mentorship board), `hackru` (judging hall), `calc-ii-la` (classroom), `honors-ambassador` + `orientation-leader` (tour desk), `teaching-mentoring` (bench) | — |
| Campus Quad | `rutgers-honors` (Honors Hall: degrees, courses, favorite classes), `critics-choice` (**home**), `ccm` (certificate), Morris Tech wing: `robotics` (lab: team photo, AprilTag story), `advisory-council`, `hackmcst`, `nslc`, `java-juniors` | — |

Count check: 6 + 5 + 6 + 8 − 1 mirror = 24 home placements. **(my call)** `oculogica` lives in HQ Tower (it's an internship) and is mirrored in the Workshop. `critics-choice` lives in the Campus Quad (career content ships in Stage 2, so the documentary deep link is never homeless) and is mirrored in the Cinema and Hall of Fame.

**Interests**
| Building | Contents |
|---|---|
| Gym | Restyled current arena (§9). Exhibits: `basketball` (season stats: 2023–24 28 pts / 6 games, 2024–25 84 pts / 20 games, career 112 / 26, 12-pt high), mirror `rising-star`. |
| Golf (clubhouse → mini course) | 9 tiny holes. Scorecard exhibit: best nine-hole round 40 (+5), varsity golf, Morris County Tournament. Course and venue names generic. |
| Library | Exterior: low red-brick modern building, flat roof, wide entry canopy, concrete steps with rails, big windows, trees. Interior: tall white shelves holding **all** his books as instanced spines (no text on spines), mustard armchairs, wooden chairs, gray carpet, string lights. A favorites display table (current favorites from public content). A "Shelf" panel lists every book. Goodreads link. |
| Cinema | Exterior: a glowing arched night entrance merged with a campus-storefront look (bold red block-letter "CINEMA" on a white band, slatted canopy, poster windows). A walk-in hall of **12** favorite-film posters (owner decision) (generated typographic cards: title, year, flat color, no studio art). Screen exhibit: mirror `critics-choice` (click-to-load embed, §7). IMDb link. |
| Record Store / Stage | Top 12 artists in order as a wall of record crates or numbered sleeves (text only). Small stage with a mic: `karaoke` (Karaoke Club). |
| Playhouse | `stranger-things` (Stranger Things on Broadway via Theater Appreciation): marquee, red curtain, stage. |
| Arcade | Exterior: old red-brick bank with white columns + a white/teal boardwalk-arcade facade with marquee bulbs and a neon "ARCADE" sign. Interior: blue/white checkered floor, one glowing cabinet per game: Rocket League (Champion), FIFA (series), Fortnite, LEGO Star Wars: The Complete Saga, Ultimate Chicken Horse, Lovers in a Dangerous Spacetime, Heave Ho, Astro Bears, Forza Horizon, Kinect Sports, Just Dance, Halo, Apex Legends, Call of Duty: Warzone, Splitgate, Star Wars Battlefront, NBA 2K, Madden. Cabinet art = game name in text + a flat color, nothing else. |
| Fan Shop | Jerseys/scarves as plain colored racks with text: Giants, Knicks, Yankees, Rangers; Manchester City, Barcelona, Bayern Munich, Juventus, NY Red Bulls, NYCFC. No crests or logos. |
| Chess Park (`spot`) | A chess table; `chess` panel with chess.com profile. |
| Park (`spot`) | Roundnet set (`roundnet`). Running loop around the map with a marker sign reading **"5K loop"** (no time or event) **(owner decision)**. |

**Signage rule:** generic nouns ("LIBRARY", "CINEMA", "ARCADE", "GYM", "WORKSHOP") or "Brayden's ___". Never a real business, venue, or school name or logo. Building names in the table are what the signs say.

## 6. Routing

| Hash | Result (3D-capable) | Result (Box Score default device) |
|---|---|---|
| `#/` or empty | Start screen → world at spawn | Box Score |
| `#/world` | World at spawn (skips start screen if already started this session) | World (explicit opt-in, needs WebGL) |
| `#/b/<building-id>` | That interior, at its entrance | Interior (opt-in) |
| `#<exhibit-id>` | Home building of that exhibit, player in front of it, panel open | Box Score scrolled to the card |
| `#/box-score` | Box Score | Box Score |
| `#/arena` | **Legacy alias** → `replaceState` to `#/b/gym` | as `#/b/gym` |
| unknown | World at spawn (no panel) | Box Score |

**History (my call (controller)):**
- `pushState` on entering a building, exiting one, and Map fast-travel. Fast-travel uses the same fade as doors.
- Opening a panel `replaceState`s to `#<id>`. Closing it `replaceState`s back to `#/b/<building>` (or `#/world`).
- Back from a building returns to `#/world` and restores the stored world pose: the player at that building's door, facing south.
- Cold load of `#/b/<id>` spawns at that interior's entrance. Cold load of `#<exhibit>` spawns in its home building at the exhibit, with the panel open.
- The store keeps `worldPose` (last outdoor pose) and `scene`. The history sync layer is **one module** with unit tests for every transition above.

`parseHash` / `resolveView` stay pure and unit-tested. Exhibit ids, building ids, and route words share one namespace and must be unique (schema test).

**Start screen (my call):** the Tip-off screen is retitled "Brayden's World", with two buttons: **Explore** (3D) and **Scouting Report** (Box Score). It's kept because it's the future audio-unlock gesture and gives a no-3D choice up front.

## 7. How content is shown

- **One panel component.** The existing `Panel.tsx` (focus-trapped, Esc closes) renders `StationContent` for stations and a new `ExhibitContent` for banners, interests, and collections. Both are shared with Box Score cards, so 3D and 2D never diverge.
- Exhibits in 3D are props + a proximity ring + an optional floating label. Reading always happens in the HTML panel, never in 3D text.
- Long collections (books, films, games, artists, teams) render in the panel as plain lists. Books get an alphabetical list with favorites first, plus a filter input.
- **Video:** any `critics-choice` placement opens the existing `video` panel (poster + click-to-load `youtube-nocookie` iframe in the DOM). The 3D screen shows only the poster image. Never an iframe or video texture in WebGL. Never autoplay.
- Box Score gains sections replacing "Locker Room": **Hall of Fame** (banners), **Off the clock** (each interest building, with its collection lists in `<details>`), and **Contact**. Every exhibit id appears exactly once in the Box Score (tested).
- HUD: building name (replaces season year), "Exhibits visited n/N", **Scouting Office** button, **Map** button, mute stub hidden until audio exists. Visited persistence is unchanged (localStorage, try/catch).
- **Map / fast travel (my call):** an HTML dialog listing every building (with its exhibits nested), keyboard and screen-reader friendly. Choosing one goes to its route. This is also the keyboard-only way to reach every exhibit without walking.

## 8. Loading strategy, budgets, performance

**Hard limits** (build fails): initial JS ≤ 200 KB gzip, and total < 5 MB. Everything else below is a **target**: `check-dist` prints a warning when a chunk exceeds its target, but the build still passes **(my call (controller))**.

Chunks and targets:
1. **Initial** (no three): shell, routing, Box Score, content. **≤ 200 KB gzip (hard).**
2. **Engine**: three, R3F, drei, postprocessing, zustand, Player, the shared kit, and every 3D piece reused across scenes (Hoop, court lines, Jumbotron/scoreboard, crowd/stands instancing, Text font, Panel/HUD/Map). Target **≤ 400 KB gzip** (current arena chunk ≈ 304 KB).
3. **World scene** (map, exteriors, spots, layout data): target **≤ 150 KB gzip.**
4. **Each interior**: target **≤ 120 KB gzip JS**, Gym **≤ 150 KB**, plus up to ~300 KB of its own assets. Assets are only webp images already produced by `build-media`; no new models unless a GLB passes the existing model guards.
5. Player GLB: existing ≤ 400 KB raw guard.

Total **< 5 MB (hard)**; estimate ≈ 2.4 MB with all interiors. World ready in ≤ 4 s on fast 4G on a mid laptop.

Performance **(my call (controller))**:
- Draw calls: **world ≤ 200, each interior ≤ 150**. E2e enforces this for the world, Gym, and generic hall; other scenes are spot-checked.
- Building massing is merged per district into a few meshes.
- Outlines only on the player, doors, and interactive props, never on building shells.
- Instance anything repeated (trees, lamps, shelves, book spines, seats, cabinets, bulbs).
- Signs stay troika `<Text>`, **≤ 24 per scene**. Labels show for the nearest 6 exhibits only. Atlas baking is not needed unless the cap is exceeded.
- Player shadow = blob decal. 60 fps on a mid laptop. The low-power fx mode and FxGovernor apply to every scene.

## 9. The Gym (first interior)

The current arena moves to `src/world/interiors/gym/` and is restyled to a high-school gym (owner's references):
- Red steel roof trusses (instanced), white cinder-block walls (flat white + thin line grid, no texture image), red/black pull-out bleachers (reuse stands layout, stepped), sparse crowd (≈ 25% of current instances) **(my call)**.
- Light hardwood court with a **red-painted key**, white painted lines (no neon bloom in the gym) **(my call)**, center circle with the existing "UGLIONE '29" wordmark and **no logo**.
- Red wall scoreboard (rework of the jumbotron: same rotating stat lines, now basketball season numbers + the existing project stat lines). Red/black championship-style banners in the rafter slots, using basketball-related text only (no school name, no team nickname).
- Scorer's table with generic text ("WELCOME" / "HOME OF #29") **(my call)**. Both hoops kept.
- Exhibits: `basketball`, mirror `rising-star`. All other current court stations leave the gym for their career buildings.
- Exit trigger at the south baseline door.

## 10. Code structure and fate of existing code

```
src/world/                 (was src/arena/; git mv to keep history)  (my call)
  WorldApp.tsx             lazy entry: one Canvas, scene switcher, overlays
  store.ts                 + scene (extensible union), worldPose, enter/exit, floor
  history.ts               the one history-sync module (§6), unit-tested
  logic/                   pure + unit-tested: layout, collide, doors, camera, movement (8-dir), proximity, routing glue
  look/theme.ts            + district palettes, per-building accents
  kit/                     Room (dollhouse shell), Door, Sign, Pedestal, Shelf, Poster, Cabinet, Banner, ExhibitMarker
  scene/                   Player, avatar/, CameraRig, Effects, FxGovernor, ReadySignal (moved, shared)
  world/                   outdoor map scene (chunk 3)
  interiors/registry.ts    id → () => import('./<id>/Interior')   ← the only shared line per new interior
  interiors/generic/       Exhibit Hall: auto-lays out any building's exhibits on pedestals
  interiors/<id>/Interior.tsx
  ui/                      Hud, Panel, Prompt, Joystick, InteractButton, MapDialog
```
Interior contract: `export default function Interior({ theme, reducedMotion, spawnAt, floor }: InteriorProps): JSX.Element`. It renders its room, props, and exhibit markers from `exhibitsIn(buildingId)` and declares `BOUNDS` and colliders. Player, camera, panel, and HUD are provided by `WorldApp`.

Any `interior` building without a bespoke folder uses `generic`. **So every building and every deep link works from Stage 1**, and Stages 2–3 just swap in bespoke interiors **(my call)**.

**Generic Exhibit Hall (my call (controller)):**
- Single floor. Pedestals and frames are auto-laid out in rows of 4, the hall grows longer with exhibit count, and bounds are computed from the count.
- Authored `pos` is ignored, and mirrors get auto-placed slots.
- HQ Tower uses the generic hall until Stage 2, with all its exhibits on one floor. Floors and the elevator come in Stage 2.
- A deep link to an exhibit opens its panel regardless of floor.

**Scene kinds (my call (controller)):** `scene` is an extensible union. Stage 1 needs only `{kind:'world'}` and `{kind:'interior', id}`. Golf in Stage 3 may add `{kind:'course', id}`, with its exit at the clubhouse.

**The unpublished `phase-3-look` branch (my call (controller)):** Stage 0 means finishing its Task 9 (look e2e + README) and merging it. Stage 1 branches from `phase-3-look` after Task 9 lands. **Owner decision:** Stage 0 is **not** deployed publicly; the phase-3 arena work merges into the world branch and launches together with Stage 1. Superseded parts of the old spec: Phase 4 shot game (deferred; may return as a Gym mini-game), Phase 5 locker room (replaced by interest buildings), Phase 6 polish (folded into each stage's exit criteria).

## 11. Content model changes (`src/content/`)

- `types.ts`:
  - `Station`: drop `zone` (arena-only). Add `building: BuildingId` and `floor?: number` (HQ Tower). `pos` becomes **optional**, interior-local metres, and is authored only for bespoke interiors. The schema test requires `pos` only when the exhibit's building is marked `bespoke: true`. The generic hall ignores it, and mirrors in generic halls have none **(my call (controller))**. Keep `category` (drives Box Score filters).
  - New `Building = { id, name, sign, district: 'square'|'career'|'culture'|'sports', kind: 'interior'|'overlay'|'spot', stage: 1|2|3, bespoke: boolean, accent: ThemeColorKey, blurb }`. It has no coordinates; those live in `world/logic/layout.ts`, keyed by id.
  - New `Interest = { id, building, title, oneLiner, detail?, link?, collection?: CollectionId, pos? }` (replaces `LockerItem`; existing locker ids keep their ids. `fifa-23` becomes `fifa` with "FIFA (series)").
  - `Banner` gains `building: 'hall-of-fame'` and `pos?`.
  - New `Mirror = { exhibitId, building, pos?, floor? }`.
  - Collections, one file each: `books.ts` `{ title, author, favorite?: boolean }[]`, `films.ts` `{ title, year, onDisplay?: boolean }[]`, `games.ts` `{ title, note? }[]`, `artists.ts` (ordered `string[]`), `teams.ts` `{ name, sport }[]`.
- Files: `buildings.ts`, `interests.ts` (replaces `lockerRoom.ts`), `mirrors.ts`, the collection files, plus `exhibits.ts` helpers: `getExhibit(id)`, `homeBuilding(id)`, `exhibitsIn(building)`.
- **Adding a new interest later:** append a `Building` (stage 3, kind `interior`) + its `Interest` rows (+ optional collection file) + a layout slot. It appears immediately in the generic hall, the Map, and the Box Score. A bespoke interior is optional follow-up work.

## 12. Art rules ("simple graphics")

- Geometry: boxes, cylinders, cones, extruded shapes from code. Building exteriors ≤ ~1k tris each and recognizable by silhouette + sign + 2 accent colors. No image textures except existing media webps on screens and boards.
- Shading: existing toon gradient (`[70,160,255]`), outlines only on the player, doors, and interactive props, never on building shells **(my call (controller))**. Bloom only on emissive things (neon signs, marquee bulbs, cabinets, screens). Daylight world: flat sky color, no fog.
- Palette **(my call)**: base stays scarlet `#cc0033` / black `#0a0a0a` / off-white `#f4f0ea` + neutrals. Town Square: stone + off-white + scarlet trim. Career District: scarlet/black/white (brand). Each interest building adds ≤ 2 named accent colors in `theme.ts` drawn from its reference (Library brick red + mustard; Cinema red sign + warm glow; Arcade teal + white + brick; Gym red/black/white + hardwood; Golf greens; Fan Shop neutral racks with team text). Grass and paths are muted so buildings carry the color. The theme test's palette-membership rule extends to the accent list.
- Motion: idle/run avatar only. Gentle sign pulse, bulb chase, and cabinet glow are all disabled by `effectiveTheme` under reduced motion and low power.

## 13. Accessibility, mobile, reduced motion

- Box Score stays the default for phones, reduced motion, no WebGL, and low memory (unchanged `canRunArena`). Its "Enter the arena" button becomes "Explore Brayden's World".
- In 3D: **"Skip to box score" link first in tab order**, then the Scouting Office, Map, and HUD buttons. All are always visible and keyboard reachable. The canvas wrapper has an `aria-label` describing the controls. The panel is focus-trapped and returns focus on close.
- Everything is reachable without walking via the Map dialog. Every exhibit's content is in the Box Score.
- If a reduced-motion user opts into 3D: no fades, snap camera, no ambient animation, bloom × 0.6 (existing rule).

## 14. Testing

- **Vitest (content):** unique ids across stations, banners, interests, buildings, and route words; every exhibit's `building` exists and is the right kind; every mirror references an existing exhibit; every interior building has ≥ 1 exhibit; HQ floors set only on HQ exhibits. Existing rules: no phone pattern, private-term scan (extended to all new content files and built HTML/GLB). A signage test: every `sign` string is from the generic allow-list or matches `^Brayden's `. The reference-business names go in the private terms file (owner-side, not this public doc). **Do not** add the team nickname as a private term: the robotics team name contains it and would trip the scanner. The nickname rule is enforced by review and the signage allow-list instead **(my call (controller))**.
- **Vitest (logic):** `parseHash` / `resolveView` for every row of §6; `collide`; door triggers; layout (doors ≥ 8 m apart, none within 6 m of spawn, all reachable from spawn by grid flood fill); camera clamp; 8-dir movement; store `enter`/`exit` and worldPose restore; the history module (push on enter/exit/fast-travel, replace on panel open/close, Back restores pose, cold loads); generic-hall layout (bounds grow with count, rows of 4).
- **Playwright (desktop):** start → world ready; walk into the Gym door → `data-scene="gym"` ready → exit → back at the door; `#tranquility-base` → Workshop with the panel open; `#/arena` → `#/b/gym`; Scouting Office button → Box Score, Back → world with no start screen; Map → jump to the Library; Back → world at the Library door; draw calls world ≤ 200, Gym and generic hall ≤ 150 (full and `?fx=low`); no console errors; no external requests before a video click.
- **Playwright (mobile + reduced motion):** Box Score default; card count = exhibit count; "Explore" works on a tablet viewport.
- `npm run build`: fails on initial > 200 KB or total ≥ 5 MB; warns on chunk targets.

## 15. Staging (Stages 1–3 each ship to `*.pages.dev`; Stage 0 does not)

**Stage 0 — close out Phase 3.** Finish `phase-3-look` Task 9 (e2e + README) and merge it into the world branch. Stage 1 branches after that. **No public deploy** (owner decision); it launches with Stage 1, which is the first stage to ship to `*.pages.dev`.

**Stage 1 — world shell.** Move `src/arena` → `src/world`; content-model migration (§11) with **all** 24 stations, banners, and interests assigned to buildings; routing (§6) incl. the legacy `#/arena`; outdoor map with all exteriors as simple massing + signs; 8-dir movement, collision, top-down camera, zoom; Town Square with Scouting Office (overlay), Hall of Fame (generic hall is fine), Mailbox spot; door → interior system with prefetch and fades; Gym restyled as the first bespoke interior; generic Exhibit Hall for every other building; Map dialog; start screen; Box Score sections; tests and budgets. *Exit: every deep link lands in the right building; e2e green.*

**Stage 2 — career buildings** (4 parallel builders, one folder each): Workshop, HQ Tower (floors + elevator), Civic Center, Campus Quad, plus a bespoke Hall of Fame.

**Stage 3 — interest buildings** in parallel batches:
- Batch 3a: Library, Cinema, Arcade (reference-driven exteriors, collections).
- Batch 3b: Record Store / Stage, Playhouse, Fan Shop.
- Batch 3c: Golf mini course; Chess Park, Park, and running-loop polish.

Batch 3a is gated on the owner's book list and film list (generic hall + current public favorites until then).

## 16. Left to the builder

Exact coordinates and the footprint of each building; interior room layouts and prop design within §12; sign copy within the signage rule; label and caption wording (first person, resume facts only); district accent hex values (within the rules); elevator UX details; Golf hole shapes; how the generic hall lays out pedestals; the task split and parallelism in each stage's plan.

## 17. Pending owner inputs

None. Received 2026-11-23: the 12 Cinema films (in the owner's order: Return of the Jedi, Avengers: Endgame, Cars, The Dark Knight, The Shawshank Redemption, The Matrix, Caddyshack, Talladega Nights, Raiders of the Lost Ark, Inception, Fight Club, The Prestige) and the full book list (~75 shelf entries after removing single poems, short stories, essays, a speech, activity books and two mega-anthologies; series shown as one entry each). The builder seeds `src/content/library.ts` and `src/content/cinema.ts` from the owner's lists, which live in the private notes until committed as content.
