import { test, expect, type Page } from '@playwright/test'
import { WORLD, holdUntil, pose, ready, trackErrors, trackExternal } from './helpers'

test.beforeEach(({}, info) => {
  test.skip(info.project.name !== 'desktop', 'desktop keyboard navigation')
})

const hash = (page: Page) => page.evaluate(() => window.location.hash)
const histLen = (page: Page) => page.evaluate(() => window.history.length)

/** Scene committed and the fade-in finished (input is ignored until the phase is idle). */
async function settled(page: Page, scene: string) {
  await ready(page, scene)
  await expect(page.locator(WORLD)).toHaveAttribute('data-transition', 'idle')
}

async function explore(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Explore' }).click()
  await settled(page, 'world')
}

/** Holds `key` until `cond()` (evaluated in the page every frame) holds, then releases it. */
async function holdUntilPage(page: Page, key: string, cond: () => boolean, timeout = 20_000) {
  await page.keyboard.down(key)
  try {
    await page.waitForFunction(cond, undefined, { polling: 'raf', timeout })
  } finally {
    await page.keyboard.up(key)
  }
}

async function expectPose(page: Page, x: number, z: number, tol = 0.1) {
  await expect
    .poll(
      async () => {
        const p = await pose(page)
        return Math.max(Math.abs(p.x - x), Math.abs(p.z - z))
      },
      { timeout: 5_000 },
    )
    .toBeLessThanOrEqual(tol)
}

/** Guards: no console/page errors, no cross-origin requests. */
function guards(page: Page, baseURL: string, ignore?: Parameters<typeof trackErrors>[1]) {
  const errors = trackErrors(page, ignore)
  const external = trackExternal(page, baseURL)
  return () => {
    expect(errors, errors.join('\n')).toEqual([])
    expect(external, external.join('\n')).toEqual([])
  }
}

test('walk to the Gym door and back out, then stay put', async ({ page, baseURL }) => {
  const check = guards(page, baseURL!)
  await explore(page)
  await holdUntil(page, 'ArrowRight', ({ x }) => x >= 19.6)
  await holdUntilPage(page, 'ArrowUp', () => document.querySelector('[data-world-focus]')?.getAttribute('data-scene') !== 'world')
  await settled(page, 'gym')
  expect(await hash(page)).toBe('#/b/gym')

  await holdUntilPage(page, 'ArrowDown', () => document.querySelector('[data-world-focus]')?.getAttribute('data-scene') !== 'gym')
  await settled(page, 'world')
  await expectPose(page, 20, -5.5)
  expect(await hash(page)).toBe('#/world')
  // RF1: no door re-trigger loop
  await page.waitForTimeout(1500)
  await expect(page.locator(WORLD)).toHaveAttribute('data-scene', 'world')
  expect(await hash(page)).toBe('#/world')
  check()
})

test('deep links: exhibit in a building, hostile and ambiguous hashes', async ({ page, baseURL }) => {
  const check = guards(page, baseURL!)
  await page.goto('/#tranquility-base')
  await settled(page, 'workshop')
  await expect(page.getByRole('dialog', { name: 'Tranquility Base' })).toBeVisible()
  await expect(page.getByText('Exhibits visited 1/46')).toBeVisible()
  const before = await histLen(page)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect.poll(() => hash(page)).toBe('#/b/workshop')
  expect(await histLen(page)).toBe(before)

  // RF5: mirrors never change the home building
  await page.goto('/#critics-choice')
  await settled(page, 'campus-quad')
  await page.goto('/#chess')
  await settled(page, 'world')
  await expect(page.getByRole('dialog', { name: 'Chess' })).toBeVisible()
  check()
})

test('hostile #/b/ shows the start screen on a fresh visit', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ baseURL, viewport: { width: 1280, height: 800 } })
  const page = await ctx.newPage()
  const check = guards(page, baseURL!)
  await page.goto('/#/b/')
  await expect(page.getByRole('button', { name: 'Explore' })).toBeVisible()
  check()
  await ctx.close()
})

test('cold #/b/<id> spawns at the interior entrance with no panel', async ({ page, baseURL }) => {
  const check = guards(page, baseURL!)
  await page.goto('/#/b/library')
  await settled(page, 'library')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expectPose(page, 0, -2, 0.2)
  check()
})

test('legacy #/arena redirects to the gym without an extra history entry', async ({ page, baseURL }) => {
  const check = guards(page, baseURL!)
  await page.goto('/#/arena')
  const right = await histLen(page)
  await settled(page, 'gym')
  expect(await hash(page)).toBe('#/b/gym')
  expect(await histLen(page)).toBe(right)
  check()
})

