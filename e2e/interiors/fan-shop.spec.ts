import { test, expect, type Page } from '@playwright/test'
import { WORLD, drawCalls, pose, ready, settle, trackErrors, walkTo } from '../helpers'

test.beforeEach(async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'desktop flows')
  await page.addInitScript(() => sessionStorage.setItem('world.started', '1'))
})

const prompt = (page: Page) => page.getByTestId('prompt')

for (const fx of ['full', 'low'] as const) {
  test(`draw calls (${fx}) <= 150`, async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto(`${fx === 'low' ? '/?fx=low' : '/'}#/b/fan-shop`)
    await ready(page, 'fan-shop')
    await settle(page)
    const dc = await drawCalls(page)
    console.log(`draw calls fan-shop ${fx}: ${dc}`)
    expect(dc).toBeGreaterThan(1)
    expect(dc).toBeLessThanOrEqual(150)
    expect(errors, errors.join('\n')).toEqual([])
  })
}

test('teams deep link opens its panel at the counter', async ({ page }) => {
  await page.goto('/#teams')
  await ready(page, 'fan-shop')
  await settle(page)
  await expect(page.getByRole('dialog', { name: /teams/i })).toBeVisible()
  const p = await pose(page)
  expect(Math.hypot(p.x - 0, p.z - -4.5)).toBeLessThan(0.3)
})

test('walk in to the counter prompt', async ({ page }) => {
  await page.goto('/#/b/fan-shop')
  await ready(page, 'fan-shop')
  await settle(page)
  await walkTo(page, 0, -4.5)
  await expect(prompt(page)).toHaveAttribute('data-exhibit', 'teams')
  await page.keyboard.press('e')
  await expect(page.getByRole('dialog', { name: /teams/i })).toBeVisible()
})

test('the scarf wall opens the panel on Manchester City', async ({ page }) => {
  await page.goto('/#/b/fan-shop')
  await ready(page, 'fan-shop')
  await settle(page)
  await walkTo(page, 5, -10.5)
  await expect(prompt(page)).toHaveAttribute('data-exhibit', 'teams')
  await page.keyboard.press('e')
  await expect(page.getByRole('dialog', { name: /teams/i })).toBeVisible()
  await expect(page.locator('[aria-current="true"]')).toHaveText(/Manchester City/)
})

test('the jersey rack opens the panel on Giants', async ({ page }) => {
  await page.goto('/#/b/fan-shop')
  await ready(page, 'fan-shop')
  await settle(page)
  await walkTo(page, -5, -10.5)
  await page.keyboard.press('e')
  await expect(page.getByRole('dialog', { name: /teams/i })).toBeVisible()
  await expect(page.locator('[aria-current="true"]')).toHaveText(/Giants/)
})

test('walk out through the south exit', async ({ page }) => {
  await page.goto('/#/b/fan-shop')
  await ready(page, 'fan-shop')
  await settle(page)
  await page.keyboard.down('ArrowDown')
  try {
    await expect(page.locator(WORLD)).toHaveAttribute('data-scene', 'world', { timeout: 20_000 })
  } finally {
    await page.keyboard.up('ArrowDown')
  }
  await settle(page)
  const p = await pose(page)
  expect(Math.hypot(p.x - 38, p.z - -7.5)).toBeLessThan(0.3)
  await page.waitForTimeout(1500)
  await expect(page.locator(WORLD)).toHaveAttribute('data-scene', 'world')
})
