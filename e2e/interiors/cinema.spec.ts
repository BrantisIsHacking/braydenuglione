import { test, expect, type Page } from '@playwright/test'
import { WORLD, drawCalls, holdUntil, pose, ready, settle, trackErrors, trackExternal } from '../helpers'

test.beforeEach(async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'desktop flows')
  await page.addInitScript(() => sessionStorage.setItem('world.started', '1'))
})

const prompt = (page: Page) => page.getByTestId('prompt')

for (const fx of ['full', 'low'] as const) {
  test(`draw calls (${fx}) <= 150`, async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto(`${fx === 'low' ? '/?fx=low' : '/'}#/b/cinema`)
    await ready(page, 'cinema')
    await settle(page)
    const dc = await drawCalls(page)
    console.log(`draw calls cinema ${fx}: ${dc}`)
    expect(dc).toBeGreaterThan(1)
    expect(dc).toBeLessThanOrEqual(150)
    expect(errors, errors.join('\n')).toEqual([])
  })
}

async function settled(page: Page) {
  await ready(page, 'cinema')
  await expect(page.locator(WORLD)).toHaveAttribute('data-transition', 'idle')
  await expect(page.locator(WORLD)).toHaveAttribute('data-pose', /,/)
}

test('deep link opens the movies panel at the first poster', async ({ page }) => {
  await page.goto('/#movies')
  await ready(page, 'cinema')
  await expect(page.getByRole('dialog', { name: /movies/i })).toBeVisible()
  await expect
    .poll(async () => {
      const p = await pose(page)
      return Math.hypot(p.x + 1.5, p.z + 9)
    })
    .toBeLessThan(0.3)
})

test('walk the hallway: a poster prompt opens the movies panel', async ({ page }) => {
  await page.goto('/#/b/cinema')
  await settled(page)
  await holdUntil(page, 'ArrowUp', ({ z }) => z <= -9.2)
  await expect(prompt(page)).toHaveAttribute('data-exhibit', 'movies')
  await page.keyboard.press('e')
  await expect(page.getByRole('dialog', { name: /movies/i })).toBeVisible()
})

test('walk to the screen: critics-choice opens, no cross-origin before the play click', async ({ page, baseURL }) => {
  test.setTimeout(150_000)
  const external = trackExternal(page, baseURL!)
  const errors = trackErrors(page)
  await page.goto('/#/b/cinema')
  await settled(page)
  await holdUntil(page, 'ArrowUp', ({ z }) => z <= -40.6, 90_000)
  await expect(prompt(page)).toHaveAttribute('data-exhibit', 'critics-choice')
  await page.keyboard.press('e')
  const dialog = page.getByRole('dialog', { name: /critic/i })
  await expect(dialog).toBeVisible()
  await expect(page.locator(WORLD)).toHaveAttribute('data-scene', 'cinema')
  await page.waitForTimeout(500)
  expect(external, external.join('\n')).toEqual([])
  expect(errors, errors.join('\n')).toEqual([])
})

test('walk out through the south exit', async ({ page }) => {
  await page.goto('/#/b/cinema')
  await settled(page)
  await page.keyboard.down('ArrowDown')
  try {
    await expect(page.locator(WORLD)).toHaveAttribute('data-scene', 'world', { timeout: 20_000 })
  } finally {
    await page.keyboard.up('ArrowDown')
  }
})
