import { test, expect, type Page } from '@playwright/test'
import { WORLD, drawCalls, holdUntil, pose, ready, settle, trackErrors, walkTo } from '../helpers'

test.beforeEach(async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'desktop flows')
  await page.addInitScript(() => sessionStorage.setItem('world.started', '1'))
})

const prompt = (page: Page) => page.getByTestId('prompt')
const dialog = (page: Page) => page.getByRole('dialog', { name: /varsity golf/i })

async function sceneFloor(page: Page) {
  const w = page.locator(WORLD)
  return { scene: await w.getAttribute('data-scene'), floor: await w.getAttribute('data-floor') }
}

for (const fx of ['full', 'low'] as const) {
  for (const f of [1, 2]) {
    test(`floor ${f} (${fx}): draw calls <= 150`, async ({ page }) => {
      const errors = trackErrors(page)
      await page.goto(`${fx === 'low' ? '/?fx=low' : '/'}#/b/golf-clubhouse${f === 1 ? '' : `/${f}`}`)
      await ready(page, 'golf-clubhouse', f)
      const dc = await drawCalls(page)
      console.log(`draw calls golf-clubhouse floor ${f} ${fx}: ${dc}`)
      expect(dc).toBeGreaterThan(1)
      expect(dc).toBeLessThanOrEqual(150)
      expect(errors, errors.join('\n')).toEqual([])
    })
  }
}

test('golf deep link opens its panel at the scorecard', async ({ page }) => {
  await page.goto('/#golf')
  await ready(page, 'golf-clubhouse', 1)
  await expect(dialog(page)).toBeVisible()
  await expect
    .poll(async () => {
      const p = await pose(page)
      return Math.hypot(p.x + 4, p.z + 5.5)
    })
    .toBeLessThan(0.3)
})

test('walk in to the scorecard prompt', async ({ page }) => {
  await page.goto('/#/b/golf-clubhouse')
  await ready(page, 'golf-clubhouse', 1)
  await settle(page)
  await walkTo(page, -4, -5.5)
  await expect(prompt(page)).toHaveAttribute('data-exhibit', 'golf')
  await page.keyboard.press('e')
  await expect(dialog(page)).toBeVisible()
})

test('clubhouse pad to course, south exit back, no cascade, Back leaves', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/#/world')
  await ready(page, 'world')
  await page.evaluate(() => {
    location.hash = '#/b/golf-clubhouse'
  })
  await ready(page, 'golf-clubhouse', 1)
  await settle(page)
  const before = await page.evaluate(() => history.length)
  await walkTo(page, 0, -9)
  await page.keyboard.down('ArrowUp')
  try {
    await ready(page, 'golf-clubhouse', 2)
  } finally {
    await page.keyboard.up('ArrowUp')
  }
  expect(page.url()).toContain('#/b/golf-clubhouse/2')
  expect(await page.evaluate(() => history.length)).toBe(before)
  await expect(page.locator('.world-hud__where').filter({ hasText: 'Golf Clubhouse · Course' })).toBeVisible()
  await settle(page)
  await expect
    .poll(async () => {
      const p = await pose(page)
      return Math.hypot(p.x, p.z + 2)
    })
    .toBeLessThan(0.3)

  // hold the key through the stairs: lands on floor 1 and stays there
  await page.keyboard.down('ArrowDown')
  try {
    await page.waitForFunction(() => document.querySelector('[data-world-focus]')?.getAttribute('data-floor') === '1', undefined, { polling: 'raf', timeout: 15_000 })
    await ready(page, 'golf-clubhouse', 1)
    await page.waitForTimeout(1500)
    expect(await sceneFloor(page)).toEqual({ scene: 'golf-clubhouse', floor: '1' })
  } finally {
    await page.keyboard.up('ArrowDown')
  }
  expect(page.url()).toMatch(/#\/b\/golf-clubhouse$/)

  await page.goBack()
  await ready(page, 'world')
  await expect
    .poll(async () => {
      const p = await pose(page)
      return Math.hypot(p.x - 28, p.z - 26.5)
    })
    .toBeLessThan(0.3)
  expect(errors, errors.join('\n')).toEqual([])
})

test('spawning on the course does not cascade', async ({ page }) => {
  await page.goto('/#/b/golf-clubhouse/2')
  await ready(page, 'golf-clubhouse', 2)
  await settle(page)
  await page.waitForTimeout(1500)
  expect(await sceneFloor(page)).toEqual({ scene: 'golf-clubhouse', floor: '2' })
})

test('hostile floors land on the clubhouse', async ({ page }) => {
  const errors = trackErrors(page)
  for (const f of ['3', '0', 'x']) {
    await page.goto(`/#/b/golf-clubhouse/${f}`)
    await page.reload()
    await ready(page, 'golf-clubhouse', 1)
  }
  expect(errors, errors.join('\n')).toEqual([])
})

test('course scorecard stop opens golf', async ({ page }) => {
  await page.goto('/#/b/golf-clubhouse/2')
  await ready(page, 'golf-clubhouse', 2)
  await settle(page)
  await walkTo(page, 16.4, -24.3)
  await expect(prompt(page)).toHaveAttribute('data-exhibit', 'golf')
  await page.keyboard.press('e')
  await expect(dialog(page)).toBeVisible()
})

test('walk out of the clubhouse', async ({ page }) => {
  await page.goto('/#/b/golf-clubhouse')
  await ready(page, 'golf-clubhouse', 1)
  await settle(page)
  await page.keyboard.down('ArrowDown')
  try {
    await page.waitForFunction(() => document.querySelector('[data-world-focus]')?.getAttribute('data-scene') === 'world', undefined, { polling: 'raf' })
  } finally {
    await page.keyboard.up('ArrowDown')
  }
  await ready(page, 'world')
  await expect
    .poll(async () => {
      const p = await pose(page)
      return Math.hypot(p.x - 28, p.z - 26.5)
    })
    .toBeLessThan(0.3)
  await page.waitForTimeout(1500)
  await expect(page.locator(WORLD)).toHaveAttribute('data-scene', 'world')
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })
  test('the ride to the course has no fade', async ({ page }) => {
    await page.goto('/#/b/golf-clubhouse')
    await ready(page, 'golf-clubhouse', 1)
    await expect(page.locator(WORLD)).toHaveAttribute('data-motion', 'reduced')
    await settle(page)
    await page.evaluate(() => {
      const w = window as unknown as { __seen: Set<string> }
      w.__seen = new Set()
      const tick = () => {
        const v = document.querySelector('[data-world-focus]')?.getAttribute('data-transition')
        if (v) w.__seen.add(v)
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    await holdUntil(page, 'ArrowUp', ({ z }) => z <= -8)
    await page.keyboard.down('ArrowUp')
    try {
      await ready(page, 'golf-clubhouse', 2)
    } finally {
      await page.keyboard.up('ArrowUp')
    }
    const seen = await page.evaluate(() => [...(window as unknown as { __seen: Set<string> }).__seen])
    expect(seen).not.toContain('fading-out')
  })
})