test('Scouting Office: HUD button and door both reach the Box Score; Back restores the pose', async ({ page, baseURL }) => {
  const check = guards(page, baseURL!)
  await explore(page)
  await holdUntil(page, 'ArrowRight', ({ x }) => x >= 3)
  await page.waitForTimeout(300)
  const before = await pose(page)
  await page.getByRole('button', { name: 'Scouting Office' }).click()
  await expect(page.locator('[data-exhibit]')).toHaveCount(46)
  expect(await hash(page)).toBe('#/box-score')
  await page.goBack()
  await settled(page, 'world')
  await expect(page.getByRole('button', { name: 'Explore' })).toHaveCount(0)
  await expectPose(page, before.x, before.z)

  // walk into the door (lane z = 0 is clear)
  await holdUntil(page, 'ArrowLeft', ({ x }) => x <= -7.9)
  await holdUntilPage(page, 'ArrowUp', () => window.location.hash === '#/box-score')
  await expect(page.locator('[data-exhibit]')).toHaveCount(46)
  await page.goBack()
  await settled(page, 'world')
  await expectPose(page, -8, 0)
  check()
})

test('map fast travel pushes history; Back and Forward round trip', async ({ page, baseURL }) => {
  const check = guards(page, baseURL!)
  await explore(page)
  await page.keyboard.press('m')
  await expect(page.getByRole('dialog', { name: 'Map' })).toBeVisible()
  await page.getByRole('button', { name: 'Library', exact: true }).click()
  await settled(page, 'library')
  expect(await hash(page)).toBe('#/b/library')
  await page.goBack()
  await settled(page, 'world')
  await expectPose(page, -36, -7)
  await page.goForward()
  await settled(page, 'library')
  check()
})

test('RF3: Back mid-fade settles on the world and the URL', async ({ page, baseURL }) => {
  const check = guards(page, baseURL!)
  await explore(page)
  await page.getByRole('button', { name: 'Map' }).click()
  await page.getByRole('button', { name: 'Gym', exact: true }).click()
  await page.goBack()
  await expect
    .poll(
      async () => {
        const w = page.locator(WORLD)
        return `${await w.getAttribute('data-scene')}|${await w.getAttribute('data-transition')}|${await hash(page)}`
      },
      { timeout: 8_000 },
    )
    .toMatch(/^world\|idle\|(#\/world)?$/)
  await page.waitForTimeout(1000)
  await expect(page.locator(WORLD)).toHaveAttribute('data-scene', 'world')
  await expect(page.locator(WORLD)).toHaveAttribute('data-transition', 'idle')
  // '' is the world route too: Explore from the start screen leaves the URL bare
  expect(await hash(page)).toMatch(/^(#\/world)?$/)
  check()
})

test('RF2: a failed interior chunk toasts, returns to the door, and a retry works', async ({ page, baseURL }) => {
  const check = guards(page, baseURL!, (m) => /Failed to load resource|net::ERR_FAILED|Interior-/.test(m.text()))
  const pattern = '**/assets/Interior-*.js'
  await page.route(pattern, (r) => r.abort())
  await explore(page)
  await holdUntil(page, 'ArrowRight', ({ x }) => x >= 19.6)
  await holdUntilPage(page, 'ArrowUp', () => document.body.innerText.includes("Couldn't open this building"))
  await expect(page.getByText("Couldn't open this building")).toBeVisible()
  await settled(page, 'world')
  await expectPose(page, 20, -5.5, 0.3)
  expect(await hash(page)).toBe('#/world')

  await page.unroute(pattern)
  await page.waitForTimeout(500)
  await holdUntilPage(page, 'ArrowUp', () => document.querySelector('[data-world-focus]')?.getAttribute('data-scene') !== 'world')
  await settled(page, 'gym')
  check()
})

test('panel filter typing does not move the player', async ({ page, baseURL }) => {
  const check = guards(page, baseURL!)
  await page.goto('/#books')
  await settled(page, 'library')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.waitForTimeout(300)
  const before = await pose(page)
  const filter = page.getByRole('searchbox', { name: 'Filter books' })
  await filter.click()
  await filter.pressSequentially('orwell')
  await expect(page.getByRole('dialog').locator('ul.collection__list li')).toHaveCount(2)
  await page.waitForTimeout(300)
  expect(await pose(page)).toEqual(before)
  check()
})
