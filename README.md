# Brayden Uglione: portfolio

A portfolio site built as a basketball-arena "box score". Each project, job, and activity is a station with a one-liner, a few bullets, a stat, and links, and you can filter and deep-link to any of them (for example `/#tranquility-base`). A 3D arena version (Phase 2 graybox) reuses the same content.

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

## Arena

Routes: `#/box-score` (the 2D box score), `#/arena` (the 3D arena, with a Tip-off screen first), and `#<station-id>` (on desktop, opens the arena at that station with its panel open; on phones or reduced motion, scrolls to the card).

Controls: W A S D or arrow keys to move, E to open the nearby station, Escape to close a panel. On touch devices use the on-screen joystick and tap the prompt. `Skip to box score` is always available.

Station positions are the `pos: [x, z]` field of each station in `src/content/stations.ts` (metres, court is 28 x 15 centred at the origin, +x toward the Rutgers end). After editing a `pos`, run `npm test`; the placement test checks bounds, spacing between stations, and distance from spawn.

E2E browser config: `playwright.config.ts` uses `channel: 'chromium'` so the full Chromium build (with software WebGL) runs the arena. Projects are `desktop` and `mobile` (Pixel 7). The arena specs are in `e2e/arena.spec.ts`.

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

### Add a locker-room easter egg

Append one object to the end of the list in `src/content/lockerRoom.ts`. The shape is `LockerItem` from `src/content/types.ts`:

```ts
{
  id: 'speedcubing',            // unique, lowercase, no spaces
  title: 'Speedcubing',
  oneLiner: 'Best 3x3 solve: 24 seconds.',
  detail: 'Optional longer text.',                       // optional
  link: { label: 'example.com', url: 'https://example.com' }, // optional, https only
  shotCaption: 'Twenty-four flat. Buzzer beater.',
},
```

### Edit a station

Stations are in `src/content/stations.ts`. Station ids are used by deep links and by tests, so do not rename them. The tests in `tests/content.test.ts` enforce:

- ids match the agreed roster
- `oneLiner` is at most 90 characters
- at most 3 `bullets`
- every link starts with `https://`
- no phone numbers anywhere

Run `npm test` after editing.

## Privacy rule

Never put phone numbers or private notes in this repo, including in comments and in `public/`. The build runs `scripts/check-dist.mjs`, which fails if a phone pattern appears in `dist/` or if the JavaScript size budget (200 KB gzip) is exceeded.
