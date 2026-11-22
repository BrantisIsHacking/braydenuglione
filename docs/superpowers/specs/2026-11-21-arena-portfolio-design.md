# Arena Portfolio — Design

## Context
Brayden (Rutgers Honors, CS + DS sophomore) wants a portfolio site that stands out to **Summer 2027 SWE / DS / ML internship recruiters**: a 3D, toon-shaded, scarlet-and-black basketball arena where the court is his timeline and "stations" open panels about his work. Recruiting is underway, so a clean, linkable version must ship first; the arena is the differentiator layered on top. The repo (`portfolio/`) is empty except raw source material (resume, screenshots, notebooks, a 527 MB documentary, headshot). Content was gathered by interview this session (Appendix A). Resume is the source of truth for every fact/number.

## Decisions (locked)
| Area | Decision |
|---|---|
| Audience | Recruiters first → **college-first**: spawn at half court facing the Rutgers end; Morris Tech is a compact "throwback" end behind; personal stuff in the locker room |
| Look | Toon shading + neon/bloom, **Rutgers scarlet (#CC0033) + black + white** (= Tech Devils colors). No Rutgers/NASA/NBA logos — text and colors only |
| Camera / avatar | Third-person; generic low-poly player in scarlet jersey **#29** (class of 2029; one field in `profile.ts`), model swappable later |
| Shooting | **Scripted arc** (no physics engine): hold-to-charge timing meter → make/miss decided by timing → ball flies a computed parabola (make = swish; miss = rim-out). Miss still opens the panel ("And-1 — here's the info anyway") |
| Audio | On by default, unlocked by the "Tip-off" start click; mute toggle always visible; mute state remembered |
| Mobile / a11y | Phones (and `prefers-reduced-motion`, no-WebGL, low-memory) open the **2D Box Score** view by default with an "Enter the arena" button. "Skip to box score" always visible in 3D |
| Assets | Arena built from code geometry; CC0 (Kenney / Quaternius) avatar + props |
| Hosting | Free: **Cloudflare Pages** (`<project>.pages.dev`) from GitHub, **Cloudflare Web Analytics** (cookieless). No paid domain |
| Excluded | Roles the owner chose to omit (see private notes). Phone number never published (resume PDF contains it → no PDF download until a phone-free copy exists) |
| Workflow | Opus orchestrates; **Sonnet subagents implement** each task (one owner per file set to avoid conflicts) |

## Stack
React 18 + TypeScript + Vite · React Three Fiber + drei (`Outlines`, `KeyboardControls`, `Text`) · `@react-three/postprocessing` (Bloom) · Zustand · Vitest + Playwright · `sharp` script for image conversion. Code-split: the 2D shell/Box Score loads with no three.js; the arena chunk is lazy-loaded.

## Information architecture
- `/#/` → desktop: Tip-off screen → arena. Mobile: Box Score.
- `/#/box-score` → 2D view (semantic HTML, all content, filters: Projects / Experience / Leadership / Throwback / About).
- `/#<station-id>` (e.g. `/#tranquility-base`) → arena spawns at that station with panel open; on 2D it scrolls to that card.
- HUD: season year of nearest station, "Stations unlocked 7/30", mute, Box Score button.

## Court layout (college-first)
```
            THROWBACK END (Morris Tech, compact)        ★ spawn        RUTGERS END (most stations, the hoop)
 baseline: robotics, advisory, hackmcst,    |  half court:   |  3-pt arc: projects (Tranquility, DreamsComeTrue,
           nslc, java-juniors, ai-camp,     |  rutgers-honors|           DebateMate, Zayi AI Studio, Airbnb, Vestibular)
           oculogica/vestibular             |  code-ninjas,  |  paint / scorer's table: zayi-fellow (BTT+Zayi), usacs,
                                            |  shah-sokoloff,|           hackru, calc-ii-la, ambassador, orientation-leader
                                            |  ccm, critics- |  bench (sideline): teaching & mentoring summary
                                            |  choice        |  rafters: banners · jumbotron + press table: contact
 side tunnel → LOCKER ROOM (interests)
```
Station positions live in content data (`pos: [x, z]`), not code.

## Content model (`src/content/`)
- `stations.ts`: typed `Station[]` — `id, zone, title, org, role, start, end, oneLiner, body, bullets[≤3], stat{value,label}|null, tech[], links[], media[], credits?, shotCaption, pos, kind: 'standard'|'terminal'|'video'`.
- `banners.ts`, `lockerRoom.ts` (easter eggs: one object each → user adds more by appending), `profile.ts` (name, intro, links, email, targets "SWE · Data Science · ML").
- Copy is written by Claude from Appendix A, first person, recruiter-scannable; numbers exactly as on resume.
- Vitest schema test enforces: unique ids, required fields, https links, bullets ≤3, oneLiner ≤90 chars, **no phone-number pattern anywhere in content or built HTML**.
- Special panels: `terminal` (Zayi AI Studio metrics: hit@5 95%, citation validity 100%, quality 78.8%, 85 tests — presented as team results + Brayden's role; Airbnb NN vs LR table; Vestibular notebook plots); `video` (documentary: poster image, click-to-load `youtube-nocookie` embed of qGuouXZMmC4).

## Assets pipeline
1. Move raw inputs into `_source/` (gitignored): resume PDF, `H3 Final.mp4` (527 MB — must never be committed), notebooks, movies PDF, Zayi txt. Copy Tech Devils logo + team photo from the temp image dir into `_source/` **first thing** (temp may be cleared).
2. `scripts/build-media.mjs` (sharp): screenshots + headshot + team photo → `public/media/<station>/*.webp` (max 1600 px, q≈80); extract base64 plots from both notebooks → webp; generate OG image (headshot + scarlet court).
3. Budget: 2D first load < 200 KB JS gz; arena total < 5 MB; 60 fps on a mid laptop.

## Arena systems (`src/arena/`)
- `Court.tsx` (floor, lines as emissive strips, logo-free center circle with "UGLIONE '29" wordmark), `Arena.tsx` (stands, crowd billboards, rafters, jumbotron), `Hoop.tsx` (both ends).
- `Player.tsx`: kinematic capsule, WASD/arrows + virtual joystick (nipplejs-free custom touch pad), bounds clamp, idle/run/shoot animation from CC0 rig.
- `CameraRig.tsx`: third-person follow with lerp, collision-free (open court).
- `Station.tsx`: glowing floor ring + floating label; proximity (≤2 m) shows "Press E / tap to shoot".
- `shot.ts` (pure, unit-tested): meter value over time, `isMake(release)`, `arcPoints(from, rim, make)`; `Ball.tsx` animates along it; confetti + swish on make, rim clank on miss; panel opens either way.
- `store.ts` (Zustand): unlocked ids (localStorage, try/catch), active panel, muted, mode.
- `Panel.tsx` (HTML overlay, focus-trapped, Esc closes) shared with 2D cards via `StationContent.tsx`.

## Phases (each ships to `*.pages.dev`)
0. **Setup** — `_source/` + `.gitignore`, design doc at `docs/superpowers/specs/2026-11-21-arena-portfolio-design.md`, then `superpowers:writing-plans` for the task-level plan; Vite scaffold; Cloudflare Pages + Web Analytics hookup (user does the dashboard clicks).
1. **Box Score MVP (the link for applications)** — all content written, media pipeline, 2D view, deep links, OG tags, schema tests. Deploy.
2. **Arena graybox** — court layout, player, camera, stations, panels, HUD, Tip-off screen, desktop/mobile routing.
3. **The look** — toon gradient map, outlines, scarlet neon + bloom, banners, jumbotron, crowd, CC0 avatar.
4. **The game** — shot meter + arc, audio (swish/clank/crowd, CC0), confetti, unlock counter, banners drop on unlock.
5. **Personality** — locker room easter eggs; timed 3-point contest with local high score.
6. **Polish** — a11y pass (keyboard-only, screen reader on Box Score), perf tuning, Lighthouse, README.

Sonnet task split per phase (Opus reviews each): content-writer (stations.ts copy) · media-pipeline · box-score UI · arena-scene · player/camera/controls · shot system · HUD/panels · tests/CI.

## Verification
- `npm run test` (Vitest): content schema + no-phone check, `shot.ts` math, store persistence.
- `npm run e2e` (Playwright): desktop — Tip-off → arena canvas renders, walk to a station, shoot, panel opens on make and miss, `/#tranquility-base` deep link; mobile viewport — Box Score is default, every station card present, "Enter the arena" works; no console errors.
- `npm run build` size report vs budget; Lighthouse on Box Score (Perf/A11y ≥ 90).
- Manual: Chrome + Safari + a phone on the live `pages.dev` URL; check analytics shows visits.


## Content source
Facts gathered by interview live in `_source/docs/content-notes.md` (gitignored, private). Resume is the source of truth.
